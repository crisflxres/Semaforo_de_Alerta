document.addEventListener('DOMContentLoaded', () => {

    // --- 1. MENÚ LATERAL (igual que Aulas) ---
    const overlay   = document.getElementById("sidebarOverlay");
    const btnAbrir  = document.getElementById("btnHamburguesa");
    const btnCerrar = document.getElementById("btnCerrarSidebar");

    if (btnAbrir && overlay && btnCerrar) {
        btnAbrir.addEventListener("click",  () => overlay.classList.add("open"));
        btnCerrar.addEventListener("click", () => overlay.classList.remove("open"));
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.classList.remove("open");
        });
    }

    // --- 2. DATOS DEL ALUMNO (sin cambios) ---
    const datosGuardados = localStorage.getItem('alumnoSeleccionado');
    if (!datosGuardados) { console.warn("No se seleccionó ningún alumno."); return; }

    const alumno = JSON.parse(datosGuardados);

    const elNombre          = document.getElementById('txt-nombre');
    const elMatricula       = document.getElementById('txt-matricula');
    const elEstado          = document.getElementById('txt-estado');
    const elCarrera         = document.querySelector('.student-details p:nth-of-type(2)');
    const elGrupoTurno      = document.querySelector('.student-details p:nth-of-type(3)');
    const elBadgeReprobadas = document.querySelector('.badge-reprobadas');

    if (elNombre    && alumno.nombre)    elNombre.textContent = `${alumno.nombre} ${alumno.apellidos}`.toUpperCase();
    if (elMatricula && alumno.matricula) elMatricula.textContent = alumno.matricula;
    if (elCarrera   && alumno.carrera)   elCarrera.innerHTML = `<strong>Carrera:</strong> ${alumno.carrera}`;

    if (elGrupoTurno && alumno.grupo && alumno.turno)
        elGrupoTurno.innerHTML = `<strong>Grupo:</strong> ${alumno.grupo} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Turno:</strong> ${alumno.turno}`;

    if (elBadgeReprobadas && alumno.reprobadas)
        elBadgeReprobadas.textContent = `Materias reprobadas: ${alumno.reprobadas}`;

    if (elEstado && alumno.estado) {
        elEstado.textContent = `Estado: ${alumno.estado}`;
        elEstado.className = '';
        const estadoLimpio = alumno.estado.toLowerCase().trim();
        if      (estadoLimpio.includes('regular'))                              elEstado.classList.add('badge-estado-regular');
        else if (estadoLimpio.includes('riesgo'))                               elEstado.classList.add('badge-estado-riesgo');
        else if (estadoLimpio.includes('crítico') || estadoLimpio.includes('critico')) elEstado.classList.add('badge-estado-critico');
    }
});