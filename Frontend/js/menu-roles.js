document.addEventListener('DOMContentLoaded', () => {
    const rol = parseInt(localStorage.getItem('rolUsuario'));

    if (rol === 2) { // docente
        document.body.classList.add('rol-docente');
        const paginasOcultas = ['alertas.html', 'configuracion.html'];

        paginasOcultas.forEach(pagina => {
            const link = document.querySelector(`a[href="${pagina}"]`);
            const li = link?.closest('li');
            li?.remove();
        });
    }

    // Mostrar la inicial del usuario en el avatar
    const nombreUsuario = localStorage.getItem('nombreUsuario');
    const avatar = document.getElementById('avatarUsuario');

    if (nombreUsuario && avatar) {
        avatar.textContent = nombreUsuario.trim().charAt(0).toUpperCase();
    }
});