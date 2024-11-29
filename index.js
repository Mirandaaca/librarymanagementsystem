 // Manejar el toggle del sidebar
 const sidebar = document.getElementById('sidebar');
 const toggleBtn = document.getElementById('toggleSidebar');
 const toggleIcon = document.getElementById('toggleIcon');

 toggleBtn.addEventListener('click', () => {
     sidebar.classList.toggle('w-64');
     sidebar.classList.toggle('w-16');
     sidebar.classList.toggle('sidebar-collapsed');
     
     // Ajustar el ícono
     if (sidebar.classList.contains('w-16')) {
         toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />';
     } else {
         toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />';
     }
 });

 // Manejar los submenús
 const menuItems = document.querySelectorAll('.menu-item');
 menuItems.forEach(item => {
     const button = item.querySelector('button');
     const submenu = item.querySelector('.submenu');
     const arrow = item.querySelector('.submenu-arrow');

     button.addEventListener('click', () => {
         // Solo mostrar submenú si el sidebar está expandido
         if (!sidebar.classList.contains('sidebar-collapsed')) {
             submenu.classList.toggle('hidden');
             arrow.classList.toggle('rotate-180');
         }
     });
 });
 // Función para mostrar confirmación de cierre de sesión (puedes usarla en tu dashboard)
function confirmLogout() {
    return Swal.fire({
        title: '¿Cerrar sesión?',
        text: "¿Está seguro que desea cerrar la sesión?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1d4ed8',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    });
}
// Variables globales
let allBooks = [];
let filteredBooks = [];
let currentPage = 1;
const booksPerPage = 9;

// Función para cargar los libros
async function loadBooks() {
    try {
        document.getElementById('loadingSpinner').classList.remove('hidden');
        document.getElementById('librosGrid').classList.add('opacity-0');
        
        const response = await fetch('http://documentalmanage-001-site1.otempurl.com/api/Ejemplares/ObtenerInformacionParaBusquedaPorEjemplares');
        const data = await response.json();

        if (data.succeded) {
            allBooks = data.data;
            filteredBooks = [...allBooks];
            displayBooks();
            updatePaginationInfo();
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los libros. Por favor, intenta de nuevo más tarde.',
        });
    } finally {
        setTimeout(() => {
            document.getElementById('loadingSpinner').classList.add('hidden');
            document.getElementById('librosGrid').classList.remove('opacity-0');
        }, 500);
    }
}

// Función para mostrar los libros
function displayBooks() {
    const grid = document.getElementById('librosGrid');
    const noResults = document.getElementById('noResults');
    
    if (filteredBooks.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        document.getElementById('pagination').classList.add('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    document.getElementById('pagination').classList.remove('hidden');

    const startIndex = (currentPage - 1) * booksPerPage;
    const endIndex = Math.min(startIndex + booksPerPage, filteredBooks.length);
    const booksToShow = filteredBooks.slice(startIndex, endIndex);

    grid.innerHTML = booksToShow.map(book => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg ${book.disponibilidad ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">${book.titulo}</h3>
                    <div class="px-3 py-1.5 text-sm font-medium rounded ${book.disponibilidad ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} whitespace-nowrap">
                        ${book.disponibilidad ? 'Disponible' : 'No disponible'}
                    </div>
                </div>
                
                <div class="space-y-2">
                    <p class="text-sm text-gray-600">
                        <span class="font-medium">Autores:</span> 
                        ${book.autores.join(', ')}
                    </p>
                    <p class="text-sm text-gray-600">
                        <span class="font-medium">Editorial:</span> 
                        ${book.editorial}
                    </p>
                    <p class="text-sm text-gray-600">
                        <span class="font-medium">Área:</span> 
                        ${book.area}
                    </p>
                    <p class="text-sm text-gray-600">
                        <span class="font-medium">Correlativo:</span> 
                        ${book.correlativo}
                    </p>
                    <p class="text-sm text-gray-600">
                        <span class="font-medium">Temas:</span> 
                        ${book.temas.join(', ')}
                    </p>
                </div>
            </div>
        </div>
    `).join('');

    updatePaginationInfo();
}

// Función para actualizar la información de paginación
function updatePaginationInfo() {
    const startIndex = Math.min((currentPage - 1) * booksPerPage + 1, filteredBooks.length);
    const endIndex = Math.min(currentPage * booksPerPage, filteredBooks.length);
    const totalItems = filteredBooks.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;

    // Actualizar estado de los botones
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const prevButtonMobile = document.getElementById('prevButtonMobile');
    const nextButtonMobile = document.getElementById('nextButtonMobile');

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = endIndex >= totalItems;
    prevButtonMobile.disabled = currentPage === 1;
    nextButtonMobile.disabled = endIndex >= totalItems;

    [prevButton, prevButtonMobile].forEach(button => {
        button.classList.toggle('opacity-50', currentPage === 1);
    });

    [nextButton, nextButtonMobile].forEach(button => {
        button.classList.toggle('opacity-50', endIndex >= totalItems);
    });
}

// Función para filtrar libros
function filterBooks(searchTerm) {
    const term = searchTerm.toLowerCase();
    const searchType = document.getElementById('searchType').value;

    filteredBooks = allBooks.filter(book => {
        switch(searchType) {
            case 'autor':
                return book.autores.some(autor => autor.toLowerCase().includes(term));
            case 'area':
                return book.area.toLowerCase().includes(term);
            case 'editorial':
                return book.editorial.toLowerCase().includes(term);
            case 'correlativo':
                return book.correlativo.toLowerCase().includes(term);
            default:
                return book.titulo.toLowerCase().includes(term) ||
                       book.autores.some(autor => autor.toLowerCase().includes(term)) ||
                       book.area.toLowerCase().includes(term) ||
                       book.editorial.toLowerCase().includes(term) ||
                       book.correlativo.toLowerCase().includes(term) ||
                       book.temas.some(tema => tema.toLowerCase().includes(term));
        }
    });

    currentPage = 1;
    displayBooks();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    
    // Búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterBooks(e.target.value);
        }, 300);
    });

    // Cambio de tipo de búsqueda
    document.getElementById('searchType').addEventListener('change', () => {
        filterBooks(document.getElementById('searchInput').value);
    });

    // Paginación
    document.getElementById('prevButton').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayBooks();
        }
    });

    document.getElementById('nextButton').addEventListener('click', () => {
        if (currentPage * booksPerPage < filteredBooks.length) {
            currentPage++;
            displayBooks();
        }
    });

    // Paginación móvil
    document.getElementById('prevButtonMobile').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayBooks();
        }
    });

    document.getElementById('nextButtonMobile').addEventListener('click', () => {
        if (currentPage * booksPerPage < filteredBooks.length) {
            currentPage++;
            displayBooks();
        }
    });
});