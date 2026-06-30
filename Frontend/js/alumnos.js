document.addEventListener('DOMContentLoaded', () => {
    // --- 1. LÓGICA DEL MENÚ FLOTANTE ---
    const btnHamburguesa = document.getElementById('btnHamburguesa');
    const overlay = document.getElementById('sidebarOverlay');
    const btnCerrar = document.getElementById('btnCerrarSidebar');

    if (btnHamburguesa && overlay) btnHamburguesa.addEventListener('click', () => overlay.classList.add('open'));
    if (btnCerrar) btnCerrar.addEventListener('click', () => overlay.classList.remove('open'));
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

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
                    <td class="avatar-cell"><i class="fa-solid fa-circle-user"></i></td>
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

    function filtrarTabla() {
        const texto = inputBuscar.value.toLowerCase();
        document.querySelectorAll('#tabla-alumnos-body tr').forEach(fila => {
            fila.style.display = fila.textContent.toLowerCase().includes(texto) ? '' : 'none';
        });
    }

    if (inputBuscar) inputBuscar.addEventListener('input', filtrarTabla);
    if (btnLimpiar) btnLimpiar.addEventListener('click', () => { inputBuscar.value = ''; filtrarTabla(); });

    // Inicializar
    cargarDatosAlumnos();
});