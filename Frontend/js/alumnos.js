document.addEventListener('DOMContentLoaded', () => {
    // --- 1. LÓGICA DEL MENÚ FLOTANTE (HAMBURGUESA) ---
    const btnHamburguesa = document.getElementById('btnHamburguesa');
    const overlay = document.getElementById('sidebarOverlay');
    const btnCerrar = document.getElementById('btnCerrarSidebar');

    if (btnHamburguesa && overlay) btnHamburguesa.addEventListener('click', () => overlay.classList.add('open'));
    if (btnCerrar) btnCerrar.addEventListener('click', () => overlay.classList.remove('open'));
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

    // --- 1.1 LÓGICA DEL DROPDOWN DE PERFIL ---
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

    // --- 2. CARGA DE DATOS DESDE BD ---
    async function cargarDatosAlumnos() {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/alumnos');
            const data = await response.json();

            // Actualizar números en tarjetas
            document.getElementById('count-total').textContent = data.total;
            document.getElementById('count-regulares').textContent = data.regulares;
            document.getElementById('count-riesgo').textContent = data.riesgo;
            document.getElementById('count-criticos').textContent = data.criticos;

            // Actualizar barras de progreso
            const total = data.total || 1;
            document.getElementById('bar-total').style.width = "100%";
            document.getElementById('bar-regulares').style.width = ((data.regulares / total) * 100) + "%";
            document.getElementById('bar-riesgo').style.width = ((data.riesgo / total) * 100) + "%";
            document.getElementById('bar-criticos').style.width = ((data.criticos / total) * 100) + "%";

            // Llenar tabla
            const tbody = document.getElementById('tabla-alumnos-body');
            tbody.innerHTML = '';
            data.lista.forEach(alumno => {
                const tr = document.createElement('tr');
                const estadoClase = alumno.estado_alerta.toLowerCase().replace(' ', '-');
                tr.innerHTML = `
                    <td class="avatar-cell">
                        <img src= "http://127.0.0.1:5000/fotos/${alumno.matricula}"
                        style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
                        onerror=" this.outerHTML = '<i class= \\'fa-solid fa-circle-user\\'></i>'">
                    <td>${alumno.matricula}</td><td>${alumno.nombre}</td><td>${alumno.apellidos}</td>
                    <td>${alumno.grupo}</td><td>${alumno.turno}</td><td>${alumno.semestre}</td>
                    <td>${alumno.carrera}</td><td>${alumno.pac}</td>
                    <td><span class="status-badge ${estadoClase}">${alumno.estado_alerta}</span></td>
                    <td class="numeric-cell">${alumno.materias_reprobadas}</td>
                    <td><button class="btn-action" data-matricula="${alumno.matricula}"><i class="fa-solid fa-chevron-right"></i></button></td>
                `;
                tbody.appendChild(tr);
            });

            // Configurar clics después de renderizar
            configurarClicsSeguimiento();

            // Poblar los selects de filtros con los valores reales de la BD
            poblarFiltros(data.lista);

            // Aplicar filtro desde URL si viene de inicio
            const params = new URLSearchParams(window.location.search);
            const estadoFiltro = params.get('estado');
            if (estadoFiltro) {
                const filtroEstado = document.getElementById('filtro-estado');
                if (filtroEstado) {
                    filtroEstado.value = estadoFiltro;
                    filtrarTabla();
                }
            }

        } catch (error) {
            console.error("Error al cargar alumnos:", error);
        }
    }

    // --- 3. NAVEGACIÓN ---
    function configurarClicsSeguimiento() {
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matricula = e.target.closest('button').dataset.matricula;
                localStorage.setItem('matriculaSeleccionada', matricula);
                window.location.href = "seguimiento_alumno.html";
            });
        });
    }

    // --- 4. FILTROS ---
    const inputBuscar = document.querySelector('.search-input');
    const btnLimpiar = document.querySelector('.btn-limpiar');
    const selects = document.querySelectorAll('.filter-select');

    function llenarSelect(select, valores) {
        select.innerHTML = '<option value="Todos">Todos</option>';
        valores.forEach(valor => {
            const option = document.createElement('option');
            option.value = valor;
            option.textContent = valor;
            select.appendChild(option);
        });
    }

    function poblarFiltros(lista) {
        const grupos    = [...new Set(lista.map(a => a.grupo))].sort();
        const carreras  = [...new Set(lista.map(a => a.carrera))].sort();
        const semestres = [...new Set(lista.map(a => a.semestre))].sort();
        const turnos    = [...new Set(lista.map(a => a.turno))].sort();
        const estados   = [...new Set(lista.map(a => a.estado_alerta))].sort();

        llenarSelect(document.getElementById('filtro-grupo'), grupos);
        llenarSelect(document.getElementById('filtro-carrera'), carreras);
        llenarSelect(document.getElementById('filtro-semestre'), semestres);
        llenarSelect(document.getElementById('filtro-turno'), turnos);
        llenarSelect(document.getElementById('filtro-estado'), estados);
    }

    function filtrarTabla() {
        const texto = inputBuscar.value.toLowerCase();
        const grupo = document.getElementById('filtro-grupo').value;
        const carrera = document.getElementById('filtro-carrera').value;
        const semestre = document.getElementById('filtro-semestre').value;
        const turno = document.getElementById('filtro-turno').value;
        const estado = document.getElementById('filtro-estado').value;

        document.querySelectorAll('#tabla-alumnos-body tr').forEach(fila => {
            const celdas = fila.children;
            const coincideTexto    = fila.textContent.toLowerCase().includes(texto);
            const coincideGrupo    = grupo === 'Todos'    || celdas[4].textContent.trim() === grupo;
            const coincideTurno    = turno === 'Todos'    || celdas[5].textContent.trim() === turno;
            const coincideSemestre = semestre === 'Todos' || celdas[6].textContent.trim() === semestre;
            const coincideCarrera  = carrera === 'Todos'  || celdas[7].textContent.trim() === carrera;
            const coincideEstado   = estado === 'Todos'   || celdas[9].textContent.trim() === estado;

            fila.style.display = (coincideTexto && coincideGrupo && coincideTurno && coincideSemestre && coincideCarrera && coincideEstado) ? '' : 'none';
        });
    }

    if (inputBuscar) inputBuscar.addEventListener('input', filtrarTabla);
    selects.forEach(select => select.addEventListener('change', filtrarTabla));
    if (btnLimpiar) btnLimpiar.addEventListener('click', () => {
        inputBuscar.value = '';
        selects.forEach(select => select.value = 'Todos');
        filtrarTabla();
    });

    // Inicializar
    cargarDatosAlumnos();
});