// Configuración base para las peticiones
const API_URL = 'http://documentalmanage-001-site1.otempurl.com/api/Autores';

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allAuthors = [];
let filteredAuthors = [];

// Funciones para el modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalTitle').textContent = editMode ? 'Editar Autor' : 'Nuevo Autor';
    if (!editMode) {
        document.getElementById('autorForm').reset();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('autorForm').reset();
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
    const endIndex = Math.min(currentPage * itemsPerPage, filteredAuthors.length);
    const totalItems = filteredAuthors.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function displayAuthors() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageAuthors = filteredAuthors.slice(start, end);

    const tbody = document.getElementById('tablaAutores');
    tbody.innerHTML = '';

    pageAuthors.forEach(autor => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${autor.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${autor.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editarAutor(${autor.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button onclick="eliminarAutor(${autor.id})" class="text-red-600 hover:text-red-900">
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
    const maxPage = Math.ceil(filteredAuthors.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayAuthors();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayAuthors();
    }
}

// Función de búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredAuthors = allAuthors.filter(author => 
        author.nombre.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayAuthors();
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Autores - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla
    const headers = [['ID', 'Nombre']];
    const data = filteredAuthors.map(author => [author.id.toString(), author.nombre]);

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
    doc.save('autores-biblioteca-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// CRUD Operations
async function cargarAutores() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/ObtenerAutores`);
        const data = await response.json();

        if (data.succeded) {
            allAuthors = data.data;
            filteredAuthors = [...allAuthors];
            displayAuthors();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar los autores');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function editarAutor(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/ObtenerAutorPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            editMode = true;
            document.getElementById('autorId').value = data.data.id;
            document.getElementById('nombre').value = data.data.nombre;
            document.getElementById('modalTitle').textContent = 'Editar Autor';
            openModal();
        } else {
            showNotification('error', 'Error', 'No se pudo cargar el autor');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function eliminarAutor(id) {
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
            const response = await fetch(`${API_URL}/EliminarAutor?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('success', 'Éxito', 'Autor eliminado correctamente');
                await cargarAutores();
            } else {
                showNotification('error', 'Error', 'No se pudo eliminar el autor');
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
    
    const autorData = {
        nombre: document.getElementById('nombre').value.trim()
    };

    if (editMode) {
        autorData.id = parseInt(document.getElementById('autorId').value);
    }

    try {
        showLoading();
        const url = editMode ? 
            `${API_URL}/ActualizarAutor` : 
            `${API_URL}/CrearAutor`;

        const response = await fetch(url, {
            method: editMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(autorData)
        });

        if (response.ok) {
            showNotification('success', 'Éxito', `Autor ${editMode ? 'actualizado' : 'creado'} correctamente`);
            closeModal();
            await cargarAutores();
        } else {
            showNotification('error', 'Error', `No se pudo ${editMode ? 'actualizar' : 'crear'} el autor`);
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarAutores();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });
});