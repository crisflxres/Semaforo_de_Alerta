document.addEventListener('DOMContentLoaded', () => {
    const rol = parseInt(localStorage.getItem('rolUsuario'));
    const paginasOcultas = ['alertas', 'configuracion'];

    if (rol === 2 || rol === 5) { // docente y rol 5 comparten restricciones
        document.body.classList.add(`rol-${rol}`);

        paginasOcultas.forEach(pagina => {
            const links = document.querySelectorAll(`a[href*="${pagina}"]`);
            links.forEach(link => {
                const contenedor = link.closest('li') || link.closest('.menu-item') || link.closest('div') || link;
                contenedor.style.display = 'none';
            });
        });
    }

    // Mostrar la inicial del usuario en el avatar
    const nombreUsuario = localStorage.getItem('nombreUsuario');
    const avatar = document.getElementById('avatarUsuario');

    if (nombreUsuario && avatar) {
        avatar.textContent = nombreUsuario.trim().charAt(0).toUpperCase();
    }
});