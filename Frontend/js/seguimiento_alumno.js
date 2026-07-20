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

  // --- 2. DATOS DEL ALUMNO ---
    const matricula = localStorage.getItem('matriculaSeleccionada');
    if (!matricula) { console.warn("No se seleccionó ningún alumno."); return; }

    const elNombre          = document.getElementById('txt-nombre');
    const elMatricula       = document.getElementById('txt-matricula');
    const elEstado          = document.getElementById('txt-estado');
    const foto              = document.getElementById('foto-alumno');
    const elCarrera         = document.querySelector('.student-details p:nth-of-type(2)');
    const elGrupoTurno      = document.querySelector('.student-details p:nth-of-type(3)');
    const elBadgeReprobadas = document.querySelector('.badge-reprobadas');

    fetch('https://semaforo-de-alerta.onrender.com/api/alumnos')
        .then(res => res.json())
        .then(data => {
            const alumno = data.lista.find(a => a.matricula === matricula);
            if (!alumno) return;

            // Foto: ahora sí existe alumno
            if (foto) {
                foto.src = `https://semaforo-de-alerta.onrender.com/fotos/${alumno.matricula}`;
                foto.onerror = function() {
                    foto.style.display = 'none';
                };
            }

            if (elNombre)    elNombre.textContent = `${alumno.nombre} ${alumno.apellidos}`.toUpperCase();
            if (elMatricula) elMatricula.textContent = alumno.matricula;
            if (elCarrera)   elCarrera.innerHTML = `<strong>Carrera:</strong> ${alumno.carrera}`;
            if (elGrupoTurno) elGrupoTurno.innerHTML = `<strong>Grupo:</strong> ${alumno.grupo} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Turno:</strong> ${alumno.turno}`;
            if (elBadgeReprobadas) elBadgeReprobadas.textContent = `Materias reprobadas: ${alumno.materias_reprobadas}`;

            if (elEstado) {
                elEstado.textContent = `Estado: ${alumno.estado_alerta}`;
                elEstado.className = '';
                const estadoLimpio = alumno.estado_alerta.toLowerCase().trim();
                if      (estadoLimpio.includes('regular'))  elEstado.classList.add('badge-estado-regular');
                else if (estadoLimpio.includes('riesgo'))   elEstado.classList.add('badge-estado-riesgo');
                else if (estadoLimpio.includes('critico'))  elEstado.classList.add('badge-estado-critico');
            }
        });

    // --- 3. CALIFICACIONES DESDE FLASK ---
    const tbody = document.querySelector('.data-table tbody');

    fetch(`https://semaforo-de-alerta.onrender.com/calificaciones/${matricula}`)
        .then(res => res.json())
        .then(respuesta => {
            if (!respuesta.success) return;

            const califs = respuesta.calificaciones;
            tbody.innerHTML = "";
            califs.forEach((c, i) => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${c.Materia}</td>
                    <td>${c.P1 ?? '-'}</td>
                    <td>${c.P2 ?? '-'}</td>
                    <td>${c.P3 ?? '-'}</td>
                    <td>${c.PR ?? '-'}</td>
                    ${i === 0 ? `<td class="sidebar-cell" rowspan="${califs.length}">${respuesta.pac}</td>` : ''}
                `;
                tbody.appendChild(fila);
            });

            if (elBadgeReprobadas)
                elBadgeReprobadas.textContent = `Materias reprobadas: ${respuesta.reprobadas}`;
        })
        .catch(err => console.error("Error al cargar calificaciones:", err));
});