// Configuración base para las peticiones
const API_URL = 'https://documentalmanage-001-site1.otempurl.com/api';

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allDocuments = [];
let filteredDocuments = [];
let personas = [];

// Funciones para el modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalTitle').textContent = editMode ? 'Editar Documento' : 'Nuevo Documento';
    if (!editMode) {
        document.getElementById('documentoForm').reset();
        document.getElementById('selectorPersonaContainer').classList.remove('hidden');
        document.getElementById('infoPersonaContainer').classList.add('hidden');
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    
    // Resetear el formulario
    document.getElementById('documentoForm').reset();
    
    // Restaurar el estado del select
    const personaSelect = document.getElementById('personaSelect');
    personaSelect.removeAttribute('disabled');
    personaSelect.required = true;
    
    // Restaurar visibilidad de los contenedores
    document.getElementById('infoPersonaContainer').classList.add('hidden');
    document.getElementById('selectorPersonaContainer').classList.remove('hidden');
    
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
    const endIndex = Math.min(currentPage * itemsPerPage, filteredDocuments.length);
    const totalItems = filteredDocuments.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function displayDocuments() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageDocuments = filteredDocuments.slice(start, end);

    const tbody = document.getElementById('tablaDocumentos');
    tbody.innerHTML = '';

    pageDocuments.forEach(documento => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in', 'hover:bg-gray-50');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${documento.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${documento.nombreCompleto}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${documento.registro}</td>
            <td class="px-6 py-4 text-sm text-gray-500">
                <div class="max-w-md overflow-hidden">${documento.descripcion}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center justify-center space-x-3">
                    <button 
                        onclick="editarDocumento(${documento.id})" 
                        class="flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                        title="Editar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button 
                        onclick="eliminarDocumento(${documento.id})" 
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
    const maxPage = Math.ceil(filteredDocuments.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayDocuments();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayDocuments();
    }
}

// Función de búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredDocuments = allDocuments.filter(doc => 
        doc.nombreCompleto.toLowerCase().includes(searchTerm) ||
        doc.registro.toLowerCase().includes(searchTerm) ||
        doc.descripcion.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayDocuments();
}

// Cargar personas para el selector
async function cargarPersonas() {
    try {
        const response = await fetch(`${API_URL}/Personas/ObtenerPersonas`);
        const data = await response.json();

        if (data.succeded) {
            personas = data.data;
            const select = document.getElementById('personaSelect');
            select.innerHTML = '<option value="">Seleccione una persona</option>';
            
            personas.forEach(persona => {
                const option = document.createElement('option');
                option.value = persona.id;
                option.textContent = `${persona.nombre} ${persona.apellido} - ${persona.registro}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        showNotification('error', 'Error', 'No se pudieron cargar las personas');
    }
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Documentos - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla
    const headers = [['ID', 'Nombre Completo', 'Registro', 'Descripción']];
    const data = filteredDocuments.map(doc => [
        doc.id.toString(),
        doc.nombreCompleto,
        doc.registro,
        doc.descripcion
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
            3: { cellWidth: 80 }
        }
    });

    // Guardar PDF
    doc.save('documentos-biblioteca-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// CRUD Operations
async function cargarDocumentos() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Documentos/ObtenerDocumentos`);
        const data = await response.json();

        if (data.succeded) {
            allDocuments = data.data;
            filteredDocuments = [...allDocuments];
            displayDocuments();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar los documentos');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

async function editarDocumento(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Documentos/ObtenerDocumentoPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            editMode = true;
            const documento = data.data;
            document.getElementById('documentoId').value = documento.id;
            document.getElementById('idPersona').value = documento.idPersona;
            document.getElementById('descripcion').value = documento.descripcion;
            
            // Mostrar información de la persona
            document.getElementById('nombreCompletoInfo').textContent = documento.nombreCompleto;
            document.getElementById('registroInfo').textContent = documento.registro;
            
            // Modificamos el estado del select y su container
            const personaSelect = document.getElementById('personaSelect');
            personaSelect.required = false; // Quitamos el required cuando editamos
            personaSelect.value = documento.idPersona;
            personaSelect.setAttribute('disabled', 'disabled');
            
            // Mostrar la info y ocultar el select
            document.getElementById('infoPersonaContainer').classList.remove('hidden');
            document.getElementById('selectorPersonaContainer').classList.add('hidden');
            
            openModal();
        } else {
            showNotification('error', 'Error', 'No se pudo cargar el documento');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}


async function eliminarDocumento(id) {
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
            const response = await fetch(`${API_URL}/Documentos/EliminarDocumento?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('success', 'Éxito', 'Documento eliminado correctamente');
                await cargarDocumentos();
            } else {
                showNotification('error', 'Error', 'No se pudo eliminar el documento');
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
    
    const documentoData = {
        descripcion: document.getElementById('descripcion').value.trim()
    };

    if (editMode) {
        documentoData.id = parseInt(document.getElementById('documentoId').value);
    } else {
        documentoData.idPersona = parseInt(document.getElementById('personaSelect').value);
    }

    try {
        showLoading();
        const url = editMode ? 
            `${API_URL}/Documentos/ActualizarDocumento` : 
            `${API_URL}/Documentos/CrearDocumento`;

        const response = await fetch(url, {
            method: editMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentoData)
        });

        if (response.ok) {
            showNotification('success', 'Éxito', `Documento ${editMode ? 'actualizado' : 'creado'} correctamente`);
            closeModal();
            await cargarDocumentos();
        } else {
            showNotification('error', 'Error', `No se pudo ${editMode ? 'actualizar' : 'crear'} el documento`);
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await cargarPersonas();
    await cargarDocumentos();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });
});