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
        if (datos.email !== undefined) document.getElementById('email-alumno').textContent = datos.email;
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

// 4. Cargar datos del alumno desde Flask
const matricula = localStorage.getItem('matriculaSeleccionada');

if (matricula) {
    // Datos del alumno
    fetch('http://127.0.0.1:5000/api/alumnos')
        .then(res => res.json())
        .then(data => {
            const alumno = data.lista.find(a => a.matricula === matricula);
            if (!alumno) return;

            window.cargarDatosAlumno({
                nombre: `${alumno.nombre} ${alumno.apellidos}`,
                matricula: alumno.matricula,
                email: alumno.email || 'Sin correo registrado',
                carrera: alumno.carrera,
                grupo: alumno.grupo,
                turno: alumno.turno,
                fotoUrl: `http://127.0.0.1:5000/fotos/${alumno.matricula}`
            });
        });

    // Calificaciones para el resumen
    fetch(`http://127.0.0.1:5000/calificaciones/${matricula}`)
        .then(res => res.json())
        .then(respuesta => {
            if (!respuesta.success) return;

            window.cargarDatosAlumno({
                promedio: respuesta.pac,
                reprobadas: respuesta.reprobadas
            });

            // Estado visual
            const estado = document.getElementById('estado-academico');
            if (estado) {
                const reprobadas = respuesta.reprobadas;
                if (reprobadas === 0) {
                    estado.style.backgroundColor = '#3ab54a';
                } else if (reprobadas <= 2) {
                    estado.style.backgroundColor = '#f1c40f';
                } else {
                    estado.style.backgroundColor = '#e74c3c';
                }
            }
        });
} else {
    console.warn("No hay matrícula en localStorage.");
}