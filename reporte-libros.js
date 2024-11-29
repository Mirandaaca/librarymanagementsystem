// Configuración base para las peticiones
const API_URL = 'https://documentalmanage-001-site1.otempurl.com/api';

// Estados
let currentPage = 1;
let itemsPerPage = 10;
let allBooks = [];
let filteredBooks = [];
let tiposLibro = new Set();
let carreras = new Set();

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarLibros();
    
    // Event listeners para filtros
    document.getElementById('tipoLibroFilter').addEventListener('change', aplicarFiltros);
    document.getElementById('carreraFilter').addEventListener('change', aplicarFiltros);
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(aplicarFiltros, 300);
    });
});

// Funciones principales
async function cargarLibros() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Libros/ObtenerInformacionCompletaDeTodosLosLibrosParaReporte`);
        const data = await response.json();

        if (data.succeded) {
            allBooks = data.data;
            filteredBooks = [...allBooks];
            
            // Cargar filtros dinámicamente
            cargarFiltros(allBooks);
            
            displayBooks();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar los libros');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        console.error(error);
    } finally {
        hideLoading();
    }
}

function cargarFiltros(libros) {
    // Obtener tipos de libro únicos
    const tipoLibroSelect = document.getElementById('tipoLibroFilter');
    tipoLibroSelect.innerHTML = '<option value="">Todos los tipos</option>';
    
    const tiposUnicos = new Set(libros.map(libro => libro.tipoLibro));
    tiposUnicos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        tipoLibroSelect.appendChild(option);
    });

    // Obtener carreras únicas
    const carreraSelect = document.getElementById('carreraFilter');
    carreraSelect.innerHTML = '<option value="">Todas las carreras</option>';
    
    const carrerasUnicas = new Set(libros.map(libro => libro.carrera));
    carrerasUnicas.forEach(carrera => {
        const option = document.createElement('option');
        option.value = carrera;
        option.textContent = carrera;
        carreraSelect.appendChild(option);
    });
}

function aplicarFiltros() {
    const tipoLibro = document.getElementById('tipoLibroFilter').value.toLowerCase();
    const carrera = document.getElementById('carreraFilter').value.toLowerCase();
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredBooks = allBooks.filter(libro => {
        const cumpleTipo = !tipoLibro || libro.tipoLibro.toLowerCase() === tipoLibro;
        const cumpleCarrera = !carrera || libro.carrera.toLowerCase() === carrera;
        
        const cumpleBusqueda = !searchTerm || 
            libro.nombre.toLowerCase().includes(searchTerm) ||
            libro.autores.some(autor => autor.nombre.toLowerCase().includes(searchTerm)) ||
            libro.temas.some(tema => tema.descripcion.toLowerCase().includes(searchTerm));

        return cumpleTipo && cumpleCarrera && cumpleBusqueda;
    });

    currentPage = 1;
    displayBooks();
}

function displayBooks() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageBooks = filteredBooks.slice(start, end);

    const tbody = document.getElementById('tablaLibros');
    tbody.innerHTML = '';

    pageBooks.forEach(libro => {
        const tr = document.createElement('tr');
        tr.classList.add('fade-in');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${libro.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 font-medium">${libro.nombre}</div>
                <div class="text-sm text-gray-500">
                    ${libro.ejemplares.length} ejemplar(es)
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${libro.tipoLibro}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${libro.carrera}</div>
                <div class="text-xs text-gray-500">${libro.siglaCarrera}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${libro.idioma}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${libro.editorial}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">Bs. ${libro.precio}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <button onclick="mostrarDetalle(${libro.id})" class="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded hover:bg-blue-200">
                    Ver Detalle
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePaginationInfo();
}

function mostrarDetalle(id) {
    const libro = filteredBooks.find(l => l.id === id);
    if (!libro) return;

    const modal = document.getElementById('detalleModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');

    title.textContent = `Detalle del Libro: ${libro.nombre}`;
    content.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <p class="font-bold text-gray-700">Información General</p>
                    <div class="bg-gray-50 p-3 rounded">
                        <p><span class="font-medium">Tipo:</span> ${libro.tipoLibro}</p>
                        <p><span class="font-medium">Idioma:</span> ${libro.idioma}</p>
                        <p><span class="font-medium">Editorial:</span> ${libro.editorial}</p>
                        <p><span class="font-medium">Carrera:</span> ${libro.carrera} (${libro.siglaCarrera})</p>
                        <p><span class="font-medium">Precio:</span> Bs. ${libro.precio}</p>
                    </div>
                </div>
                
                <div class="space-y-2">
                    <p class="font-bold text-gray-700">Autores</p>
                    <div class="bg-blue-50 p-3 rounded">
                        ${libro.autores.map(autor => `
                            <div class="mb-1 last:mb-0">
                                <span class="text-blue-700">${autor.nombre}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <p class="font-bold text-gray-700">Temas</p>
                    <div class="bg-green-50 p-3 rounded">
                        ${libro.temas.map(tema => `
                            <div class="mb-1 last:mb-0">
                                <span class="text-green-700">${tema.descripcion}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="space-y-2">
                    <p class="font-bold text-gray-700">Ejemplares</p>
                    <div class="bg-purple-50 p-3 rounded space-y-3">
                        ${libro.ejemplares.map(ejemplar => `
                            <div class="border-b border-purple-100 last:border-0 pb-2 last:pb-0">
                                <p class="font-medium text-purple-800">Correlativo: ${ejemplar.correlativo}</p>
                                <p class="text-sm text-purple-700">Clase: ${ejemplar.clase}</p>
                                <p class="text-sm text-purple-700">Categoría: ${ejemplar.categoria}</p>
                                <p class="text-sm">Estado: 
                                    <span class="badge ${ejemplar.disponible ? 'badge-success' : 'badge-warning'}">
                                        ${ejemplar.disponible ? 'Disponible' : 'No Disponible'}
                                    </span>
                                </p>
                                ${ejemplar.campo ? `<p class="text-sm text-purple-600 mt-1">Nota: ${ejemplar.campo}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
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
    const endIndex = Math.min(currentPage * itemsPerPage, filteredBooks.length);
    const totalItems = filteredBooks.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
}

function nextPage() {
    const maxPage = Math.ceil(filteredBooks.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        displayBooks();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayBooks();
    }
}

// Función para exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    // Título
    doc.setFontSize(18);
    doc.text('Catálogo de Libros - Biblioteca UEB', 14, 20);

    // Fecha e información de filtros
    doc.setFontSize(11);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30);

    const tipoLibroFiltro = document.getElementById('tipoLibroFilter').value;
    const carreraFiltro = document.getElementById('carreraFilter').value;
    let yPos = 35;

    if (tipoLibroFiltro || carreraFiltro) {
        if (tipoLibroFiltro) {
            doc.text(`Tipo de Libro: ${tipoLibroFiltro}`, 14, yPos);
            yPos += 5;
        }
        if (carreraFiltro) {
            doc.text(`Carrera: ${carreraFiltro}`, 14, yPos);
            yPos += 5;
        }
    }

    const headers = [
        ['ID', 'Nombre', 'Tipo', 'Carrera', 'Idioma', 'Editorial', 'Precio', 'Autores', 'Temas', 'Ejemplares']
    ];

    const data = filteredBooks.map(libro => [
        libro.id.toString(),
        libro.nombre,
        libro.tipoLibro,
        `${libro.carrera} (${libro.siglaCarrera})`,
        libro.idioma,
        libro.editorial,
        `Bs. ${libro.precio}`,
        libro.autores.map(a => a.nombre).join('\n'),
        libro.temas.map(t => t.descripcion).join('\n'),
        libro.ejemplares.map(e => 
            `${e.correlativo} - ${e.clase}\n${e.disponible ? 'Disponible' : 'No disponible'}`
        ).join('\n\n')
    ]);

    doc.autoTable({
        head: headers,
        body: data,
        startY: yPos + 5,
        theme: 'grid',
        styles: { 
            fontSize: 8,
            cellPadding: 2
        },
        columnStyles: {
            7: { cellWidth: 40 }, // Autores
            8: { cellWidth: 40 }, // Temas
            9: { cellWidth: 40 }  // Ejemplares
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: 255 
        },
        alternateRowStyles: { 
            fillColor: [245, 245, 245] 
        }
    });

    doc.save('catalogo-libros-ueb.pdf');
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