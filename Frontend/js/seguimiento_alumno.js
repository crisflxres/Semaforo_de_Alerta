// Cambia esto si tu Flask corre en otra URL/puerto (misma variable que en alumnos.js e inicio.js)
const API_BASE = 'https://semaforo-de-alerta.onrender.com';

async function abrirModalHistorialObsvervaciones() {
    const modal = document.getElementById('modalHistorialObservaciones');
    const lista = document.getElementById('listaHistorialCompletoObservaciones');
    if (!modal || !lista) return;

    const matricula = localStorage.getItem('matriculaSeleccionada');
    if (!matricula) return;

    lista.innerHTML = '<p style="color:#888;">Cargando...</p>';
    modal.style.display = 'flex';

    try {
        const res = await fetch(`${API_BASE}/observaciones/${matricula}`);
        const data = await res.json();

        if (!data.success || data.observaciones.length === 0) {
            lista.innerHTML = '<p style="color:#888;">No hay observaciones registradas todavía.</p>';
            return;
        }

        lista.innerHTML = data.observaciones.map(obs => `
            <div style="border-bottom:1px solid #eee; padding:10px 0;">
                <div style="font-size:11px; color:#999;">${obs.fecha}</div>
                <div style="font-weight:700; color:#4a1222; font-size:13px;">${obs.autor}</div>
                <p style="font-size:13px; margin-top:4px;">${obs.comentario}</p>
            </div>
        `).join('');
    } catch (e) {
        lista.innerHTML = '<p style="color:#dc3545;">Error al cargar el historial.</p>';
        console.error(e);
    }
}

function cerrarModalHistorialObservaciones() {
    document.getElementById('modalHistorialObservaciones').style.display = 'none';
}

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

    fetch(`${API_BASE}/api/alumno_por_matricula/${matricula}`)
    .then(res => res.json())
    .then(data => {
        if (!data.success || !data.alumno) return;
        const alumno = data.alumno;

        if (foto) {
            foto.src = `${API_BASE}/fotos/${alumno.Matricula}`;
            foto.onerror = function() {
                foto.style.display = 'none';
            };
        }

        if (elNombre)    elNombre.textContent = `${alumno.Nombre} ${alumno.Apellidos}`.toUpperCase();
        if (elMatricula) elMatricula.textContent = alumno.Matricula;
        if (elCorreo)    elCorreo.textContent = alumno.Email;
        if (elCarrera)   elCarrera.textContent = alumno.Carrera;
        if (elGrupo)     elGrupo.textContent = alumno.Grupo;
        if (elTurno)     elTurno.textContent = alumno.Turno;
    })
    .catch(err => console.error("Error al cargar datos del alumno:", err));


    // --- 3. DROPDOWN DE PERFIL ---
        const avatar = document.getElementById('avatarUsuario');
        const dropdown = document.getElementById('dropdownPerfil');

        avatar?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown?.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            dropdown?.classList.remove('show');
        });

    // --- 4. CERRAR SESIÓN ---
        document.getElementById('btnCerrarSesion')?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('rolUsuario');
            localStorage.removeItem('nombreUsuario');
            window.location.href = 'index.html';
        });

    // --- 5. CALIFICACIONES DESDE FLASK ---
    const tbody = document.querySelector('.data-table tbody');

    fetch(`${API_BASE}/calificaciones/${matricula}`)
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

        // --- 4. OBSERVACIONES ---
    const idUsuario = localStorage.getItem('idUsuario');
    const panelObs = document.getElementById('panel-observaciones');
    const btnObs = document.getElementById('btn-observaciones');
    const btnGuardarObs = document.getElementById('btn-guardar-observacion');
    const txtNuevaObs = document.getElementById('txt-nueva-observacion');

    if (btnObs && panelObs) {
        btnObs.addEventListener('click', () => {
            panelObs.classList.toggle('abierto');
        });
    }

    if (btnGuardarObs) {
        btnGuardarObs.addEventListener('click', () => {
            const comentario = txtNuevaObs.value.trim();
            if (!comentario) {
                alert('Escribe una observación antes de guardar.');
                return;
            }
            if (!idUsuario) {
                alert('No se pudo identificar el usuario. Vuelve a iniciar sesión.');
                return;
            }

            fetch(`${API_BASE}/observaciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matricula: matricula,
                    id_usuario: idUsuario,
                    comentario: comentario
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        txtNuevaObs.value = '';
                    } else {
                        alert('Error al guardar: ' + data.message);
                    }
                })
                .catch(err => console.error("Error al guardar observación:", err));
        });
    }
});