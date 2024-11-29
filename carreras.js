// Configuración base para las peticiones
const API_URL = 'http://documentalmanage-001-site1.otempurl.com/api/Carreras';

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allCarreras = [];
let filteredCarreras = [];

// Funciones para el modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalTitle').textContent = editMode ? 'Editar Carrera' : 'Nueva Carrera';
    if (!editMode) {
        document.getElementById('carreraForm').reset();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('carreraForm').reset();
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
    const endIndex = Math.min(currentPage * itemsPerPage, filteredCarreras.length);
    const totalItems = filteredCarreras.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function displayCarreras() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageCarreras = filteredCarreras.slice(start, end);

    const tbody = document.getElementById('tablaCarreras');
    tbody.innerHTML = '';

    pageCarreras.forEach(carrera => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in', 'hover:bg-gray-50');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${carrera.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${carrera.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${carrera.sigla}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center justify-center space-x-3">
                    <button 
                        onclick="editarCarrera(${carrera.id})" 
                        class="flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                        title="Editar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button 
                        onclick="eliminarCarrera(${carrera.id})" 
                        class="flex items-center justify-center p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full transition-colors duration-200"
                        title="Eliminar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePaginationInfo();
}

function nextPage() {
    const maxPage = Math.ceil(filteredCarreras.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayCarreras();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayCarreras();
    }
}

// Función de búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredCarreras = allCarreras.filter(carrera => 
        carrera.nombre.toLowerCase().includes(searchTerm) ||
        carrera.sigla.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayCarreras();
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Carreras - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla
    const headers = [['ID', 'Nombre', 'Sigla']];
    const data = filteredCarreras.map(carrera => [
        carrera.id.toString(),
        carrera.nombre,
        carrera.sigla
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
    doc.save('carreras-biblioteca-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// CRUD Operations
async function cargarCarreras() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/ObtenerCarreras`);
        const data = await response.json();

        if (data.succeded) {
            allCarreras = data.data;
            filteredCarreras = [...allCarreras];
            displayCarreras();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar las carreras');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function editarCarrera(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/ObtenerCarreraPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            editMode = true;
            const carrera = data.data;
            document.getElementById('carreraId').value = carrera.id;
            document.getElementById('nombre').value = carrera.nombre;
            document.getElementById('sigla').value = carrera.sigla;
            openModal();
        } else {
            showNotification('error', 'Error', 'No se pudo cargar la carrera');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function eliminarCarrera(id) {
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
            const response = await fetch(`${API_URL}/EliminarCarrera?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('success', 'Éxito', 'Carrera eliminada correctamente');
                await cargarCarreras();
            } else {
                showNotification('error', 'Error', 'No se pudo eliminar la carrera');
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
    
    const carreraData = {
        nombre: document.getElementById('nombre').value.trim(),
        sigla: document.getElementById('sigla').value.trim().toUpperCase()
    };

    if (editMode) {
        carreraData.id = parseInt(document.getElementById('carreraId').value);
    }

    try {
        showLoading();
        const url = editMode ? 
            `${API_URL}/ActualizarCarrera` : 
            `${API_URL}/CrearCarrera`;

        const response = await fetch(url, {
            method: editMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(carreraData)
        });

        if (response.ok) {
            showNotification('success', 'Éxito', `Carrera ${editMode ? 'actualizada' : 'creada'} correctamente`);
            closeModal();
            await cargarCarreras();
        } else {
            showNotification('error', 'Error', `No se pudo ${editMode ? 'actualizar' : 'crear'} la carrera`);
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarCarreras();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });

    // Convertir sigla a mayúsculas automáticamente
    document.getElementById('sigla').addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
});