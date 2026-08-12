 // Cambia esto si tu Flask corre en otra URL/puerto (misma variable que en los demas archivos)
const API_BASE = 'https://semaforo-de-alerta.onrender.com';

document.addEventListener('DOMContentLoaded', () => {

    // 1. Control del Menú Lateral
    const sidebar = document.getElementById('sidebarMenu');
    const btnAbrir = document.getElementById('btnAbrirMenu');
    const btnCerrar = document.getElementById('btnCerrar');

    if (btnAbrir && sidebar && btnCerrar) {
        btnAbrir.addEventListener('click', () => sidebar.classList.add('open'));
        btnCerrar.addEventListener('click', () => sidebar.classList.remove('open'));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') sidebar.classList.remove('open');
        });
    }

    // 2. Control del Menú de Avatar
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

    // 2.5. Mostrar inicial del usuario en el avatar
    const avatarLetra = document.getElementById('avatarUsuario');
    const nombreUsuario = localStorage.getItem('nombreUsuario');
    if (avatarLetra && nombreUsuario) {
        avatarLetra.textContent = nombreUsuario.trim().charAt(0).toUpperCase();
    }

    // 3. Motor de Renderizado
    const cuerpoTabla = document.getElementById('cuerpo-tabla-seguimiento');

    // Determina en qué parcial va el semestre (1, 2 o 3) revisando
    // si P1, P2 y/o P3 ya tienen datos reales cargados (no "-").
    function tieneDatos(valor) {
        return valor !== '-' && valor !== null && valor !== undefined && valor !== '';
    }

    function determinarParcialActual(materias) {
        const p1Lleno = materias.some(m => tieneDatos(m.p1));
        const p2Lleno = materias.some(m => tieneDatos(m.p2));
        const p3Lleno = materias.some(m => tieneDatos(m.p3));

        if (p3Lleno) return 3;
        if (p2Lleno) return 2;
        if (p1Lleno) return 1;
        return 0; // Ningún parcial tiene datos todavía
    }

    // Coloca el valor del PAC en la celda rosada que corresponde
    // al parcial actual (1ª, 2ª o 3ª columna).
    function renderizarPAC(pac, parcialActual) {
        const celdasRosadas = document.querySelectorAll('.pie-tabla-calificaciones .celda-rosada');

        // Limpia las celdas antes de volver a pintar
        celdasRosadas.forEach(celda => {
            celda.textContent = '';
            celda.classList.remove('celda-pac-activa');
        });

        if (parcialActual > 0 && celdasRosadas[parcialActual - 1]) {
            const celdaActiva = celdasRosadas[parcialActual - 1];
            celdaActiva.textContent = pac ?? '-';
            celdaActiva.classList.add('celda-pac-activa');
        }
    }

    window.renderizarSeguimiento = function(datos) {
        document.getElementById('total-materias').textContent = `Total de materias: ${datos.total}`;
        document.getElementById('materias-reprobadas').textContent = `Materias reprobadas: ${datos.reprobadas}`;
        document.getElementById('estado-desempeño').textContent = `Estado: ${datos.estado}`;

        cuerpoTabla.innerHTML = '';
        datos.materias.forEach(materia => {
            const fila = document.createElement('div');
            fila.className = 'fila-materia-renglon';
            fila.innerHTML = `
                <div class="txt-materia">${materia.nombre}</div>
                <div class="txt-nota">${materia.p1}</div>
                <div class="txt-nota">${materia.p2}</div>
                <div class="txt-nota">${materia.p3}</div>
                <div class="txt-nota">${materia.pr}</div>
            `;
            cuerpoTabla.appendChild(fila);
        });

        const parcialActual = determinarParcialActual(datos.materias);
        renderizarPAC(datos.pac, parcialActual);
    };

    // 4. Cargar calificaciones del alumno logueado
    const matricula = localStorage.getItem('matriculaSeleccionada');

    if (matricula) {
        fetch(`${API_BASE}/calificaciones/${matricula}`)
            .then(res => res.json())
            .then(respuesta => {
                if (!respuesta.success) return;

                window.renderizarSeguimiento({
                    total: respuesta.calificaciones.length,
                    reprobadas: respuesta.reprobadas,
                    estado: respuesta.estado || '--',
                    pac: respuesta.pac ?? respuesta.PAC ?? null,
                    materias: respuesta.calificaciones.map(c => ({
                        nombre: c.Materia,
                        p1: c.P1 ?? '-',
                        p2: c.P2 ?? '-',
                        p3: c.P3 ?? '-',
                        pr: c.PR ?? '-'
                    }))
                });
            })
            .catch(err => console.error("Error al cargar calificaciones:", err));
    } else {
        console.warn("No hay matrícula en localStorage.");
    }

    // 5. Historial de observaciones (solo lectura para el alumno)
    const btnObservaciones = document.getElementById('btn-observaciones');
    const modalObs = document.getElementById('modalObservaciones');
    const listaObsAlumno = document.getElementById('listaObservacionesAlumno');
    const btnCerrarModalObs = document.getElementById('btnCerrarModalObs');

    if (btnCerrarModalObs && modalObs) {
        btnCerrarModalObs.addEventListener('click', () => {
            modalObs.style.display = 'none';
        });
    }

    if (btnObservaciones && modalObs && listaObsAlumno) {
        btnObservaciones.addEventListener('click', () => {
            const matriculaObs = localStorage.getItem('matriculaSeleccionada');
            if (!matriculaObs) return;

            listaObsAlumno.innerHTML = '<p style="color:#888;">Cargando...</p>';
            modalObs.style.display = 'flex';

            fetch(`${API_BASE}/observaciones/${matricula}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.success || data.observaciones.length === 0) {
                        listaObsAlumno.innerHTML = '<p style="color:#888;">No hay observaciones registradas todavía.</p>';
                        return;
                    }
                    listaObsAlumno.innerHTML = data.observaciones.map(obs => `
                        <div style="border-bottom:1px solid #eee; padding:10px 0;">
                            <div style="font-size:11px; color:#999;">${obs.fecha}</div>
                            <div style="font-weight:700; color:#6A1B29; font-size:13px;">${obs.autor}</div>
                            <p style="font-size:13px; margin-top:4px;">${obs.comentario}</p>
                        </div>
                    `).join('');
                })
                .catch(err => {
                    listaObsAlumno.innerHTML = '<p style="color:#dc3545;">Error al cargar el historial.</p>';
                    console.error("Error al cargar observaciones:", err);
                });
        });
    }
});