// Datos mock para programas
const mockProgramas = [
    {
        id: 1,
        nombre: 'Gestionar Libros',
        descripcion: 'Módulo para la gestión de libros de la biblioteca',
        estado: true
    },
    {
        id: 2,
        nombre: 'Gestionar Préstamos',
        descripcion: 'Módulo para la gestión de préstamos y devoluciones',
        estado: true
    },
    {
        id: 3,
        nombre: 'Gestionar Tipos de Libros',
        descripcion: 'Módulo para la gestión de categorías y tipos de libros',
        estado: true
    },
    {
        id: 4,
        nombre: 'Gestionar Ejemplares',
        descripcion: 'Módulo para la gestión de ejemplares físicos de libros',
        estado: true
    },
    {
        id: 5,
        nombre: 'Gestionar Documentos',
        descripcion: 'Módulo para la gestión de documentos de usuarios',
        estado: true
    },
    {
        id: 6,
        nombre: 'Gestionar Usuarios',
        descripcion: 'Módulo para la gestión de usuarios del sistema',
        estado: true
    },
    {
        id: 7,
        nombre: 'Gestionar Permisos',
        descripcion: 'Módulo para la gestión de permisos y roles',
        estado: true
    }
];

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allPrograms = [...mockProgramas];
let filteredPrograms = [...mockProgramas];

// Funciones para el modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalTitle').textContent = editMode ? 'Editar Programa' : 'Nuevo Programa';
    if (!editMode) {
        document.getElementById('programaForm').reset();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('programaForm').reset();
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
    const endIndex = Math.min(currentPage * itemsPerPage, filteredPrograms.length);
    const totalItems = filteredPrograms.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function displayPrograms() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagePrograms = filteredPrograms.slice(start, end);

    const tbody = document.getElementById('tablaProgramas');
    tbody.innerHTML = '';

    pagePrograms.forEach(programa => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in', 'hover:bg-gray-50');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${programa.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${programa.nombre}</td>
            <td class="px-6 py-4 text-sm text-gray-500">
                <div class="max-w-md">${programa.descripcion}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${programa.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${programa.estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center justify-center space-x-3">
                    <button 
                        onclick="editarPrograma(${programa.id})" 
                        class="flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                        title="Editar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button 
                        onclick="eliminarPrograma(${programa.id})" 
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
    const maxPage = Math.ceil(filteredPrograms.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayPrograms();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPrograms();
    }
}

// Función de búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredPrograms = allPrograms.filter(program => 
        program.nombre.toLowerCase().includes(searchTerm) ||
        program.descripcion.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayPrograms();
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Programas - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla
    const headers = [['ID', 'Nombre', 'Descripción', 'Estado']];
    const data = filteredPrograms.map(program => [
        program.id.toString(),
        program.nombre,
        program.descripcion,
        program.estado ? 'Activo' : 'Inactivo'
    ]);

    doc.autoTable({
        head: headers,
        body: data,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
            2: { cellWidth: 80 }
        }
    });

    // Guardar PDF
    doc.save('programas-biblioteca-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// CRUD Operations
function editarPrograma(id) {
    const programa = allPrograms.find(p => p.id === id);
    if (programa) {
        editMode = true;
        document.getElementById('programaId').value = programa.id;
        document.getElementById('nombre').value = programa.nombre;
        document.getElementById('descripcion').value = programa.descripcion;
        document.getElementById('estado').checked = programa.estado;
        openModal();
    }
}

function eliminarPrograma(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Simulación de eliminación
            allPrograms = allPrograms.filter(p => p.id !== id);
            filteredPrograms = filteredPrograms.filter(p => p.id !== id);
            displayPrograms();
            showNotification('success', 'Éxito', 'Programa eliminado correctamente');
        }
    });
}

function handleSubmit(event) {
    event.preventDefault();
    
    const programaData = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        estado: document.getElementById('estado').checked
    };

    if (editMode) {
        const id = parseInt(document.getElementById('programaId').value);
        const index = allPrograms.findIndex(p => p.id === id);
        if (index !== -1) {
            allPrograms[index] = { ...allPrograms[index], ...programaData };
            filteredPrograms = [...allPrograms];
        }
    } else {
        const newId = Math.max(...allPrograms.map(p => p.id)) + 1;
        allPrograms.push({ id: newId, ...programaData });
        filteredPrograms = [...allPrograms];
    }

    displayPrograms();
    closeModal();
    showNotification('success', 'Éxito', `Programa ${editMode ? 'actualizado' : 'creado'} correctamente`);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    displayPrograms();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });
});