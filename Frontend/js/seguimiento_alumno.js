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
    const elCorreo          = document.getElementById('txt-correo');
    const elCarrera         = document.getElementById('txt-carrera');
    const elGrupo           = document.getElementById('txt-grupo');
    const elTurno           = document.getElementById('txt-turno');
    const elEstado          = document.getElementById('txt-estado');
    const elBadgeReprobadas  = document.getElementById('txt-reprobadas');
    const foto              = document.getElementById('foto-alumno');

    fetch('https://semaforo-de-alerta.onrender.com/api/alumnos')
        .then(res => res.json())
        .then(data => {
            const alumno = data.lista.find(a => a.matricula === matricula);
            if (!alumno) return;

            // Foto: ahora sí existe alumno
            if (foto) {
                foto.src =`https://semaforo-de-alerta.onrender.com/fotos/${alumno.matricula}`;
                foto.onerror = function() {
                    foto.style.display = 'none';
                };
            }

            if (elNombre)    elNombre.textContent = `${alumno.nombre} ${alumno.apellidos}`.toUpperCase();
            if (elMatricula) elMatricula.textContent = alumno.matricula;
            if (elCorreo)    elCorreo.textContent = alumno.email;
            if (elCarrera)   elCarrera.textContent = alumno.carrera;
            if (elGrupo)     elGrupo.textContent = alumno.grupo;
            if (elTurno)     elTurno.textContent = alumno.turno;
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
        
        // --- 4. DATOS DEL TUTOR ---
    const elNombreTutor   = document.getElementById('txt-nombre-tutor');
    const elTelefonoTutor = document.getElementById('txt-telefono-tutor');
    const elCorreoTutor   = document.getElementById('txt-correo-tutor');

    const inputNombreTutor   = document.getElementById('input-nombre-tutor');
    const inputTelefonoTutor = document.getElementById('input-telefono-tutor');
    const inputCorreoTutor   = document.getElementById('input-correo-tutor');

    const btnEditarTutor  = document.getElementById('btn-editar-tutor');
    const btnGuardarTutor = document.getElementById('btn-guardar-tutor');

    function cargarTutor() {
        fetch(`https://semaforo-de-alerta.onrender.com/api/tutor/${matricula}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.existe) {
                    elNombreTutor.textContent = data.tutor.Nombre;
                    elTelefonoTutor.textContent = data.tutor.Telefono;
                    elCorreoTutor.textContent = data.tutor.Email;

                    inputNombreTutor.value = data.tutor.Nombre;
                    inputTelefonoTutor.value = data.tutor.Telefono;
                    inputCorreoTutor.value = data.tutor.Email;
                } else {
                    elNombreTutor.textContent = 'Sin registrar';
                    elTelefonoTutor.textContent = 'Sin registrar';
                    elCorreoTutor.textContent = 'Sin registrar';
                }
            })
            .catch(err => console.error('Error al cargar tutor:', err));
    }

    cargarTutor();

    btnEditarTutor?.addEventListener('click', () => {
        document.querySelectorAll('.dato-tutor').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.input-tutor').forEach(el => el.style.display = 'inline-block');
        btnEditarTutor.style.display = 'none';
        btnGuardarTutor.style.display = 'inline-block';
    });

    btnGuardarTutor?.addEventListener('click', () => {
        const nombre = inputNombreTutor.value.trim();
        const telefono = inputTelefonoTutor.value.trim();
        const email = inputCorreoTutor.value.trim();

        if (!nombre || !telefono || !email) {
            alert('Todos los campos del tutor son obligatorios.');
            return;
        }

        fetch(`https://semaforo-de-alerta.onrender.com/api/tutor/${matricula}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono, email })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                cargarTutor();
                document.querySelectorAll('.dato-tutor').forEach(el => el.style.display = 'inline');
                document.querySelectorAll('.input-tutor').forEach(el => el.style.display = 'none');
                btnGuardarTutor.style.display = 'none';
                btnEditarTutor.style.display = 'inline-block';
            } else {
                alert('Error al guardar: ' + data.message);
            }
        })
        .catch(err => console.error('Error al guardar tutor:', err));
    });
});