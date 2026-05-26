document.addEventListener('DOMContentLoaded', () => {
    // 1. RECUPERAR DATOS DEL USUARIO LOGUEADO
    const nombreUsuario = localStorage.getItem('nombreUsuario');
    const rolUsuario = localStorage.getItem('rolUsuario');

    if (!nombreUsuario) {
        window.location.href = 'index.html';
        return;
    }

    const inicialPerfil = document.querySelector('.usuario-perfil span');
    if (inicialPerfil && nombreUsuario) {
        inicialPerfil.textContent = nombreUsuario.charAt(0).toUpperCase();
        document.querySelector('.usuario-perfil').title = nombreUsuario;
    }

    // 2. HACER FUNCIONAR EL BOTÓN DEL MENÚ (SIDEBAR TOGGLE)
    const btnMenu = document.getElementById('btnMenu');
    const sidebar = document.getElementById('sidebar');

    if (btnMenu && sidebar) {
        btnMenu.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-abierto');
        });
    }
});