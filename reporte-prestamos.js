// Configuración base para las peticiones
const API_URL = 'http://documentalmanage-001-site1.otempurl.com/api';

// Estados
let currentPage = 1;
let itemsPerPage = 10;
let allPrestamos = [];
let filteredPrestamos = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarPrestamos();
    
    // Event listeners para filtros
    document.getElementById('fechaInicio').addEventListener('change', aplicarFiltros);
    document.getElementById('fechaFin').addEventListener('change', aplicarFiltros);
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(aplicarFiltros, 300);
    });
});

// Funciones principales
async function cargarPrestamos() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Prestamos/ObtenerPrestamos`);
        const data = await response.json();

        if (data.succeded) {
            allPrestamos = data.data;
            filteredPrestamos = [...allPrestamos];
            displayPrestamos();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar los préstamos');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        console.error(error);
    } finally {
        hideLoading();
    }
}

function aplicarFiltros() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredPrestamos = allPrestamos.filter(prestamo => {
        const fechaPrestamo = new Date(prestamo.fechaPrestamo);
        const cumpleFecha = (!fechaInicio || fechaPrestamo >= new Date(fechaInicio)) &&
                           (!fechaFin || fechaPrestamo <= new Date(fechaFin + 'T23:59:59'));
                           
        const cumpleBusqueda = !searchTerm || 
                              prestamo.nombre.toLowerCase().includes(searchTerm) ||
                              prestamo.persona.nombreCompleto.toLowerCase().includes(searchTerm);

        return cumpleFecha && cumpleBusqueda;
    });

    currentPage = 1;
    displayPrestamos();
}

function displayPrestamos() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagePrestamos = filteredPrestamos.slice(start, end);

    const tbody = document.getElementById('tablaPrestamos');
    tbody.innerHTML = '';

    pagePrestamos.forEach(prestamo => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prestamo.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${prestamo.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prestamo.persona.nombreCompleto}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(prestamo.fechaPrestamo)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="badge ${prestamo.estado ? 'badge-success' : 'badge-warning'}">
                    ${prestamo.estado ? 'Devuelto' : 'En Préstamo'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <button onclick="mostrarEjemplares(${prestamo.id})" class="text-indigo-600 hover:text-indigo-900">
                    <span class="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        ${prestamo.ejemplares.length} ejemplares
                    </span>
                </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <button onclick="mostrarDetalle(${prestamo.id})" class="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded hover:bg-blue-200">
                    Ver Detalle
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePaginationInfo();
}

function mostrarDetalle(idPrestamo) {
    const prestamo = filteredPrestamos.find(p => p.id === idPrestamo);
    if (!prestamo) return;

    const ejemplaresDevueltos = prestamo.ejemplares.filter(e => e.fechaDevolucion);
    const ejemplaresPendientes = prestamo.ejemplares.filter(e => !e.fechaDevolucion);

    const modal = document.getElementById('detalleModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');

    title.textContent = `Detalle del Préstamo #${prestamo.id}`;
    content.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="font-bold text-gray-700">Nombre del Préstamo:</p>
                    <p class="text-gray-600">${prestamo.nombre}</p>
                </div>
                <div>
                    <p class="font-bold text-gray-700">Persona:</p>
                    <p class="text-gray-600">${prestamo.persona.nombreCompleto}</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="font-bold text-gray-700">Fecha de Préstamo:</p>
                    <p class="text-gray-600">${formatDate(prestamo.fechaPrestamo)}</p>
                </div>
                <div>
                    <p class="font-bold text-gray-700">Estado:</p>
                    <span class="badge ${prestamo.estado ? 'badge-success' : 'badge-warning'}">
                        ${prestamo.estado ? 'Devuelto' : 'En Préstamo'}
                    </span>
                </div>
            </div>

            <div class="mt-6">
                <h4 class="font-bold text-lg mb-3">Ejemplares</h4>
                
                ${ejemplaresPendientes.length > 0 ? `
                    <div class="mb-4">
                        <h5 class="font-medium text-gray-700 mb-2">Pendientes de Devolución</h5>
                        <div class="bg-yellow-50 p-3 rounded">
                            ${ejemplaresPendientes.map(e => `
                                <div class="mb-2 last:mb-0">
                                    <p class="font-medium">${e.tituloLibro}</p>
                                    <p class="text-sm text-gray-600">Correlativo: ${e.correlativo}</p>
                                    <p class="text-sm text-gray-600">Fecha Préstamo: ${formatDate(e.fechaPrestamo)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${ejemplaresDevueltos.length > 0 ? `
                    <div>
                        <h5 class="font-medium text-gray-700 mb-2">Ejemplares Devueltos</h5>
                        <div class="bg-green-50 p-3 rounded">
                            ${ejemplaresDevueltos.map(e => `
                                <div class="mb-2 last:mb-0">
                                    <p class="font-medium">${e.tituloLibro}</p>
                                    <p class="text-sm text-gray-600">Correlativo: ${e.correlativo}</p>
                                    <p class="text-sm text-gray-600">Fecha Préstamo: ${formatDate(e.fechaPrestamo)}</p>
                                    <p class="text-sm text-green-600">Fecha Devolución: ${formatDate(e.fechaDevolucion)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detalleModal').classList.add('hidden');
}

// Funciones de paginación
function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredPrestamos.length);
    const totalItems = filteredPrestamos.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function nextPage() {
    const maxPage = Math.ceil(filteredPrestamos.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayPrestamos();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPrestamos();
    }
}

// Función para exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    // Título y fecha
    doc.setFontSize(18);
    doc.text('Historial de Préstamos - Biblioteca UEB', 14, 20);

    doc.setFontSize(11);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30);

    // Aplicar filtros actuales
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    if (fechaInicio || fechaFin) {
        doc.text(`Período: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}`, 14, 40);
    }

    // Preparar datos para la tabla
    const headers = [['ID', 'Nombre', 'Persona', 'Fecha Préstamo', 'Estado', 'Ejemplares']];
    const data = filteredPrestamos.map(prestamo => [
        prestamo.id.toString(),
        prestamo.nombre,
        prestamo.persona.nombreCompleto,
        formatDate(prestamo.fechaPrestamo),
        prestamo.estado ? 'Devuelto' : 'En Préstamo',
        prestamo.ejemplares.map(e => 
            `${e.tituloLibro} (${e.correlativo})${e.fechaDevolucion ? ' - Devuelto' : ''}`
        ).join('\n')
    ]);

    doc.autoTable({
        head: headers,
        body: data,
        startY: fechaInicio || fechaFin ? 45 : 35,
        theme: 'grid',
        styles: { 
            fontSize: 8,
            cellPadding: 2
        },
        columnStyles: {
            5: { cellWidth: 80 } // Columna de ejemplares más ancha
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: 255 
        },
        alternateRowStyles: { 
            fillColor: [245, 245, 245] 
        }
    });

    doc.save('historial-prestamos-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}

// Funciones de utilidad
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

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

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}