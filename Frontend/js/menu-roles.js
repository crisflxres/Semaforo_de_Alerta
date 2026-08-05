document.addEventListener('DOMContentLoaded', () => {
    const rol = parseInt(localStorage.getItem('rolUsuario'));

    if (rol === 2) { // docente
        document.body.classList.add('rol-docente');
        const paginasOcultas = ['alertas', 'configuracion'];

        paginasOcultas.forEach(pagina => {
            // El selector con href$ busca que el enlace termine exactamente con el nombre del archivo
            const links = document.querySelectorAll(`a[href*="${pagina}"]`);
            links.forEach(link => {
                const contenedor = link.closest('li') || link.closest('.menu-item') || link.closest('div') || link;
                contenedor.style.display = 'none'; // Ocultamos el contenedor de forma segura
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