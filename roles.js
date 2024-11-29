// Datos mock
const mockRoles = [
    {
        id: 1,
        nombre: 'Administrador',
        descripcion: 'Rol con acceso completo al sistema',
        estado: true,
        permisos: [
            { programa: 'Gestionar Libros', permisos: ['Consultar', 'Crear', 'Actualizar', 'Eliminar'] },
            { programa: 'Gestionar Préstamos', permisos: ['Consultar', 'Crear', 'Actualizar', 'Eliminar'] },
            { programa: 'Gestionar Tipos de Libros', permisos: ['Consultar', 'Crear', 'Actualizar', 'Eliminar'] }
        ]
    },
    {
        id: 2,
        nombre: 'Bibliotecario',
        descripcion: 'Rol para el personal de biblioteca',
        estado: true,
        permisos: [
            { programa: 'Gestionar Libros', permisos: ['Consultar', 'Actualizar'] },
            { programa: 'Gestionar Préstamos', permisos: ['Consultar', 'Crear'] }
        ]
    }
];

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allRoles = [...mockRoles];
let filteredRoles = [...mockRoles];

// Funciones para el modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalTitle').textContent = editMode ? 'Editar Rol' : 'Nuevo Rol';
    if (!editMode) {
        document.getElementById('rolForm').reset();
        document.getElementById('estado').checked = true;
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('rolForm').reset();
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

// Función para mostrar detalle de permisos
function showPermisosDetail(permisos) {
    if (!permisos || permisos.length === 0) return 'Sin permisos asignados';
    
    return permisos.map(p => {
        return `${p.programa}:\n${p.permisos.join(', ')}`;
    }).join('\n\n');
}

// Funciones de paginación
function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredRoles.length);
    const totalItems = filteredRoles.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function displayRoles() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageRoles = filteredRoles.slice(start, end);

    const tbody = document.getElementById('tablaRoles');
    tbody.innerHTML = '';

    pageRoles.forEach(rol => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in', 'hover:bg-gray-50');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rol.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${rol.nombre}</td>
            <td class="px-6 py-4 text-sm text-gray-500">
                <div class="max-w-md">${rol.descripcion}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rol.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${rol.estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <button 
                    onclick="openPermisosModal(${JSON.stringify(rol).replace(/"/g, '&quot;')})" 
                    class="px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold 
                           rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200">
                    ${rol.permisos ? rol.permisos.length : 0} permisos
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center justify-center space-x-3">
                    <button 
                        onclick="editarRol(${rol.id})" 
                        class="flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                        title="Editar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button 
                        onclick="eliminarRol(${rol.id})" 
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

        // Inicializar tooltips para los permisos
        const permisosSpan = tr.querySelector('.cursor-help');
        if (permisosSpan) {
            tippy(permisosSpan, {
                content: showPermisosDetail(rol.permisos),
                placement: 'top',
                arrow: true,
                theme: 'light-border',
                maxWidth: 300,
                allowHTML: true
            });
        }
    });

    updatePaginationInfo();
}
// Funciones para el modal de permisos
function openPermisosModal(rol) {
    const modal = document.getElementById('permisosModal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    
    // Actualizar título y subtítulo
    document.getElementById('permisosModalTitle').textContent = `Permisos del Rol: ${rol.nombre}`;
    document.getElementById('permisosModalSubtitle').textContent = 
        `Total de programas con permisos: ${rol.permisos.length}`;

    // Generar lista de permisos
    const permisosContainer = document.getElementById('permisosDetailList');
    permisosContainer.innerHTML = '';

    if (rol.permisos && rol.permisos.length > 0) {
        rol.permisos.forEach(permiso => {
            const permisoDiv = document.createElement('div');
            permisoDiv.className = 'bg-gray-50 rounded-lg p-4';
            permisoDiv.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-gray-900">${permiso.programa}</h3>
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        ${permiso.permisos.length} permisos
                    </span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${permiso.permisos.map(p => `
                        <span class="px-2 py-1 text-xs font-medium rounded-full 
                            ${getPermissionColor(p)}">
                            ${p}
                        </span>
                    `).join('')}
                </div>
            `;
            permisosContainer.appendChild(permisoDiv);
        });
    } else {
        permisosContainer.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                Este rol no tiene permisos asignados.
            </div>
        `;
    }
}

function closePermisosModal() {
    const modal = document.getElementById('permisosModal');
    modal.classList.add('opacity-0', 'pointer-events-none');
}

function getPermissionColor(permiso) {
    switch (permiso) {
        case 'Crear':
            return 'bg-green-100 text-green-800';
        case 'Eliminar':
            return 'bg-red-100 text-red-800';
        case 'Actualizar':
            return 'bg-yellow-100 text-yellow-800';
        case 'Consultar':
            return 'bg-indigo-100 text-indigo-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function nextPage() {
    const maxPage = Math.ceil(filteredRoles.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayRoles();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayRoles();
    }
}

// Función de búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredRoles = allRoles.filter(rol => 
        rol.nombre.toLowerCase().includes(searchTerm) ||
        rol.descripcion.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayRoles();
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Roles - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla
    const headers = [['ID', 'Nombre', 'Descripción', 'Estado', 'Permisos']];
    const data = filteredRoles.map(rol => [
        rol.id.toString(),
        rol.nombre,
        rol.descripcion,
        rol.estado ? 'Activo' : 'Inactivo',
        `${rol.permisos ? rol.permisos.length : 0} permisos`
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
            2: { cellWidth: 60 }
        }
    });

    // Guardar PDF
    doc.save('roles-biblioteca-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// CRUD Operations
function editarRol(id) {
    const rol = allRoles.find(r => r.id === id);
    if (rol) {
        editMode = true;
        document.getElementById('rolId').value = rol.id;
        document.getElementById('nombre').value = rol.nombre;
        document.getElementById('descripcion').value = rol.descripcion;
        document.getElementById('estado').checked = rol.estado;
        openModal();
    }
}

function eliminarRol(id) {
    // Verificar si el rol tiene permisos asignados
    const rol = allRoles.find(r => r.id === id);
    if (rol && rol.permisos && rol.permisos.length > 0) {
        Swal.fire({
            title: 'Advertencia',
            text: 'Este rol tiene permisos asignados. ¿Estás seguro de que deseas eliminarlo?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteRol(id);
            }
        });
    } else {
        deleteRol(id);
    }
}

function deleteRol(id) {
    allRoles = allRoles.filter(r => r.id !== id);
    filteredRoles = filteredRoles.filter(r => r.id !== id);
    displayRoles();
    showNotification('success', 'Éxito', 'Rol eliminado correctamente');
}

function handleSubmit(event) {
    event.preventDefault();
    
    const rolData = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        estado: document.getElementById('estado').checked,
        permisos: []
    };

    if (editMode) {
        const id = parseInt(document.getElementById('rolId').value);
        const index = allRoles.findIndex(r => r.id === id);
        if (index !== -1) {
            // Mantener los permisos existentes
            rolData.permisos = allRoles[index].permisos;
            allRoles[index] = { ...allRoles[index], ...rolData };
            filteredRoles = [...allRoles];
        }
    } else {
        const newId = Math.max(...allRoles.map(r => r.id)) + 1;
        allRoles.push({ id: newId, ...rolData });
        filteredRoles = [...allRoles];
    }

    displayRoles();
    closeModal();
    showNotification('success', 'Éxito', `Rol ${editMode ? 'actualizado' : 'creado'} correctamente`);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    displayRoles();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });
});