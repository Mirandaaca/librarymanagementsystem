// Configuración base para las peticiones
const API_URL = 'http://documentalmanage-001-site1.otempurl.com/api/Usuarios';

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allUsers = [];
let filteredUsers = [];

// Funciones para el modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalTitle').textContent = editMode ? 'Editar Usuario' : 'Nuevo Usuario';
    if (!editMode) {
        document.getElementById('usuarioForm').reset();
        document.getElementById('password').required = true;
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('usuarioForm').reset();
    editMode = false;
}

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const icon = document.getElementById('showPasswordIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
        `;
    } else {
        passwordInput.type = 'password';
        icon.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        `;
    }
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
    const endIndex = Math.min(currentPage * itemsPerPage, filteredUsers.length);
    const totalItems = filteredUsers.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function displayUsers() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageUsers = filteredUsers.slice(start, end);

    const tbody = document.getElementById('tablaUsuarios');
    tbody.innerHTML = '';

    pageUsers.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in', 'hover:bg-gray-50');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${usuario.id.substring(0, 8)}...</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${usuario.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${usuario.apellido}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${usuario.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ${usuario.role}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center justify-center space-x-3">
                    <button 
                        onclick="editarUsuario('${usuario.id}')" 
                        class="flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                        title="Editar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button 
                        onclick="eliminarUsuario('${usuario.id}')" 
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
    const maxPage = Math.ceil(filteredUsers.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayUsers();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayUsers();
    }
}

// Función de búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredUsers = allUsers.filter(user => 
        user.nombre.toLowerCase().includes(searchTerm) ||
        user.apellido.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayUsers();
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Usuarios - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla
    const headers = [['ID', 'Nombre', 'Apellido', 'Email', 'Rol']];
    const data = filteredUsers.map(user => [
        user.id.substring(0, 8) + '...',
        user.nombre,
        user.apellido,
        user.email,
        user.role
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
    doc.save('usuarios-biblioteca-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// CRUD Operations
async function cargarUsuarios() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/ObtenerUsuarios`);
        const data = await response.json();

        if (data.succeded) {
            allUsers = data.data;
            filteredUsers = [...allUsers];
            displayUsers();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar los usuarios');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function editarUsuario(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/ObtenerUsuarioPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            editMode = true;
            const usuario = data.data;
            document.getElementById('usuarioId').value = usuario.id;
            document.getElementById('nombre').value = usuario.nombre;
            document.getElementById('apellido').value = usuario.apellido;
            document.getElementById('email').value = usuario.email;
            document.getElementById('role').value = usuario.role;
            document.getElementById('password').required = false;
            
            openModal();
        } else {
            showNotification('error', 'Error', 'No se pudo cargar el usuario');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function eliminarUsuario(id) {
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
            const response = await fetch(`${API_URL}/EliminarUsuario?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('success', 'Éxito', 'Usuario eliminado correctamente');
                await cargarUsuarios();
            } else {
                showNotification('error', 'Error', 'No se pudo eliminar el usuario');
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
    
    const usuarioData = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        email: document.getElementById('email').value.trim(),
        role: document.getElementById('role').value
    };

    const password = document.getElementById('password').value.trim();
    if (password) {
        usuarioData.password = password;
    }

    if (editMode) {
        usuarioData.id = document.getElementById('usuarioId').value;
    }

    try {
        showLoading();
        const url = editMode ? 
            `${API_URL}/ActualizarUsuario` : 
            `${API_URL}/CrearUsuario`;

        const response = await fetch(url, {
            method: editMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuarioData)
        });

        if (response.ok) {
            showNotification('success', 'Éxito', `Usuario ${editMode ? 'actualizado' : 'creado'} correctamente`);
            closeModal();
            await cargarUsuarios();
        } else {
            showNotification('error', 'Error', `No se pudo ${editMode ? 'actualizar' : 'crear'} el usuario`);
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarUsuarios();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });
});