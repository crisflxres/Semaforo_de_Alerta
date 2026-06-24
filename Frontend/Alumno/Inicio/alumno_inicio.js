document.addEventListener('DOMContentLoaded', () => {
    // 1. Control del Menú Lateral
    const sidebar = document.getElementById('sidebarMenu');
    const btnAbrir = document.querySelector('.menu-btn-global');
    const btnCerrar = document.getElementById('btnCerrar');

    if (btnAbrir && sidebar && btnCerrar) {
        btnAbrir.addEventListener('click', () => {
            sidebar.classList.add('open');
        });

        btnCerrar.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                sidebar.classList.remove('open');
            }
        });
    }

    // 2. Control del Menú (Cerrar Sesión) 
    const btnAvatar = document.querySelector('.contenedor-avatar');
    const menuPerfil = document.querySelector('.menu-perfil-desplegable');

    if (btnAvatar && menuPerfil) {
        btnAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menuPerfil.style.display === 'block';
            menuPerfil.style.display = isVisible ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            menuPerfil.style.display = 'none';
        });
    }

    // 3. Función para llenar datos dinámicamente 
    window.cargarDatosAlumno = function(datos) {
        // Información personal
        if (datos.nombre) document.getElementById('nombre-alumno').textContent = datos.nombre;
        if (datos.matricula) document.getElementById('matricula-alumno').textContent = datos.matricula;
        if (datos.email) document.getElementById('email-alumno').textContent = datos.email;
        if (datos.carrera) document.getElementById('carrera-alumno').textContent = datos.carrera;
        if (datos.grupo) document.getElementById('grupo-alumno').textContent = datos.grupo;
        if (datos.turno) document.getElementById('turno-alumno').textContent = datos.turno;

        // Resumen académico
        if (datos.promedio) document.getElementById('promedio-academico').textContent = datos.promedio;
        if (datos.reprobadas !== undefined) document.getElementById('materias-reprobadas').textContent = datos.reprobadas;
        
        // Tutor
        if (datos.tutorNombre) document.getElementById('nombre-tutor').textContent = datos.tutorNombre;
        if (datos.tutorEmail) document.getElementById('email-tutor').textContent = datos.tutorEmail;

        // Imagen
        if (datos.fotoUrl) {
            document.getElementById('img-alumno').src = datos.fotoUrl;
        }
    };
});