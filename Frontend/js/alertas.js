// Lógica de configuracion.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Configuración cargada correctamente");

    // Vincula aquí toda la funcionalidad de los botones, menús, etc.
    const btnHamburguesa = document.getElementById('btnHamburguesa');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (btnHamburguesa) {
        btnHamburguesa.addEventListener('click', () => {
            sidebarOverlay.classList.add('open');
        });
    }

    // Y así sucesivamente con el resto de tu JS...
});