document.addEventListener('DOMContentLoaded', () => {
    // --- 1. LÓGICA DEL MENÚ FLOTANTE ---
    const btnHamburguesa = document.getElementById('btnHamburguesa');
    const overlay = document.getElementById('sidebarOverlay');
    const btnCerrar = document.getElementById('btnCerrarSidebar');

    if (btnHamburguesa && overlay) {
        btnHamburguesa.addEventListener('click', () => {
            overlay.classList.add('open');
        });
    }

    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            overlay.classList.remove('open');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('open');
            }
        });
    }

    // --- 2. LÓGICA DE FILTROS Y TABLA ---
    const inputBuscar = document.querySelector('.search-input');
    const btnLimpiar = document.querySelector('.btn-limpiar');
    const selects = document.querySelectorAll('.filter-select');
    const filasTabla = document.querySelectorAll('.data-table tbody tr');

    // Mapeo de columnas para los filtros
    const mapeoColumnas = { 0: 4, 1: 7, 2: 6, 3: 5, 4: 9 };

    function inicializarFiltrosDinamicos() {
        const opcionesPorFiltro = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };

        filasTabla.forEach(fila => {
            const celdas = fila.getElementsByTagName('td');
            if (celdas.length < 10) return;

            Object.keys(mapeoColumnas).forEach(index => {
                const numColumna = mapeoColumnas[index];
                const texto = celdas[numColumna].textContent.trim();
                if (texto) opcionesPorFiltro[index].add(texto);
            });
        });

        selects.forEach((select, index) => {
            const opcionesUnicas = Array.from(opcionesPorFiltro[index]).sort();
            select.innerHTML = '<option>Todos</option>';
            opcionesUnicas.forEach(opcion => {
                const elOption = document.createElement('option');
                elOption.textContent = opcion;
                select.appendChild(elOption);
            });
        });
    }

    function filtrarTabla() {
        const textoBusqueda = inputBuscar.value.toLowerCase().trim();

        filasTabla.forEach(fila => {
            const celdas = fila.getElementsByTagName('td');
            if (celdas.length < 10) return; 

            const matricula = celdas[1].textContent.trim().toLowerCase();
            const nombre = celdas[2].textContent.trim().toLowerCase();
            const apellidos = celdas[3].textContent.trim().toLowerCase();
            const nombreCompleto = `${nombre} ${apellidos}`;

            const coincideBusqueda = textoBusqueda === '' || 
                                     matricula.includes(textoBusqueda) || 
                                     nombre.includes(textoBusqueda) || 
                                     apellidos.includes(textoBusqueda) ||
                                     nombreCompleto.includes(textoBusqueda);

            let coincideSelects = true;
            selects.forEach((select, index) => {
                const valorSeleccionado = select.value.trim().toLowerCase();
                if (valorSeleccionado !== 'todos') {
                    const numeroColumna = mapeoColumnas[index];
                    const textoCelda = celdas[numeroColumna].textContent.trim().toLowerCase();
                    if (textoCelda !== valorSeleccionado) coincideSelects = false;
                }
            });

            fila.style.display = (coincideBusqueda && coincideSelects) ? '' : 'none';
        });
    }

    // --- 3. LÓGICA DE NAVEGACIÓN A SEGUIMIENTO ---
    function CONFIGURAR_CLICS_SEGUIMIENTO() {
        filasTabla.forEach(fila => {
            const enlace = fila.querySelector('a');
            if (enlace) {
                enlace.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    
                    const celdas = fila.querySelectorAll('td');
                    const badgeEstado = fila.querySelector('.status-badge');
                    
                    const datosAlumno = {
                        matricula: celdas[1].textContent.trim(),
                        nombre: celdas[2].textContent.trim(),
                        apellidos: celdas[3].textContent.trim(),
                        grupo: celdas[4].textContent.trim(),
                        turno: celdas[5].textContent.trim(),
                        semestre: celdas[6].textContent.trim(),
                        carrera: celdas[7].textContent.trim(),
                        estado: badgeEstado ? badgeEstado.textContent.trim() : 'Regular',
                        reprobadas: celdas[10].textContent.trim()
                    };
                    
                    localStorage.setItem('alumnoSeleccionado', JSON.stringify(datosAlumno));
                    window.location.href = "seguimiento_alumno.html";
                });
            }
        });
    }

    // Inicialización general
    inicializarFiltrosDinamicos();
    CONFIGURAR_CLICS_SEGUIMIENTO();

    if (inputBuscar) inputBuscar.addEventListener('input', filtrarTabla);
    selects.forEach(select => select.addEventListener('change', filtrarTabla));

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            inputBuscar.value = ''; 
            selects.forEach(select => select.selectedIndex = 0);
            filtrarTabla(); 
        });
    }
});