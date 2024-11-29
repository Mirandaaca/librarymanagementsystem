// Configuración base para las peticiones
const API_URL = 'https://documentalmanage-001-site1.otempurl.com/api';

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allPrestamos = [];
let filteredPrestamos = [];
let currentPrestamoId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await initializeSelects();
    await cargarPrestamos();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });

    // Inicializar Select2 para selects múltiples
    initializeSelect2();
});

// También podemos añadir una validación cuando se selecciona una persona en el select
function initializeSelect2() {
    $('#persona').select2({
        placeholder: 'Seleccione una persona',
        width: '100%'
    }).on('select2:select', async function(e) {
        const idPersona = parseInt(e.params.data.id);
        const tienePrestamosActivos = await verificarPrestamosActivos(idPersona);
        if (tienePrestamosActivos) {
            $(this).val(null).trigger('change');
        }
    });

    $('#ejemplares').select2({
        placeholder: 'Seleccione ejemplares',
        width: '100%',
        language: {
            noResults: function() {
                return "No se encontraron ejemplares disponibles";
            }
        }
    });
}
// Funciones para cargar datos iniciales
async function initializeSelects() {
    try {
        showLoading();
        const [personas, ejemplares] = await Promise.all([
            fetch(`${API_URL}/Personas/ObtenerPersonas`).then(r => r.json()),
            fetch(`${API_URL}/Prestamos/ObtenerEjemplaresNoAsociadosAUnPrestamo`).then(r => r.json())
        ]);

        if (personas.succeded) {
            const selectPersona = document.getElementById('persona');
            selectPersona.innerHTML = '<option value="">Seleccione una persona</option>';
            personas.data.forEach(persona => {
                const option = document.createElement('option');
                option.value = persona.id;
                option.textContent = `${persona.nombre} ${persona.apellido} (${persona.registro})`;
                selectPersona.appendChild(option);
            });
        }

        if (ejemplares.succeded) {
            const selectEjemplares = document.getElementById('ejemplares');
            selectEjemplares.innerHTML = '';
            ejemplares.data.forEach(ejemplar => {
                const option = document.createElement('option');
                option.value = ejemplar.id;
                option.textContent = `${ejemplar.titulo} (${ejemplar.correlativo})`;
                selectEjemplares.appendChild(option);
            });
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar los datos iniciales');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Funciones para modales
function openModal(type) {
    const modalId = `${type}Modal`;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        
        if (type === 'prestamo' && !editMode) {
            document.getElementById('prestamoForm').reset();
            document.getElementById('prestamoModalTitle').textContent = 'Nuevo Préstamo';
            document.querySelectorAll('.create-only-fields').forEach(el => el.style.display = 'block');
            $('#persona').val(null).trigger('change');
            $('#ejemplares').val(null).trigger('change');
        }
    }
}

function closeModal(type) {
    const modal = document.getElementById(`${type}Modal`);
    modal.classList.add('opacity-0', 'pointer-events-none');
    
    if (type === 'prestamo') {
        document.getElementById('prestamoForm').reset();
        editMode = false;
    }
}

// Funciones de utilidad
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

function showNotification(icon, title, text) {
    Swal.fire({
        icon,
        title,
        text,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Funciones de paginación
function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredPrestamos.length);
    const totalItems = filteredPrestamos.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function displayPrestamos() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagePrestamos = filteredPrestamos.slice(start, end);

    const tbody = document.getElementById('tablaPrestamos');
    tbody.innerHTML = '';

    pagePrestamos.forEach(prestamo => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prestamo.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${prestamo.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prestamo.persona.nombreCompleto}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(prestamo.fechaPrestamo)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="badge ${prestamo.estado ? 'badge-success' : 'badge-warning'}">
                    ${prestamo.estado ? 'Devuelto' : 'En Préstamo'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <button onclick="mostrarEjemplares(${prestamo.id})" class="text-indigo-600 hover:text-indigo-900">
                    <span class="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        ${prestamo.ejemplares?.length || 0} ejemplares
                    </span>
                </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="verDetalle(${prestamo.id})" class="text-blue-600 hover:text-blue-900 mr-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                </button>
                <button onclick="editarPrestamo(${prestamo.id})" class="text-indigo-600 hover:text-indigo-900 mr-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                ${!prestamo.estado ? `
                    <button onclick="registrarDevolucion(${prestamo.id})" class="text-green-600 hover:text-green-900 mr-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </button>
                ` : ''}
                <button onclick="eliminarPrestamo(${prestamo.id})" class="text-red-600 hover:text-red-900">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePaginationInfo();
}

// Funciones CRUD y gestión de ejemplares
async function cargarPrestamos() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Prestamos/ObtenerPrestamosActivos`);
        const data = await response.json();

        if (data.succeded) {
            allPrestamos = data.data;
            filteredPrestamos = [...allPrestamos];
            displayPrestamos();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar los préstamos');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Función para verificar préstamos activos
async function verificarPrestamosActivos(idPersona) {
    try {
        const response = await fetch(`${API_URL}/Prestamos/VerificarPrestamosActivos?idPersona=${idPersona}`);
        const data = await response.json();

        if (data.succeded && data.data.tienePrestamosActivos) {
            const prestamo = data.data.prestamoActivo;
            await Swal.fire({
                icon: 'warning',
                title: 'No se puede crear el préstamo',
                html: `Esta persona ya tiene un préstamo activo:<br><br>
                      <div class="text-left">
                        <strong>Préstamo:</strong> ${prestamo.nombre}<br>
                        <strong>Fecha:</strong> ${formatDate(prestamo.fechaPrestamo)}<br>
                        <strong>Descripción:</strong> ${prestamo.descripcion}
                      </div>`,
                confirmButtonText: 'Entendido'
            });
            return true; // Tiene préstamos activos
        }
        return false; // No tiene préstamos activos
    } catch (error) {
        console.error('Error al verificar préstamos activos:', error);
        showNotification('error', 'Error', 'No se pudo verificar los préstamos activos');
        return true; // Por seguridad, si hay error, no permitimos crear el préstamo
    }
}

// Modificación de la función handleSubmitPrestamo
async function handleSubmitPrestamo(event) {
    event.preventDefault();
    
    const prestamoData = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim()
    };

    if (editMode) {
        prestamoData.id = parseInt(document.getElementById('prestamoId').value);
    } else {
        const idPersona = parseInt($('#persona').val());
        
        // Verificar préstamos activos antes de continuar
        const tienePrestamosActivos = await verificarPrestamosActivos(idPersona);
        if (tienePrestamosActivos) {
            return; // Detener la creación del préstamo
        }

        prestamoData.idPersona = idPersona;
        prestamoData.ejemplaresIds = $('#ejemplares').val().map(id => parseInt(id));
    }

    try {
        showLoading();
        const url = editMode ? 
            `${API_URL}/Prestamos/ActualizarPrestamo` : 
            `${API_URL}/Prestamos/CrearPrestamo`;

        const response = await fetch(url, {
            method: editMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(prestamoData)
        });

        if (response.ok) {
            showNotification('success', 'Éxito', `Préstamo ${editMode ? 'actualizado' : 'creado'} correctamente`);
            closeModal('prestamo');
            await cargarPrestamos();
        } else {
            showNotification('error', 'Error', `No se pudo ${editMode ? 'actualizar' : 'crear'} el préstamo`);
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function editarPrestamo(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Prestamos/ObtenerPrestamoPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            editMode = true;
            const prestamo = data.data;
            
            document.getElementById('prestamoId').value = prestamo.id;
            document.getElementById('nombre').value = prestamo.nombre;
            document.getElementById('descripcion').value = prestamo.descripcion;
            
            // Ocultar campos que no se pueden editar
            document.querySelectorAll('.create-only-fields').forEach(el => el.style.display = 'none');
            
            document.getElementById('prestamoModalTitle').textContent = 'Editar Préstamo';
            openModal('prestamo');
        } else {
            showNotification('error', 'Error', 'No se pudo cargar el préstamo');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function verDetalle(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Prestamos/ObtenerDetallePrestamo?idPrestamo=${id}`);
        const data = await response.json();

        if (data.succeded) {
            const prestamo = data.data;
            
            // Llenar información básica
            document.getElementById('detalle-nombre').textContent = prestamo.nombre;
            document.getElementById('detalle-fecha').textContent = formatDate(prestamo.fechaPrestamo);
            document.getElementById('detalle-persona').textContent = prestamo.persona.nombreCompleto;

            // Separar ejemplares en pendientes y devueltos
            const ejemplaresPendientes = document.getElementById('ejemplares-pendientes');
            const ejemplaresDevueltos = document.getElementById('ejemplares-devueltos');
            
            ejemplaresPendientes.innerHTML = '';
            ejemplaresDevueltos.innerHTML = '';

            prestamo.ejemplares.forEach(ejemplar => {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
                
                if (!ejemplar.fechaDevolucion) {
                    div.innerHTML = `
                        <div>
                            <p class="font-medium">${ejemplar.tituloLibro}</p>
                            <p class="text-sm text-gray-500">Correlativo: ${ejemplar.correlativo}</p>
                            <p class="text-sm text-gray-500">Prestado: ${formatDate(ejemplar.fechaPrestamo)}</p>
                        </div>
                        <button onclick="registrarDevolucionEjemplar(${ejemplar.idDetallePrestamo})" 
                                class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                            Registrar Devolución
                        </button>
                    `;
                    ejemplaresPendientes.appendChild(div);
                } else {
                    div.innerHTML = `
                        <div>
                            <p class="font-medium">${ejemplar.tituloLibro}</p>
                            <p class="text-sm text-gray-500">Correlativo: ${ejemplar.correlativo}</p>
                            <p class="text-sm text-gray-500">Prestado: ${formatDate(ejemplar.fechaPrestamo)}</p>
                            <p class="text-sm text-green-600">Devuelto: ${formatDate(ejemplar.fechaDevolucion)}</p>
                        </div>
                    `;
                    ejemplaresDevueltos.appendChild(div);
                }
            });

            openModal('detalle');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar el detalle del préstamo');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function mostrarEjemplares(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Prestamos/ObtenerEjemplaresDeUnPrestamo?idPrestamo=${id}`);
        const data = await response.json();

        if (data.succeded) {
            const listaEjemplares = document.getElementById('lista-ejemplares');
            listaEjemplares.innerHTML = '';

            data.data.forEach(ejemplar => {
                const div = document.createElement('div');
                div.className = 'py-3';
                div.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium">${ejemplar.titulo}</p>
                            <p class="text-sm text-gray-500">Correlativo: ${ejemplar.correlativo}</p>
                            <p class="text-sm text-gray-500">Clase: ${ejemplar.clase}</p>
                            <p class="text-sm text-gray-500">Categoría: ${ejemplar.categoria}</p>
                        </div>
                        <span class="badge ${ejemplar.disponible ? 'badge-success' : 'badge-warning'}">
                            ${ejemplar.disponible ? 'Disponible' : 'En Préstamo'}
                        </span>
                    </div>
                `;
                listaEjemplares.appendChild(div);
            });

            openModal('ejemplares');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar los ejemplares');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function registrarDevolucionEjemplar(idDetallePrestamo) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Prestamos/RegistrarDevolucion?idPrestamoDetalle=${idDetallePrestamo}`, {
            method: 'POST'
        });

        if (response.ok) {
            showNotification('success', 'Éxito', 'Devolución registrada correctamente');
            // Recargar el detalle del préstamo
            await verDetalle(currentPrestamoId);
            // Recargar la lista de préstamos
            await cargarPrestamos();
        } else {
            showNotification('error', 'Error', 'No se pudo registrar la devolución');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function registrarDevolucion(id) {
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "¿Desea marcar este préstamo como devuelto?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, marcar como devuelto',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            showLoading();
            const response = await fetch(`${API_URL}/Prestamos/MarcarPrestamoComoDevuelto?idPrestamo=${id}`, {
                method: 'POST'
            });

            if (response.ok) {
                showNotification('success', 'Éxito', 'Préstamo marcado como devuelto correctamente');
                await cargarPrestamos();
            } else {
                showNotification('error', 'Error', 'No se pudo marcar el préstamo como devuelto');
            }
        } catch (error) {
            showNotification('error', 'Error', 'Error al conectar con el servidor');
            console.error(error);
        } finally {
            hideLoading();
        }
    }
}

async function eliminarPrestamo(id) {
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            showLoading();
            const response = await fetch(`${API_URL}/Prestamos/EliminarPrestamo?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('success', 'Éxito', 'Préstamo eliminado correctamente');
                await cargarPrestamos();
            } else {
                showNotification('error', 'Error', 'No se pudo eliminar el préstamo');
            }
        } catch (error) {
            showNotification('error', 'Error', 'Error al conectar con el servidor');
            console.error(error);
        } finally {
            hideLoading();
        }
    }
}

// Funciones de búsqueda y paginación
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredPrestamos = allPrestamos.filter(prestamo => 
        prestamo.nombre.toLowerCase().includes(searchTerm) ||
        prestamo.persona.nombreCompleto.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayPrestamos();
}

function nextPage() {
    const maxPage = Math.ceil(filteredPrestamos.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayPrestamos();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPrestamos();
    }
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    // Título
    doc.setFontSize(18);
    doc.text('Registro de Préstamos - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Preparar datos para la tabla
    const headers = [['ID', 'Nombre', 'Persona', 'Fecha Préstamo', 'Estado', 'Ejemplares']];
    const data = filteredPrestamos.map(prestamo => [
        prestamo.id.toString(),
        prestamo.nombre,
        prestamo.persona.nombreCompleto,
        formatDate(prestamo.fechaPrestamo),
        prestamo.estado ? 'Devuelto' : 'En Préstamo',
        `${prestamo.ejemplares.length} ejemplares`
    ]);

    doc.autoTable({
        head: headers,
        body: data,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Guardar PDF
    doc.save('registro-prestamos-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}