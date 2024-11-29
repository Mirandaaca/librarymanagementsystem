 // Función para mostrar/ocultar contraseña
 function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggle.classList.remove('fa-eye');
        passwordToggle.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordToggle.classList.remove('fa-eye-slash');
        passwordToggle.classList.add('fa-eye');
    }
}

// Función para mostrar el loader
function showLoader() {
    Swal.fire({
        title: 'Iniciando sesión',
        html: 'Por favor espere...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// Función para mostrar error
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: '#1d4ed8'
    });
}

// Función para mostrar éxito
async function showSuccessAndRedirect(message) {
   // Mostrar mensaje de éxito por 2 segundos
   const result = await Swal.fire({
    icon: 'success',
    title: '¡Bienvenido!',
    text: message,
    showConfirmButton: false,
    timer: 1500, // 2 segundos
    timerProgressBar: true, // Muestra una barra de progreso
    didOpen: () => {
        Swal.showLoading();
    }
});

// Después de que se cierre el mensaje de éxito, mostrar mensaje de redirección
await Swal.fire({
    icon: 'info',
    title: 'Redireccionando...',
    text: 'Será redirigido al panel principal',
    showConfirmButton: false,
    timer: 1000, // 1.5 segundos adicionales
    timerProgressBar: true,
    didOpen: () => {
        Swal.showLoading();
    }
});

// Finalmente redirigir
window.location.href = 'index.html';
}

// Función para guardar datos en localStorage
function saveUserData(userData) {
    localStorage.setItem('jwtToken', userData.data.jwtToken);
    localStorage.setItem('userName', userData.data.userName);
    localStorage.setItem('userRole', userData.data.rol);
    localStorage.setItem('userEmail', userData.data.email);
    localStorage.setItem('userId', userData.data.idUsuario);
    localStorage.setItem('userFullName', `${userData.data.datosUsuario.nombre} ${userData.data.datosUsuario.apellido}`);
    
    const expirationTime = new Date().getTime() + (60 * 60 * 1000);
    localStorage.setItem('tokenExpiration', expirationTime.toString());
}

// Modificación en el manejo del envío del formulario
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validación básica
    if (!email || !password) {
        showError('Por favor complete todos los campos');
        return;
    }

    try {
        showLoader();

        const response = await fetch('http://documentalmanage-001-site1.otempurl.com/api/Usuarios/LogIn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (data.succeded) {
            // Guardamos los datos del usuario
            saveUserData(data);
            
            // Mostramos mensaje de éxito y redireccionamos
            await showSuccessAndRedirect(data.message);
        } else {
            showError(data.message || 'Credenciales incorrectas');
        }
    } catch (error) {
        showError('Error al conectar con el servidor. Por favor intente más tarde.');
        console.error('Error:', error);
    }
});

// Verificar sesión activa al cargar la página
window.addEventListener('load', () => {
    const token = localStorage.getItem('jwtToken');
    const expiration = localStorage.getItem('tokenExpiration');
    
    if (token && expiration) {
        if (new Date().getTime() < parseInt(expiration)) {
            // Sesión válida, redirigir con mensaje
            showSuccessAndRedirect('Sesión activa').then(() => {
                window.location.href = 'index.html';
            });
        } else {
            // Token expirado
            localStorage.clear();
            Swal.fire({
                icon: 'info',
                title: 'Sesión expirada',
                text: 'Por favor, inicie sesión nuevamente',
                confirmButtonColor: '#1d4ed8'
            });
        }
    }
});

