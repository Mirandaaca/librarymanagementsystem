// Datos mock
const mockRoles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Bibliotecario' }
];

const mockProgramas = [
    { id: 1, nombre: 'Gestionar Libros', descripcion: 'Módulo para la gestión de libros' },
    { id: 2, nombre: 'Gestionar Préstamos', descripcion: 'Módulo para la gestión de préstamos' },
    { id: 3, nombre: 'Gestionar Tipos de Libros', descripcion: 'Módulo para la gestión de categorías' },
    { id: 4, nombre: 'Gestionar Ejemplares', descripcion: 'Módulo para la gestión de ejemplares' },
    { id: 5, nombre: 'Gestionar Documentos', descripcion: 'Módulo para la gestión de documentos' }
];

const mockPermisos = [
    {
        id: 1,
        idRol: 1,
        rolNombre: 'Administrador',
        idPrograma: 1,
        programaNombre: 'Gestionar Libros',
        consultar: true,
        crear: true,
        actualizar: true,
        eliminar: true
    },
    {
        id: 2,
        idRol: 2,
        rolNombre: 'Bibliotecario',
        idPrograma: 1,
        programaNombre: 'Gestionar Libros',
        consultar: true,
        crear: false,
        actualizar: true,
        eliminar: false
    }
];

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allPermisos = [...mockPermisos];
let filteredPermisos = [...mockPermisos];

// Funciones para el modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalTitle').textContent = editMode ? 'Editar Permisos' : 'Nuevos Permisos';
    if (!editMode) {
        document.getElementById('permisoForm').reset();
        generateProgramsList();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('permisoForm').reset();
    editMode = false;
}

// Generar lista de programas con permisos
function generateProgramsList() {
    const container = document.getElementById('programasList');
    container.innerHTML = '';

    mockProgramas.forEach(programa => {
        const programaDiv = document.createElement('div');
        programaDiv.className = 'programa-item border rounded-lg p-4';
        programaDiv.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <button type="button" class="programa-toggle mr-2" onclick="togglePrograma(${programa.id})">
                        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                    <span class="font-medium">${programa.nombre}</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" 
                           class="programa-main-toggle sr-only" 
                           data-programa-id="${programa.id}"
                           onchange="toggleAllPermisos(${programa.id}, this.checked)">
                    <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
            <div id="programa-permisos-${programa.id}" class="hidden pl-8 space-y-3 mt-3">
                <div class="flex items-center space-x-4">
                    <div class="flex items-center">
                        <input type="checkbox" 
                               id="consultar-${programa.id}"
                               class="permiso-checkbox w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                               data-programa-id="${programa.id}"
                               data-tipo="consultar">
                        <label for="consultar-${programa.id}" class="ml-2 text-sm text-gray-600">Consultar</label>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" 
                               id="crear-${programa.id}"
                               class="permiso-checkbox w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                               data-programa-id="${programa.id}"
                               data-tipo="crear">
                        <label for="crear-${programa.id}" class="ml-2 text-sm text-gray-600">Crear</label>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" 
                               id="actualizar-${programa.id}"
                               class="permiso-checkbox w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                               data-programa-id="${programa.id}"
                               data-tipo="actualizar">
                        <label for="actualizar-${programa.id}" class="ml-2 text-sm text-gray-600">Actualizar</label>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" 
                               id="eliminar-${programa.id}"
                               class="permiso-checkbox w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                               data-programa-id="${programa.id}"
                               data-tipo="eliminar">
                        <label for="eliminar-${programa.id}" class="ml-2 text-sm text-gray-600">Eliminar</label>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(programaDiv);
    });
}

// Toggle programa expandido/colapsado
function togglePrograma(programaId) {
    const permisosDiv = document.getElementById(`programa-permisos-${programaId}`);
    const toggleButton = permisosDiv.previousElementSibling.querySelector('.programa-toggle');
    
    if (permisosDiv.classList.contains('hidden')) {
        permisosDiv.classList.remove('hidden');
        toggleButton.classList.add('expanded');
    } else {
        permisosDiv.classList.add('hidden');
        toggleButton.classList.remove('expanded');
    }
}

// Toggle todos los permisos de un programa
function toggleAllPermisos(programaId, checked) {
    const permisosDiv = document.getElementById(`programa-permisos-${programaId}`);
    const checkboxes = permisosDiv.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
    });
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

// Funciones de paginación y display
function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredPermisos.length);
    const totalItems = filteredPermisos.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function displayPermisos() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagePermisos = filteredPermisos.slice(start, end);

    const tbody = document.getElementById('tablaPermisos');
    tbody.innerHTML = '';

    pagePermisos.forEach(permiso => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in', 'hover:bg-gray-50');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${permiso.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${permiso.rolNombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${permiso.programaNombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${permiso.consultar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${permiso.consultar ? 'Sí' : 'No'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${permiso.crear ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${permiso.crear ? 'Sí' : 'No'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${permiso.actualizar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${permiso.actualizar ? 'Sí' : 'No'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${permiso.eliminar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${permiso.eliminar ? 'Sí' : 'No'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center justify-center space-x-3">
                    <button 
                        onclick="editarPermiso(${permiso.id})" 
                        class="flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                        title="Editar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button 
                        onclick="eliminarPermiso(${permiso.id})" 
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

// Navegación
function nextPage() {
    const maxPage = Math.ceil(filteredPermisos.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayPermisos();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPermisos();
    }
}

// Búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredPermisos = allPermisos.filter(permiso => 
        permiso.rolNombre.toLowerCase().includes(searchTerm) ||
        permiso.programaNombre.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayPermisos();
}

// CRUD Operations
function editarPermiso(id) {
    const permiso = allPermisos.find(p => p.id === id);
    if (permiso) {
        editMode = true;
        document.getElementById('permisoId').value = permiso.id;
        document.getElementById('rolSelect').value = permiso.idRol;
        
        generateProgramsList();
        
        // Expandir y marcar los permisos correspondientes
        const programaDiv = document.getElementById(`programa-permisos-${permiso.idPrograma}`);
        if (programaDiv) {
            programaDiv.classList.remove('hidden');
            programaDiv.previousElementSibling.querySelector('.programa-toggle').classList.add('expanded');
            
            document.getElementById(`consultar-${permiso.idPrograma}`).checked = permiso.consultar;
            document.getElementById(`crear-${permiso.idPrograma}`).checked = permiso.crear;
            document.getElementById(`actualizar-${permiso.idPrograma}`).checked = permiso.actualizar;
            document.getElementById(`eliminar-${permiso.idPrograma}`).checked = permiso.eliminar;
            
            // Actualizar el toggle principal
            const allChecked = permiso.consultar && permiso.crear && permiso.actualizar && permiso.eliminar;
            programaDiv.previousElementSibling.querySelector('.programa-main-toggle').checked = allChecked;
        }
        
        openModal();
    }
}

async function eliminarPermiso(id) {
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
        // Simulación de eliminación
        allPermisos = allPermisos.filter(p => p.id !== id);
        filteredPermisos = filteredPermisos.filter(p => p.id !== id);
        displayPermisos();
        showNotification('success', 'Éxito', 'Permiso eliminado correctamente');
    }
}

function handleSubmit(event) {
    event.preventDefault();
    
    const rolId = parseInt(document.getElementById('rolSelect').value);
    const rol = mockRoles.find(r => r.id === rolId);
    
    // Recolectar todos los permisos marcados
    const nuevosPermisos = [];
    mockProgramas.forEach(programa => {
        const permisosDiv = document.getElementById(`programa-permisos-${programa.id}`);
        if (permisosDiv) {
            const consultar = document.getElementById(`consultar-${programa.id}`).checked;
            const crear = document.getElementById(`crear-${programa.id}`).checked;
            const actualizar = document.getElementById(`actualizar-${programa.id}`).checked;
            const eliminar = document.getElementById(`eliminar-${programa.id}`).checked;
            
            // Solo agregar si hay al menos un permiso marcado
            if (consultar || crear || actualizar || eliminar) {
                const newId = Math.max(...allPermisos.map(p => p.id), 0) + 1;
                nuevosPermisos.push({
                    id: newId,
                    idRol: rolId,
                    rolNombre: rol.nombre,
                    idPrograma: programa.id,
                    programaNombre: programa.nombre,
                    consultar,
                    crear,
                    actualizar,
                    eliminar
                });
            }
        }
    });

    if (editMode) {
        const id = parseInt(document.getElementById('permisoId').value);
        // Actualizar permisos existentes
        allPermisos = allPermisos.filter(p => p.id !== id);
        allPermisos = [...allPermisos, ...nuevosPermisos];
    } else {
        // Agregar nuevos permisos
        allPermisos = [...allPermisos, ...nuevosPermisos];
    }

    filteredPermisos = [...allPermisos];
    displayPermisos();
    closeModal();
    showNotification('success', 'Éxito', `Permisos ${editMode ? 'actualizados' : 'creados'} correctamente`);
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Permisos - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla
    const headers = [['ID', 'Rol', 'Programa', 'Consultar', 'Crear', 'Actualizar', 'Eliminar']];
    const data = filteredPermisos.map(permiso => [
        permiso.id.toString(),
        permiso.rolNombre,
        permiso.programaNombre,
        permiso.consultar ? 'Sí' : 'No',
        permiso.crear ? 'Sí' : 'No',
        permiso.actualizar ? 'Sí' : 'No',
        permiso.eliminar ? 'Sí' : 'No'
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
    doc.save('permisos-biblioteca-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    displayPermisos();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });

    // Event listeners para checkboxes de permisos
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('permiso-checkbox')) {
            const programaId = e.target.dataset.programaId;
            const permisosDiv = document.getElementById(`programa-permisos-${programaId}`);
            const checkboxes = permisosDiv.querySelectorAll('.permiso-checkbox');
            const mainToggle = permisosDiv.previousElementSibling.querySelector('.programa-main-toggle');
            
            // Verificar si todos los checkboxes están marcados
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            mainToggle.checked = allChecked;
        }
    });
});