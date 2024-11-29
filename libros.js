// Configuración base para las peticiones
const API_URL = 'http://documentalmanage-001-site1.otempurl.com/api';

// Estados
let editMode = false;
let currentPage = 1;
let itemsPerPage = 10;
let allBooks = [];
let filteredBooks = [];
let currentLibroId = null;

// Cache para los datos de los selects
let cacheTiposLibro = [];
let cacheIdiomas = [];
let cacheEditoriales = [];
let cacheCarreras = [];

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await initializeSelects();
    await cargarLibros();
    
    // Event listener para búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });

    // Inicializar Select2 para selects múltiples
    initializeSelect2();
});

function initializeSelect2() {
    $('#autores').select2({
        placeholder: 'Seleccione autores',
        width: '100%'
    });

    $('#temas').select2({
        placeholder: 'Seleccione temas',
        width: '100%'
    });

    $('#nuevosAutores').select2({
        placeholder: 'Seleccione autores para agregar',
        width: '100%'
    });

    $('#nuevosTemas').select2({
        placeholder: 'Seleccione temas para agregar',
        width: '100%'
    });
}

// Funciones para cargar datos iniciales
async function initializeSelects() {
    try {
        showLoading();
        
        // Cargar todos los datos necesarios en paralelo
        const [tiposLibro, idiomas, editoriales, carreras] = await Promise.all([
            fetch(`${API_URL}/TiposLibros/ObtenerTiposLibros`).then(r => r.json()),
            fetch(`${API_URL}/Idiomas/ObtenerIdiomas`).then(r => r.json()),
            fetch(`${API_URL}/Editoriales/ObtenerEditoriales`).then(r => r.json()),
            fetch(`${API_URL}/Carreras/ObtenerCarreras`).then(r => r.json())
        ]);

        // Guardar en cache
        cacheTiposLibro = tiposLibro.data;
        cacheIdiomas = idiomas.data;
        cacheEditoriales = editoriales.data;
        cacheCarreras = carreras.data;

        // Llenar los selects
        fillSelect('tipoLibro', cacheTiposLibro, 'id', 'descripcion');
        fillSelect('idioma', cacheIdiomas, 'id', 'descripcion');
        fillSelect('editorial', cacheEditoriales, 'id', 'nombre');
        fillSelect('carrera', cacheCarreras, 'id', 'nombre');

    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar los datos iniciales');
        console.error('Error:', error);
    } finally {
        hideLoading();
    }
}

function fillSelect(selectId, data, valueField, textField) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Seleccione una opción</option>';
    
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[textField];
        select.appendChild(option);
    });
}

// Funciones para los modales
function openModal(type) {
    const modalId = `${type}Modal`;
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        
        if (type === 'libro') {
            if (!editMode) {
                // Si es nuevo libro
                document.getElementById('libroForm').reset();
                document.getElementById('libroModalTitle').textContent = 'Nuevo Libro';
                document.querySelectorAll('.create-only-fields').forEach(el => el.style.display = 'grid');
                
                // Inicializar selects vacíos
                initializeAutoresSelect([]);
                initializeTemasSelect([]);
                
                // Cargar las opciones disponibles para nuevo libro
                cargarOpcionesParaNuevoLibro();
            }
        }
    } else {
        console.error(`Modal with id ${modalId} not found`);
    }
}
// Función para cargar opciones en nuevo libro
async function cargarOpcionesParaNuevoLibro() {
    try {
        showLoading();
        
        // Cargar todos los autores y temas disponibles
        const [autoresResponse, temasResponse] = await Promise.all([
            fetch(`${API_URL}/Autores/ObtenerAutores`).then(r => r.json()),
            fetch(`${API_URL}/Temas/ObtenerTemas`).then(r => r.json())
        ]);

        if (autoresResponse.succeded) {
            const selectAutores = $('#autores');
            selectAutores.empty();
            
            autoresResponse.data.forEach(autor => {
                const option = new Option(autor.nombre, autor.id, false, false);
                selectAutores.append(option);
            });
            selectAutores.trigger('change');
        }

        if (temasResponse.succeded) {
            const selectTemas = $('#temas');
            selectTemas.empty();
            
            temasResponse.data.forEach(tema => {
                const option = new Option(tema.descripcion, tema.id, false, false);
                selectTemas.append(option);
            });
            selectTemas.trigger('change');
        }

    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar las opciones');
        console.error(error);
    } finally {
        hideLoading();
    }
}

function closeModal(type) {
    const modal = document.getElementById(`${type}Modal`);
    modal.classList.add('opacity-0', 'pointer-events-none');
    
    if (type === 'libro') {
        document.getElementById('libroForm').reset();
        editMode = false;
    }
}

// Funciones para el spinner y notificaciones
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

// Funciones de paginación
function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredBooks.length);
    const totalItems = filteredBooks.length;

    document.getElementById('startIndex').textContent = startIndex;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${libro.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${libro.tipoLibro}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${libro.idioma}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${libro.editorial}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${libro.carrera} (${libro.siglaCarrera})</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Bs. ${libro.precio}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <button onclick="mostrarAutores(${libro.id})" class="text-indigo-600 hover:text-indigo-900">
                    <span class="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        ${libro.autores?.length || 0} autores
                    </span>
                </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <button onclick="mostrarTemas(${libro.id})" class="text-green-600 hover:text-green-900">
                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        ${libro.temas?.length || 0} temas
                    </span>
                </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="consultarLibro(${libro.id})" class="text-blue-600 hover:text-blue-900 mr-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                </button>
                <button onclick="editarLibro(${libro.id})" class="text-indigo-600 hover:text-indigo-900 mr-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button onclick="eliminarLibro(${libro.id})" class="text-red-600 hover:text-red-900">
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

// Funciones de navegación
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
// Función para editar un libro
async function editarLibro(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Libros/ObtenerInformacionCompletaDeUnLibroPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            editMode = true;
            const libro = data.data;
            
            // Cargar datos básicos
            document.getElementById('libroId').value = libro.id;
            document.getElementById('nombre').value = libro.nombre;
            document.getElementById('tipoLibro').value = libro.idTipoLibro;
            document.getElementById('idioma').value = libro.idIdioma;
            document.getElementById('editorial').value = libro.idEditorial;
            document.getElementById('carrera').value = libro.idCarrera;
            document.getElementById('precio').value = libro.precio;

            // Asegurarse de que los selects estén visibles
            document.querySelectorAll('.create-only-fields').forEach(el => el.style.display = 'grid');

            // Inicializar selects
            await Promise.all([
                initializeAutoresSelect(libro.autores),
                initializeTemasSelect(libro.temas)
            ]);

            document.getElementById('libroModalTitle').textContent = 'Editar Libro';
            openModal('libro');
        } else {
            showNotification('error', 'Error', 'No se pudo cargar el libro');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Función de búsqueda
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredBooks = allBooks.filter(book => 
        book.nombre.toLowerCase().includes(searchTerm) ||
        book.tipoLibro.toLowerCase().includes(searchTerm) ||
        book.idioma.toLowerCase().includes(searchTerm) ||
        book.editorial.toLowerCase().includes(searchTerm) ||
        book.carrera.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayBooks();
}
// Función para consultar un libro
async function consultarLibro(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Libros/ObtenerInformacionCompletaDeUnLibroPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            const libro = data.data;
            
            // Llenar la información en el modal
            document.getElementById('consulta-id').textContent = libro.id;
            document.getElementById('consulta-nombre').textContent = libro.nombre;
            document.getElementById('consulta-tipo').textContent = libro.tipoLibro;
            document.getElementById('consulta-idioma').textContent = libro.idioma;
            document.getElementById('consulta-editorial').textContent = libro.editorial;
            document.getElementById('consulta-carrera').textContent = `${libro.carrera} (${libro.siglaCarrera})`;
            document.getElementById('consulta-precio').textContent = `Bs. ${libro.precio}`;

            // Llenar autores
            const autoresContainer = document.getElementById('consulta-autores');
            autoresContainer.innerHTML = libro.autores.map(autor => `
                <div class="bg-indigo-50 p-2 rounded">
                    <span class="text-indigo-700">${autor.nombre}</span>
                </div>
            `).join('');

            // Llenar temas
            const temasContainer = document.getElementById('consulta-temas');
            temasContainer.innerHTML = libro.temas.map(tema => `
                <div class="bg-green-50 p-2 rounded">
                    <span class="text-green-700">${tema.descripcion}</span>
                </div>
            `).join('');

            openModal('consulta');
        } else {
            showNotification('error', 'Error', 'No se pudo cargar la información del libro');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}
// Funciones CRUD principales
async function cargarLibros() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Libros/ObtenerInformacionCompletaDeTodosLosLibros`);
        const data = await response.json();

        if (data.succeded) {
            allBooks = data.data;
            filteredBooks = [...allBooks];
            displayBooks();
        } else {
            showNotification('error', 'Error', 'No se pudieron cargar los libros');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        console.error('Error:', error);
    } finally {
        hideLoading();
    }
}

async function cargarLibroParaEditar(id) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/Libros/ObtenerInformacionCompletaDeUnLibroPorId?id=${id}`);
        const data = await response.json();

        if (data.succeded) {
            const libro = data.data;
            
            // Cargar datos básicos
            document.getElementById('libroId').value = libro.id;
            document.getElementById('nombre').value = libro.nombre;
            document.getElementById('tipoLibro').value = libro.idTipoLibro;
            document.getElementById('idioma').value = libro.idIdioma;
            document.getElementById('editorial').value = libro.idEditorial;
            document.getElementById('carrera').value = libro.idCarrera;
            document.getElementById('precio').value = libro.precio;

            // Inicializar y llenar select2 para autores
            await initializeAutoresSelect(libro.autores);
            
            // Inicializar y llenar select2 para temas
            await initializeTemasSelect(libro.temas);

            // Mostrar los selects en modo edición
            document.querySelectorAll('.create-only-fields').forEach(el => el.style.display = 'grid');
        } else {
            showNotification('error', 'Error', 'No se pudo cargar el libro');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        console.error(error);
    } finally {
        hideLoading();
    }
}
// Funciones para inicializar los selects
async function initializeAutoresSelect(autoresActuales = []) {
    const selectAutores = $('#autores');
    
    // Configurar select2
    selectAutores.select2({
        theme: 'default', // Usamos el tema por defecto por ahora
        placeholder: 'Seleccione autores',
        width: '100%',
        language: {
            noResults: function() {
                return "No se encontraron resultados";
            }
        }
    });

    // Limpiar opciones existentes
    selectAutores.empty();

    // Agregar las opciones actuales
    autoresActuales.forEach(autor => {
        const option = new Option(autor.nombre, autor.id, true, true);
        selectAutores.append(option);
    });

    // Actualizar select2
    selectAutores.trigger('change');
}

async function initializeTemasSelect(temasActuales = []) {
    const selectTemas = $('#temas');
    
    // Configurar select2
    selectTemas.select2({
        theme: 'default', // Usamos el tema por defecto por ahora
        placeholder: 'Seleccione temas',
        width: '100%',
        language: {
            noResults: function() {
                return "No se encontraron resultados";
            }
        }
    });

    // Limpiar opciones existentes
    selectTemas.empty();

    // Agregar las opciones actuales
    temasActuales.forEach(tema => {
        const option = new Option(tema.descripcion, tema.id, true, true);
        selectTemas.append(option);
    });

    // Actualizar select2
    selectTemas.trigger('change');
}


async function cargarAutoresYTemasParaNuevo() {
    try {
        showLoading();
        const [autoresResponse, temasResponse] = await Promise.all([
            fetch(`${API_URL}/Autores/ObtenerAutores`),
            fetch(`${API_URL}/Temas/ObtenerTemas`)
        ]);

        const autoresData = await autoresResponse.json();
        const temasData = await temasResponse.json();

        if (autoresData.succeded) {
            fillSelect('autores', autoresData.data, 'id', 'nombre');
        }

        if (temasData.succeded) {
            fillSelect('temas', temasData.data, 'id', 'descripcion');
        }

        // Reinicializar Select2
        $('#autores').trigger('change');
        $('#temas').trigger('change');

    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar autores y temas');
    } finally {
        hideLoading();
    }
}

async function handleSubmitLibro(event) {
    event.preventDefault();
    
    const libroData = {
        nombre: document.getElementById('nombre').value.trim(),
        idTipoLibro: parseInt(document.getElementById('tipoLibro').value),
        idIdioma: parseInt(document.getElementById('idioma').value),
        idEditorial: parseInt(document.getElementById('editorial').value),
        idCarrera: parseInt(document.getElementById('carrera').value),
        precio: parseFloat(document.getElementById('precio').value)
    };

    if (editMode) {
        libroData.id = parseInt(document.getElementById('libroId').value);
        // Obtener los autores y temas seleccionados en el modo edición
        const autoresSelect = $('#autores').select2('data');
        const temasSelect = $('#temas').select2('data');
        libroData.idAutores = autoresSelect.map(a => parseInt(a.id));
        libroData.idTemas = temasSelect.map(t => parseInt(t.id));
    } else {
        const autoresSelect = $('#autores').select2('data');
        const temasSelect = $('#temas').select2('data');
        libroData.autoresIds = autoresSelect.map(a => parseInt(a.id));
        libroData.temasIds = temasSelect.map(t => parseInt(t.id));
    }

    try {
        showLoading();
        const url = editMode ? 
            `${API_URL}/Libros/ActualizarLibro` : 
            `${API_URL}/Libros/CrearLibro`;

        const response = await fetch(url, {
            method: editMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(libroData)
        });

        if (response.ok) {
            showNotification('success', 'Éxito', `Libro ${editMode ? 'actualizado' : 'creado'} correctamente`);
            closeModal('libro');
            await cargarLibros();
        } else {
            showNotification('error', 'Error', `No se pudo ${editMode ? 'actualizar' : 'crear'} el libro`);
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function eliminarLibro(id) {
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
            const response = await fetch(`${API_URL}/Libros/EliminarLibro?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('success', 'Éxito', 'Libro eliminado correctamente');
                await cargarLibros();
            } else {
                showNotification('error', 'Error', 'No se pudo eliminar el libro');
            }
        } catch (error) {
            showNotification('error', 'Error', 'Error al conectar con el servidor');
        } finally {
            hideLoading();
        }
    }
}

// Gestión de Autores
async function mostrarAutores(libroId) {
    currentLibroId = libroId;
    try {
        showLoading();
        const [autoresActuales, autoresDisponibles] = await Promise.all([
            fetch(`${API_URL}/Libros/ObtenerAutoresDeUnLibroPorId?id=${libroId}`).then(r => r.json()),
            fetch(`${API_URL}/Libros/ObtenerAutoresNoRelacionadosPorLibro?id=${libroId}`).then(r => r.json())
        ]);

        if (autoresActuales.succeded && autoresDisponibles.succeded) {
            // Mostrar autores actuales
            const listaAutores = document.getElementById('listaAutoresActuales');
            listaAutores.innerHTML = '';
            autoresActuales.data.autores.forEach(autor => {
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
                li.innerHTML = `
                    <span>${autor.nombre}</span>
                `;
                listaAutores.appendChild(li);
            });

            // Cargar autores disponibles en el select
            const selectNuevosAutores = document.getElementById('nuevosAutores');
            selectNuevosAutores.innerHTML = '';
            autoresDisponibles.data.forEach(autor => {
                const option = document.createElement('option');
                option.value = autor.id;
                option.textContent = autor.nombre;
                selectNuevosAutores.appendChild(option);
            });

            // Reinicializar Select2
            $('#nuevosAutores').trigger('change');

            openModal('autores');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar los autores');
    } finally {
        hideLoading();
    }
}

async function guardarNuevosAutores() {
    const nuevosAutores = Array.from($('#nuevosAutores').select2('data')).map(a => parseInt(a.id));
    
    if (nuevosAutores.length === 0) {
        showNotification('warning', 'Atención', 'Seleccione al menos un autor para agregar');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_URL}/Libros/AgregarAutoresAUnLibro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idLibro: currentLibroId,
                idAutores: nuevosAutores
            })
        });

        if (response.ok) {
            showNotification('success', 'Éxito', 'Autores agregados correctamente');
            closeModal('autores');
            await cargarLibros();
        } else {
            showNotification('error', 'Error', 'No se pudieron agregar los autores');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Gestión de Temas
async function mostrarTemas(libroId) {
    currentLibroId = libroId;
    try {
        showLoading();
        const [temasActuales, temasDisponibles] = await Promise.all([
            fetch(`${API_URL}/Libros/ObtenerTemasDeUnLibroPorId?id=${libroId}`).then(r => r.json()),
            fetch(`${API_URL}/Libros/ObtenerTemasNoRelacionadosPorLibro?id=${libroId}`).then(r => r.json())
        ]);

        if (temasActuales.succeded && temasDisponibles.succeded) {
            // Mostrar temas actuales
            const listaTemas = document.getElementById('listaTemasActuales');
            listaTemas.innerHTML = '';
            temasActuales.data.temas.forEach(tema => {
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
                li.innerHTML = `
                    <span>${tema.descripcion}</span>
                `;
                listaTemas.appendChild(li);
            });

            // Cargar temas disponibles en el select
            const selectNuevosTemas = document.getElementById('nuevosTemas');
            selectNuevosTemas.innerHTML = '';
            temasDisponibles.data.forEach(tema => {
                const option = document.createElement('option');
                option.value = tema.id;
                option.textContent = tema.descripcion;
                selectNuevosTemas.appendChild(option);
            });

            // Reinicializar Select2
            $('#nuevosTemas').trigger('change');

            openModal('temas');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al cargar los temas');
    } finally {
        hideLoading();
    }
}

async function guardarNuevosTemas() {
    const nuevosTemas = Array.from($('#nuevosTemas').select2('data')).map(t => parseInt(t.id));
    
    if (nuevosTemas.length === 0) {
        showNotification('warning', 'Atención', 'Seleccione al menos un tema para agregar');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_URL}/Libros/AgregarTemasAUnLibro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idLibro: currentLibroId,
                idTemas: nuevosTemas
            })
        });

        if (response.ok) {
            showNotification('success', 'Éxito', 'Temas agregados correctamente');
            closeModal('temas');
            await cargarLibros();
        } else {
            showNotification('error', 'Error', 'No se pudieron agregar los temas');
        }
    } catch (error) {
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Exportar a PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    // Título
    doc.setFontSize(18);
    doc.text('Catálogo de Libros - Biblioteca UEB', 14, 20);

    // Fecha
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Preparar datos para la tabla
    const headers = [['ID', 'Nombre', 'Tipo', 'Idioma', 'Editorial', 'Carrera', 'Precio']];
    const data = filteredBooks.map(book => [
        book.id.toString(),
        book.nombre,
        book.tipoLibro,
        book.idioma,
        book.editorial,
        `${book.carrera} (${book.siglaCarrera})`,
        `Bs. ${book.precio}`
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
    doc.save('catalogo-libros-ueb.pdf');
    showNotification('success', 'Éxito', 'El PDF ha sido generado correctamente');
}