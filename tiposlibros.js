// Configuración base para las peticiones
const API_URL = 'http://documentalmanage-001-site1.otempurl.com/api/TiposLibros';

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allTiposLibro = [];
let filteredTiposLibro = [];

// Funciones para el modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalTitle').textContent = editMode ? 'Editar Tipo de Libro' : 'Nuevo Tipo de Libro';
    if (!editMode) {
        document.getElementById('tipolibroForm').reset();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('tipolibroForm').reset();
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
    const endIndex = Math.min(currentPage * itemsPerPage, filteredTiposLibro.length);
    const totalItems = filteredTiposLibro.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function displayTipoLibro() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageTiposLibro = filteredTiposLibro.slice(start, end);

    const tbody = document.getElementById('tablaTipoLibro');
    tbody.innerHTML = '';

    pageTiposLibro.forEach(tipolibro => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tipolibro.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tipolibro.descripcion}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editarTipoLibro(${tipolibro.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button onclick="eliminarTipoLibro(${tipolibro.id})" class="text-red-600 hover:text-red-900">
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
    const maxPage = Math.ceil(filteredTiposLibro.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayTipoLibro();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayTipoLibro();
    }
}

// Función de búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredTiposLibro = allTiposLibro.filter(TipoLibro => 
        TipoLibro.descripcion.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayTipoLibro();
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Tipos de Libro - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla
    const headers = [['ID', 'Descripcion']];
    const data = filteredTiposLibro.map(TipoLibro => [TipoLibro.id.toString(), TipoLibro.descripcion]);

    doc.autoTable({
        head: headers,
        body: data,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Guardar PDF
    doc.save('tiposdelibro-biblioteca-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// CRUD Operations
async function cargarTiposLibro() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/ObtenerTiposLibros`);
        const data = await response.json();

        if (data.succeded) {
            allTiposLibro = data.data;
            filteredTiposLibro = [...allTiposLibro];
            displayTipoLibro();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar los tipos de libro');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function editarTipoLibro(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/ObtenerTipoLibroPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            editMode = true;
            document.getElementById('tipolibroId').value = data.data.id;
            document.getElementById('descripcion').value = data.data.descripcion;
            document.getElementById('modalTitle').textContent = 'Editar Tipo de Libro';
            openModal();
        } else {
            showNotification('error', 'Error', 'No se pudo cargar el tipo de libro');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function eliminarTipoLibro(id) {
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
            const response = await fetch(`${API_URL}/EliminarTipoLibro?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('success', 'Éxito', 'Tipo de libro eliminado correctamente');
                await cargarTiposLibro();
            } else {
                showNotification('error', 'Error', 'No se pudo eliminar el tipo de libro');
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
    
    const tipolibroData = {
        descripcion: document.getElementById('descripcion').value.trim()
    };

    if (editMode) {
        tipolibroData.id = parseInt(document.getElementById('tipolibroId').value);
    }

    try {
        showLoading();
        const url = editMode ? 
            `${API_URL}/ActualizarTipoLibro` : 
            `${API_URL}/CrearTipoLibro`;

        const response = await fetch(url, {
            method: editMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tipolibroData)
        });

        if (response.ok) {
            showNotification('success', 'Éxito', `Tipo de libro ${editMode ? 'actualizado' : 'creado'} correctamente`);
            closeModal();
            await cargarTiposLibro();
        } else {
            showNotification('error', 'Error', `No se pudo ${editMode ? 'actualizar' : 'crear'} el tipo de libro`);
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarTiposLibro();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });
});