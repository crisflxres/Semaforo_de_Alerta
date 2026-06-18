document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Lógica del Menú Lateral ---
    const sidebar = document.getElementById("sidebarOverlay");
    const btnAbrir = document.getElementById("btnHamburguesa");
    const btnCerrar = document.getElementById("btnCerrarSidebar");

    if (btnAbrir && sidebar && btnCerrar) {
        btnAbrir.addEventListener("click", () => sidebar.classList.add("open"));
        btnCerrar.addEventListener("click", () => sidebar.classList.remove("open"));
        sidebar.addEventListener("click", (e) => {
            if (e.target === sidebar) sidebar.classList.remove("open");
        });
    }

    // --- 2. Lógica de las Tarjetas (Selección) ---
    const tarjetas = document.querySelectorAll('.tarjeta-grupo');
    
    tarjetas.forEach(tarjeta => {
        tarjeta.addEventListener('click', () => {
            // Quitar la clase 'seleccionado' a todas las demás
            tarjetas.forEach(t => t.classList.remove('seleccionado'));
            // Agregarla solo a la que tocaste
            tarjeta.classList.add('seleccionado');
        });
    });

    // --- 3. Botones de opciones (si los añades después) ---
    const botonesOpciones = document.querySelectorAll('.btn-opciones');
    botonesOpciones.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que se dispare el clic de selección de la tarjeta
            alert("Aquí abrirás las opciones de editar o eliminar el grupo");
        });
    });
});