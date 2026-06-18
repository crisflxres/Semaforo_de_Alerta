// 1. Lógica del Menú Lateral (Sidebar)
document.addEventListener('DOMContentLoaded', () => {
    const btnHamburguesa = document.getElementById("btnHamburguesa");
    const btnCerrar = document.getElementById("btnCerrarSidebar");
    const overlay = document.getElementById("sidebarOverlay");

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