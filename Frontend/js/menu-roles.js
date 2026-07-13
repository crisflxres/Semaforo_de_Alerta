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
});