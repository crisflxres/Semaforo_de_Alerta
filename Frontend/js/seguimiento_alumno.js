document.addEventListener('DOMContentLoaded', () => {
    // 1. Intentamos obtener el alumno que guardamos en la memoria local
    const datosGuardados = localStorage.getItem('alumnoSeleccionado');
    
    if (!datosGuardados) {
        console.warn("No se seleccionó ningún alumno de la lista.");
        return;
    }

    // Convertimos el texto guardado de vuelta a un objeto de JavaScript
    const alumno = JSON.parse(datosGuardados);

    // 2. Mapeamos los elementos de tu diseño HTML mediante sus IDs o etiquetas
    const elNombre = document.getElementById('txt-nombre');
    const elMatricula = document.getElementById('txt-matricula');
    const elEstado = document.getElementById('txt-estado');
    
    // Elementos adicionales para que la tarjeta cambie por completo
    const elCarrera = document.querySelector('.student-details p:nth-of-type(2)');
    const elGrupoTurno = document.querySelector('.student-details p:nth-of-type(3)');
    const elBadgeReprobadas = document.querySelector('.badge-reprobadas');

    // 3. Inyectamos los datos del alumno de forma dinámica
    if (elNombre && alumno.nombre) {
        elNombre.textContent = `${alumno.nombre} ${alumno.apellidos}`.toUpperCase();
    }

    if (elMatricula && alumno.matricula) {
        elMatricula.textContent = alumno.matricula;
    }

    // Cambiar Carrera en la tarjeta
    if (elCarrera && alumno.carrera) {
        elCarrera.innerHTML = `<strong>Carrera:</strong> ${alumno.carrera}`;
    }

    // Cambiar Grupo y Turno en la tarjeta
    if (elGrupoTurno && alumno.grupo && alumno.turno) {
        elGrupoTurno.innerHTML = `<strong>Grupo:</strong> ${alumno.grupo} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Turno:</strong> ${alumno.turno}`;
    }

    // Cambiar contador de materias reprobadas
    if (elBadgeReprobadas && alumno.reprobadas) {
        elBadgeReprobadas.textContent = `Materias reprobadas: ${alumno.reprobadas}`;
    }

    // Cambiar texto y color del Estado de Alerta
    if (elEstado && alumno.estado) {
        elEstado.textContent = `Estado: ${alumno.estado}`;
        
        // Limpiamos las clases de diseño previas para pintar el color correcto
        elEstado.className = ''; 
        
        const estadoLimpio = alumno.estado.toLowerCase().trim();
        if (estadoLimpio.includes('regular')) {
            elEstado.classList.add('badge-estado-regular');
        } else if (estadoLimpio.includes('riesgo')) {
            elEstado.classList.add('badge-estado-riesgo'); // Usa la clase de color amarillo de tu CSS
        } else if (estadoLimpio.includes('crítico') || estadoLimpio.includes('critico')) {
            elEstado.classList.add('badge-estado-critico'); // Usa la clase de color rojo de tu CSS
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const btnMenu = document.querySelector(".menu-toggle");
    const overlay = document.getElementById("sidebarOverlay");
    const btnCerrar = document.getElementById("btnCerrarSidebar");

    if (btnMenu) {
        btnMenu.addEventListener("click", () => overlay.classList.add("open"));
    }

    if (btnCerrar) {
        btnCerrar.addEventListener("click", () => overlay.classList.remove("open"));
    }

    // Cierra si haces clic fuera de la tarjeta
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.remove("open");
    });
});