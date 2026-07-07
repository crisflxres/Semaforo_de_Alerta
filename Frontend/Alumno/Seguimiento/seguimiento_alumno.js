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
        fetch(`http://127.0.0.1:5000/calificaciones/${matricula}`)
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
});