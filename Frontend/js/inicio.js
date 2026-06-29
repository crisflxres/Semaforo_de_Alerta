// 1. Lógica del Menú Lateral (Sidebar) y Dropdown de Perfil
document.addEventListener('DOMContentLoaded', () => {
    // Elementos del Sidebar
    const btnHamburguesa = document.getElementById("btnHamburguesa");
    const btnCerrar = document.getElementById("btnCerrarSidebar");
    const overlay = document.getElementById("sidebarOverlay");

    // Elementos del Dropdown de Perfil
    const avatarUsuario = document.getElementById('avatarUsuario');
    const dropdownPerfil = document.getElementById('dropdownPerfil');

    // --- LÓGICA DEL SIDEBAR ---
    if (btnHamburguesa) {
        btnHamburguesa.addEventListener("click", () => overlay.classList.add("open"));
    }
    
    if (btnCerrar) {
        btnCerrar.addEventListener("click", () => overlay.classList.remove("open"));
    }

    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.classList.remove("open");
        });
    }

    // --- LÓGICA DEL DROPDOWN DE PERFIL ---
    if (avatarUsuario && dropdownPerfil) {
        // Al dar clic en el avatar, abre o cierra el menú mini
        avatarUsuario.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el clic cierre el menú inmediatamente
            dropdownPerfil.classList.toggle('open');
        });

        // Cierra el menú si el usuario da clic en cualquier otra parte de la pantalla
        document.addEventListener('click', (e) => {
            if (!dropdownPerfil.contains(e.target) && e.target !== avatarUsuario) {
                dropdownPerfil.classList.remove('open');
            }
        });
    }

    // --- CERRAR SESIÓN: borra los datos del login y redirige ---
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('rolUsuario');
            localStorage.removeItem('nombreUsuario');
            window.location.href = 'index.html';
        });
    }

    // 2. Aquí llamaremos a la API para cargar los datos reales
    cargarDatosDashboard();
});

// 3. Función para traer datos del servidor
async function cargarDatosDashboard() {
    try {
        const respuesta = await fetch('http://127.0.0.1:5000/api/dashboard-stats');
        const data = await respuesta.json();

        // Ejemplo: Si tu API devuelve { totalAlumnos: 1400, regulares: 980, riesgo: 198, criticos: 62 }
        // Actualizamos los números en el HTML
        if (data.success) {
            document.querySelector('.numero-banner').textContent = data.totalAlumnos;
            // Podrías actualizar las tarjetas de semáforo aquí también
        }
    } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
    }
}