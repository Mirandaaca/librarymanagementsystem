// Configuración base para las peticiones
const API_URL = 'https://documentalmanage-001-site1.otempurl.com/api/Personas';

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allPersons = [];
let filteredPersons = [];

// Funciones para el modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalTitle').textContent = editMode ? 'Editar Persona' : 'Nueva Persona';
    if (!editMode) {
        document.getElementById('personaForm').reset();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('personaForm').reset();
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
    const endIndex = Math.min(currentPage * itemsPerPage, filteredPersons.length);
    const totalItems = filteredPersons.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

function displayPersons() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagePersons = filteredPersons.slice(start, end);

    const tbody = document.getElementById('tablaPersonas');
    tbody.innerHTML = '';

    pagePersons.forEach(persona => {
        const tr = document.createElement('tr');
        //tr.classList.add('fade-in', 'hover:bg-gray-50');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${persona.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${persona.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${persona.apellido}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${persona.registro}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${persona.cedula}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center justify-center space-x-3">
                    <button 
                        onclick="editarPersona(${persona.id})" 
                        class="flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                        title="Editar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button 
                        onclick="eliminarPersona(${persona.id})" 
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
    const maxPage = Math.ceil(filteredPersons.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayPersons();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPersons();
    }
}

// Función de búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredPersons = allPersons.filter(person => 
        person.nombre.toLowerCase().includes(searchTerm) ||
        person.apellido.toLowerCase().includes(searchTerm) ||
        person.registro.toLowerCase().includes(searchTerm) ||
        person.cedula.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayPersons();
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Personas - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla
    const headers = [['ID', 'Nombre', 'Apellido', 'Registro', 'Cédula']];
    const data = filteredPersons.map(person => [
        person.id.toString(),
        person.nombre,
        person.apellido,
        person.registro,
        person.cedula
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
    doc.save('personas-biblioteca-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// CRUD Operations
async function cargarPersonas() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/ObtenerPersonas`);
        const data = await response.json();

        if (data.succeded) {
            allPersons = data.data;
            filteredPersons = [...allPersons];
            displayPersons();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar las personas');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function editarPersona(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/ObtenerPersonaPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            editMode = true;
            const persona = data.data;
            document.getElementById('personaId').value = persona.id;
            document.getElementById('nombre').value = persona.nombre;
            document.getElementById('apellido').value = persona.apellido;
            document.getElementById('registro').value = persona.registro;
            document.getElementById('cedula').value = persona.cedula;
            document.getElementById('sexo').value = persona.sexo;
            document.getElementById('telefono').value = persona.telefono;
            document.getElementById('correo').value = persona.correo;
            document.getElementById('fechaDeNacimiento').value = persona.fechaDeNacimiento.split('T')[0];
            
            openModal();
        } else {
            showNotification('error', 'Error', 'No se pudo cargar la persona');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function eliminarPersona(id) {
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
            const response = await fetch(`${API_URL}/EliminarPersona?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('success', 'Éxito', 'Persona eliminada correctamente');
                await cargarPersonas();
            } else {
                showNotification('error', 'Error', 'No se pudo eliminar la persona');
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
    
    const personaData = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        registro: document.getElementById('registro').value.trim(),
        cedula: document.getElementById('cedula').value.trim(),
        sexo: document.getElementById('sexo').value,
        telefono: document.getElementById('telefono').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        fechaDeNacimiento: document.getElementById('fechaDeNacimiento').value
    };

    if (editMode) {
        personaData.id = parseInt(document.getElementById('personaId').value);
    }

    try {
        showLoading();
        const url = editMode ? 
            `${API_URL}/ActualizarPersona` : 
            `${API_URL}/CrearPersona`;

        const response = await fetch(url, {
            method: editMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(personaData)
        });

        if (response.ok) {
            showNotification('success', 'Éxito', `Persona ${editMode ? 'actualizada' : 'creada'} correctamente`);
            closeModal();
            await cargarPersonas();
        } else {
            showNotification('error', 'Error', `No se pudo ${editMode ? 'actualizar' : 'crear'} la persona`);
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarPersonas();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });

  // Configuración de Flatpickr
flatpickr("#fechaDeNacimiento", {
    locale: {
        ...flatpickr.l10ns.es,
        months: {
            shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dec'],
            longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        }
    },
    dateFormat: "Y-m-d",
    maxDate: new Date(),
    altInput: true,
    altFormat: "d/m/Y",
    disableMobile: true,
    defaultDate: null,
});
});