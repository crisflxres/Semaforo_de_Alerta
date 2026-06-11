document.addEventListener('DOMContentLoaded', () => {
    const btnMenu = document.getElementById('btnMenu');
    const sidebar = document.getElementById('sidebar');
    const contenido = document.querySelector('.contenido-panel');
    const avatarBtn = document.getElementById('avatarBtn');
    const menuPerfil = document.getElementById('menuPerfil');

    // Control del colapso completo del menú izquierdo
    if (btnMenu && sidebar && contenido) {
        btnMenu.onclick = () => {
            sidebar.classList.toggle('oculto');
            contenido.classList.toggle('expandido');
        };
    }
    // Control del menú desplegable del perfil de usuario
    if (avatarBtn && menuPerfil) {
        avatarBtn.onclick = (e) => {
            e.stopPropagation();
            menuPerfil.classList.toggle('activo');
        };
        document.onclick = () => menuPerfil.classList.remove('activo');
    }
});