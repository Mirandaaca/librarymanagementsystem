// Configuración base para las peticiones
const API_URL = 'https://documentalmanage-001-site1.otempurl.com/api';

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allEjemplares = [];
let filteredEjemplares = [];
let libros = [];
let origenes = [];

// Funciones para el modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalTitle').textContent = editMode ? 'Editar Ejemplar' : 'Nuevo Ejemplar';
    if (!editMode) {
        document.getElementById('ejemplarForm').reset();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('ejemplarForm').reset();
    editMode = false;
}

// Funciones para el spinner
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

// Función para mostrar notificaciones
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

// Funciones de paginación
function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredEjemplares.length);
    const totalItems = filteredEjemplares.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function displayEjemplares() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageEjemplares = filteredEjemplares.slice(start, end);

    const tbody = document.getElementById('tablaEjemplares');
    tbody.innerHTML = '';

    pageEjemplares.forEach(ejemplar => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ejemplar.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ejemplar.titulo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ejemplar.origen}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ejemplar.correlativo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ejemplar.clase}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ejemplar.categoria}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ejemplar.disponibilidad ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${ejemplar.disponibilidad ? 'Disponible' : 'No Disponible'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ejemplar.campo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editarEjemplar(${ejemplar.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button onclick="eliminarEjemplar(${ejemplar.id})" class="text-red-600 hover:text-red-900">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePaginationInfo();
}

function nextPage() {
    const maxPage = Math.ceil(filteredEjemplares.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayEjemplares();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayEjemplares();
    }
}

// Función de búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredEjemplares = allEjemplares.filter(ejemplar => 
        ejemplar.titulo.toLowerCase().includes(searchTerm) ||
        ejemplar.correlativo.toLowerCase().includes(searchTerm) ||
        ejemplar.clase.toLowerCase().includes(searchTerm) ||
        ejemplar.categoria.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayEjemplares();
}

// Manejo de imagen
async function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const preview = document.getElementById('previewTapa');
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        }
        
        reader.readAsDataURL(file);
    }
}

// Cargar datos iniciales
async function loadInitialData() {
    try {
        showLoading();
        await Promise.all([
            cargarLibros(),
            cargarOrigenes(),
            cargarEjemplares()
        ]);
    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar los datos iniciales');
    } finally {
        hideLoading();
    }
}

// CRUD Operations
async function cargarEjemplares() {
    try {
        const response = await fetch(`${API_URL}/Ejemplares/ObtenerInformacionCompletaDeEjemplares`);
        const data = await response.json();

        if (data.succeded) {
            allEjemplares = data.data;
            filteredEjemplares = [...allEjemplares];
            displayEjemplares();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar los ejemplares');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    }
}

async function cargarLibros() {
    try {
        const response = await fetch(`${API_URL}/Libros/ObtenerLibros`);
        const data = await response.json();

        if (data.succeded) {
            libros = data.data;
            const select = document.getElementById('idLibro');
            select.innerHTML = '<option value="">Seleccione un libro</option>';
            libros.forEach(libro => {
                select.innerHTML += `<option value="${libro.id}">${libro.nombre}</option>`;
            });
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar los libros');
    }
}

async function cargarOrigenes() {
    try {
        const response = await fetch(`${API_URL}/Origenes/ObtenerOrigenes`);
        const data = await response.json();

        if (data.succeded) {
            origenes = data.data;
            const select = document.getElementById('idOrigen');
            select.innerHTML = '<option value="">Seleccione un origen</option>';
            origenes.forEach(origen => {
                select.innerHTML += `<option value="${origen.id}">${origen.descripcion}</option>`;
            });
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar los orígenes');
    }
}

async function editarEjemplar(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Ejemplares/ObtenerInformacionCompletaDeEjemplarPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            editMode = true;
            const ejemplar = data.data;
            
            document.getElementById('ejemplarId').value = ejemplar.id;
            document.getElementById('idLibro').value = ejemplar.idLibro;
            document.getElementById('idOrigen').value = ejemplar.idOrigen;
            document.getElementById('correlativo').value = ejemplar.correlativo;
            document.getElementById('clase').value = ejemplar.clase;
            document.getElementById('categoria').value = ejemplar.categoria;
            document.getElementById('disponibilidad').value = ejemplar.disponibilidad.toString();
            document.getElementById('campo').value = ejemplar.campo;
            
            openModal();
        } else {
            showNotification('error', 'Error', 'No se pudo cargar el ejemplar');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function eliminarEjemplar(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
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
            const response = await fetch(`${API_URL}/Ejemplares/EliminarEjemplar?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('success', 'Éxito', 'Ejemplar eliminado correctamente');
                await cargarEjemplares();
            } else {
                showNotification('error', 'Error', 'No se pudo eliminar el ejemplar');
            }
        } catch (error) {
            showNotification('error', 'Error', 'Error al conectar con el servidor');
        } finally {
            hideLoading();
        }
    }
}


async function handleSubmit(event) {
    event.preventDefault();
    
    // Si estamos en modo edición y se está intentando cambiar la disponibilidad
    if (editMode) {
        const currentEjemplar = allEjemplares.find(e => e.id === parseInt(document.getElementById('ejemplarId').value));
        const newDisponibilidad = document.getElementById('disponibilidad').value === 'true';
        
        // Si se está intentando cambiar la disponibilidad
        if (currentEjemplar.disponibilidad !== newDisponibilidad) {
            try {
                const response = await fetch(`${API_URL}/Ejemplares/VerificarEjemplarEnPrestamoActivo?idEjemplar=${currentEjemplar.id}`);
                const data = await response.json();
                
                if (data.succeded && data.data.estaEnPrestamoActivo) {
                    // Si está en préstamo activo, mostrar mensaje y no permitir el cambio
                    Swal.fire({
                        icon: 'error',
                        title: 'No se puede cambiar la disponibilidad',
                        html: `Este ejemplar está en un préstamo activo:<br><br>` +
                              `<strong>Préstamo:</strong> ${data.data.prestamo.nombre}<br>` +
                              `<strong>Fecha:</strong> ${new Date(data.data.prestamo.fechaPrestamo).toLocaleDateString()}<br>` +
                              `<strong>Descripción:</strong> ${data.data.prestamo.descripcion}`,
                    });
                    return;
                }
            } catch (error) {
                showNotification('error', 'Error', 'Error al verificar el estado del préstamo');
                return;
            }
        }
    }

    const ejemplarData = {
        idLibro: parseInt(document.getElementById('idLibro').value),
        idOrigen: parseInt(document.getElementById('idOrigen').value),
        correlativo: document.getElementById('correlativo').value,
        clase: document.getElementById('clase').value,
        categoria: document.getElementById('categoria').value,
        disponibilidad: document.getElementById('disponibilidad').value === 'true',
        campo: document.getElementById('campo').value
    };

    if (editMode) {
        ejemplarData.id = parseInt(document.getElementById('ejemplarId').value);
    }

    try {
        showLoading();
        const url = editMode ? 
            `${API_URL}/Ejemplares/ActualizarEjemplar` : 
            `${API_URL}/Ejemplares/CrearEjemplar`;

        const response = await fetch(url, {
            method: editMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ejemplarData)
        });

        if (response.ok) {
            showNotification('success', 'Éxito', `Ejemplar ${editMode ? 'actualizado' : 'creado'} correctamente`);
            closeModal();
            await cargarEjemplares();
        } else {
            showNotification('error', 'Error', `No se pudo ${editMode ? 'actualizar' : 'crear'} el ejemplar`);
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Ejemplares - Biblioteca UEB', 14, 20);

    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    const headers = [['ID', 'Título', 'Origen', 'Correlativo', 'Clase', 'Categoría', 'Disponibilidad']];
    const data = filteredEjemplares.map(ejemplar => [
        ejemplar.id.toString(),
        ejemplar.titulo,
        ejemplar.origen,
        ejemplar.correlativo,
        ejemplar.clase,
        ejemplar.categoria,
        ejemplar.disponibilidad ? 'Disponible' : 'No Disponible'
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

    doc.save('ejemplares-biblioteca-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    
    // Búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });
});