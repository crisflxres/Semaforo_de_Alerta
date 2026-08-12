document.addEventListener('DOMContentLoaded', () => {
    // --- 1. LOGICA DEL MENU FLOTANTE (HAMBURGUESA) ---
    const btnHamburguesa = document.getElementById('btnHamburguesa');
    const overlay = document.getElementById('sidebarOverlay');
    const btnCerrar = document.getElementById('btnCerrarSidebar');

    if (btnHamburguesa && overlay) btnHamburguesa.addEventListener('click', () => overlay.classList.add('open'));
    if (btnCerrar) btnCerrar.addEventListener('click', () => overlay.classList.remove('open'));
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

    // --- 1.1 LOGICA DEL DROPDOWN DE PERFIL ---
    const avatarUsuario = document.getElementById('avatarUsuario');
    const dropdownPerfil = document.getElementById('dropdownPerfil');
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');

    if (avatarUsuario && dropdownPerfil) {
        avatarUsuario.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownPerfil.classList.toggle('show');
        });
    }

    document.addEventListener('click', () => {
        if (dropdownPerfil) dropdownPerfil.classList.remove('show');
    });

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('rolUsuario');
            localStorage.removeItem('nombreUsuario');
            window.location.href = 'index.html';
        });
    }

    // --- 2. ESTADO DE PAGINACION Y FILTROS ---
    const API_BASE = 'http://127.0.0.1:5000';
    const POR_PAGINA = 25;

    let paginaActual = 1;
    let selectsYaPoblados = false;

    const inputBuscar = document.querySelector('.search-input');
    const btnLimpiar = document.querySelector('.btn-limpiar');
    const selectGrupo = document.getElementById('filtro-grupo');
    const selectCarrera = document.getElementById('filtro-carrera');
    const selectSemestre = document.getElementById('filtro-semestre');
    const selectTurno = document.getElementById('filtro-turno');
    const selectEstado = document.getElementById('filtro-estado');

    // Filtros leidos de sessionStorage (o de la URL) apenas arranca la pagina.
    // Se usan como "valor a aplicar" en la primera carga, en vez de leer el
    // DOM (que todavia no tiene las opciones reales de los <select>), y se
    // limpian despues de esa primera carga.
    let filtrosPendientes = obtenerFiltrosGuardados();

    function leerFiltrosActuales() {
        return {
            search: inputBuscar ? inputBuscar.value.trim() : '',
            grupo: selectGrupo ? selectGrupo.value : 'Todos',
            carrera: selectCarrera ? selectCarrera.value : 'Todos',
            semestre: selectSemestre ? selectSemestre.value : 'Todos',
            turno: selectTurno ? selectTurno.value : 'Todos',
            estado: selectEstado ? selectEstado.value : 'Todos',
            pagina: paginaActual
        };
    }

    function guardarFiltros(filtros) {
        sessionStorage.setItem('filtrosAlumnos', JSON.stringify(filtros));
    }

    // Solo lee y devuelve el objeto guardado, sin tocar el DOM (los <select>
    // todavia no tienen sus opciones reales en este punto de la ejecucion).
    function obtenerFiltrosGuardados() {
        const guardado = sessionStorage.getItem('filtrosAlumnos');
        if (!guardado) return null;
        try {
            return JSON.parse(guardado);
        } catch (e) {
            console.warn('No se pudieron leer los filtros guardados:', e);
            return null;
        }
    }

    function llenarSelect(select, valores, valorPrevio) {
        if (!select) return;
        select.innerHTML = '<option value="Todos">Todos</option>';
        valores.forEach(valor => {
            const option = document.createElement('option');
            option.value = valor;
            option.textContent = valor;
            select.appendChild(option);
        });
        if (valorPrevio && valores.includes(valorPrevio)) {
            select.value = valorPrevio;
        }
    }

    function poblarSelects(filtrosDisponibles, filtrosPrevios) {
        llenarSelect(selectGrupo, filtrosDisponibles.grupos, filtrosPrevios.grupo);
        llenarSelect(selectCarrera, filtrosDisponibles.carreras, filtrosPrevios.carrera);
        llenarSelect(selectSemestre, filtrosDisponibles.semestres, filtrosPrevios.semestre);
        llenarSelect(selectTurno, filtrosDisponibles.turnos, filtrosPrevios.turno);
        llenarSelect(selectEstado, filtrosDisponibles.estados, filtrosPrevios.estado);
    }

    // --- 3. CARGA DE DATOS DESDE BD (con paginacion y filtros aplicados en el servidor) ---
    async function cargarDatosAlumnos() {
        try {
            // Si hay filtros pendientes de restaurar (venimos de sessionStorage
            // o de un ?estado= en la URL), los usamos en vez de leer el DOM.
            let filtros;
            if (filtrosPendientes) {
                filtros = filtrosPendientes;
                if (inputBuscar) inputBuscar.value = filtros.search || '';
                if (filtros.pagina) paginaActual = filtros.pagina;
            } else {
                filtros = leerFiltrosActuales();
            }
            guardarFiltros(filtros);

            const params = new URLSearchParams({
                page: paginaActual,
                per_page: POR_PAGINA,
                search: filtros.search,
                grupo: filtros.grupo,
                carrera: filtros.carrera,
                semestre: filtros.semestre,
                turno: filtros.turno,
                estado: filtros.estado
            });

            const response = await fetch(`${API_BASE}/api/alumnos?${params.toString()}`);
            const data = await response.json();

            // Tarjetas de metricas: siempre reflejan el total global, sin importar los filtros activos
            document.getElementById('count-total').textContent = data.total;
            document.getElementById('count-regulares').textContent = data.regulares;
            document.getElementById('count-riesgo').textContent = data.riesgo;
            document.getElementById('count-criticos').textContent = data.criticos;

            const total = data.total || 1;
            document.getElementById('bar-total').style.width = "100%";
            document.getElementById('bar-regulares').style.width = ((data.regulares / total) * 100) + "%";
            document.getElementById('bar-riesgo').style.width = ((data.riesgo / total) * 100) + "%";
            document.getElementById('bar-criticos').style.width = ((data.criticos / total) * 100) + "%";

            // Tabla: solo la pagina actual, no los 1000+ de golpe
            const tbody = document.getElementById('tabla-alumnos-body');
            tbody.innerHTML = '';
            data.lista.forEach(alumno => {
                const tr = document.createElement('tr');
                const estadoClase = alumno.estado_alerta.toLowerCase().replace(' ', '-');
                tr.innerHTML = `
                    <td class="avatar-cell">
                        <img src="${API_BASE}/fotos/${alumno.matricula}"
                            style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
                            onerror="this.outerHTML = '<i class=\\'fa-solid fa-circle-user\\' style=\\'font-size: 24px; color: #6c757d;\\'></i>'">
                    </td>
                    <td>${alumno.matricula}</td><td>${alumno.nombre}</td><td>${alumno.apellidos}</td>
                    <td>${alumno.grupo}</td><td>${alumno.turno}</td><td>${alumno.semestre}</td>
                    <td title="${alumno.carrera}">${alumno.carrera}</td><td>${alumno.pac}</td>
                    <td><span class="status-badge ${estadoClase}">${alumno.estado_alerta}</span></td>
                    <td class="numeric-cell">${alumno.materias_reprobadas}</td>
                    <td><button class="btn-action" data-matricula="${alumno.matricula}"><i class="fa-solid fa-chevron-right"></i></button></td>
                `;
                tbody.appendChild(tr);
            });

            configurarClicsSeguimiento();

            // Los selects de filtro solo se llenan UNA vez (sus opciones no cambian entre paginas)
            if (!selectsYaPoblados && data.filtros_disponibles) {
                poblarSelects(data.filtros_disponibles, filtros);
                selectsYaPoblados = true;
            }

            // Ya se aplicaron (o se intento aplicar) los filtros pendientes;
            // de aqui en adelante se lee siempre del DOM en cada peticion.
            filtrosPendientes = null;

            actualizarControlesPaginacion(data.pagina_actual, data.total_paginas, data.total_filtrado);

        } catch (error) {
            console.error("Error al cargar alumnos:", error);
        }
    }

    // --- 4. CONTROLES DE PAGINACION ---
    const btnPagAnterior = document.getElementById('btn-pagina-anterior');
    const btnPagSiguiente = document.getElementById('btn-pagina-siguiente');
    const txtPaginaInfo = document.getElementById('txt-pagina-info');

    function actualizarControlesPaginacion(pagina, totalPaginas, totalFiltrado) {
        if (txtPaginaInfo) {
            txtPaginaInfo.textContent = `Página ${pagina} de ${totalPaginas} (${totalFiltrado} alumnos)`;
        }
        if (btnPagAnterior) btnPagAnterior.disabled = pagina <= 1;
        if (btnPagSiguiente) btnPagSiguiente.disabled = pagina >= totalPaginas;
    }

    if (btnPagAnterior) {
        btnPagAnterior.addEventListener('click', () => {
            if (paginaActual > 1) {
                paginaActual--;
                cargarDatosAlumnos();
            }
        });
    }

    if (btnPagSiguiente) {
        btnPagSiguiente.addEventListener('click', () => {
            paginaActual++;
            cargarDatosAlumnos();
        });
    }

    // --- 5. NAVEGACION ---
    function configurarClicsSeguimiento() {
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matricula = e.target.closest('button').dataset.matricula;
                localStorage.setItem('matriculaSeleccionada', matricula);
                window.location.href = "seguimiento_alumno.html";
            });
        });
    }

    // --- 6. EVENTOS DE FILTROS (cualquier cambio reinicia a la pagina 1) ---
    let temporizadorBusqueda = null;

    function onFiltroCambiado() {
        paginaActual = 1;
        cargarDatosAlumnos();
    }

    if (inputBuscar) {
        inputBuscar.addEventListener('input', () => {
            clearTimeout(temporizadorBusqueda);
            temporizadorBusqueda = setTimeout(onFiltroCambiado, 350);
        });
    }

    [selectGrupo, selectCarrera, selectSemestre, selectTurno, selectEstado].forEach(select => {
        if (select) select.addEventListener('change', onFiltroCambiado);
    });

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            if (inputBuscar) inputBuscar.value = '';
            [selectGrupo, selectCarrera, selectSemestre, selectTurno, selectEstado].forEach(select => {
                if (select) select.value = 'Todos';
            });
            // Al limpiar manualmente, tambien se descarta cualquier filtro
            // pendiente que aun no se hubiera aplicado.
            filtrosPendientes = null;
            sessionStorage.removeItem('filtrosAlumnos');
            onFiltroCambiado();
        });
    }

    // --- 7. ELIMINAR ALUMNOS DE 6TO SEMESTRE ---
    function eliminarAlumnos6toSemestre() {
        if (!confirm("¿Estás seguro de eliminar a todos los alumnos de 6to Semestre permanentemente? Esta acción no se puede deshacer.")) return;
        fetch(`${API_BASE}/api/eliminar-alumnos-6to-semestre`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                alert(data.message || "Alumnos de 6to Semestre eliminados correctamente");
                paginaActual = 1;
                cargarDatosAlumnos();
            })
            .catch(err => {
                console.error("Error al eliminar alumnos:", err);
                alert("Ocurrió un error al eliminar los alumnos.");
            });
    }

    const btnEliminar = document.getElementById('btn-eliminar-alumnos-6to.Semestre');
    if (btnEliminar) btnEliminar.addEventListener('click', eliminarAlumnos6toSemestre);

    // --- 8. INICIALIZAR ---
    // Si viene un filtro de estado desde la URL (por ejemplo desde inicio.html),
    // se combina con lo que ya hubiera en sessionStorage, o se crea un objeto
    // de filtros "en blanco" con ese estado si no habia nada guardado.
    const paramsUrl = new URLSearchParams(window.location.search);
    const estadoFiltro = paramsUrl.get('estado');
    if (estadoFiltro) {
        if (!filtrosPendientes) {
            filtrosPendientes = { search: '', grupo: 'Todos', carrera: 'Todos', semestre: 'Todos', turno: 'Todos', estado: estadoFiltro };
        } else {
            filtrosPendientes.estado = estadoFiltro;
        }
    }

    cargarDatosAlumnos();
});