document.addEventListener("DOMContentLoaded", () => {

    // --- 1. MENÚ LATERAL ---
    const sidebar   = document.getElementById("sidebarOverlay");
    const btnAbrir  = document.getElementById("btnHamburguesa");
    const btnCerrar = document.getElementById("btnCerrarSidebar");

    if (btnAbrir && sidebar && btnCerrar) {
        btnAbrir.addEventListener("click",  () => sidebar.classList.add("open"));
        btnCerrar.addEventListener("click", () => sidebar.classList.remove("open"));
        sidebar.addEventListener("click", (e) => {
            if (e.target === sidebar) sidebar.classList.remove("open");
        });
    }

    // --- 2. DATOS ---
    const itemsPorPagina = 12;
    let paginaActual  = 1;
    let textoBusqueda = "";

    const todasLasMaterias = [
        { id: "ID: MAT001", nombre: "Inglés IV",                       tipo: "Tipo: Básica",   color: "bg-rosa"       },
        { id: "ID: MAT002", nombre: "Reacciones Químicas",             tipo: "Tipo: Avanzada", color: "bg-azul"       },
        { id: "ID: MAT003", nombre: "Temas selectos de matemáticas I", tipo: "Tipo: Básica",   color: "bg-morado"     },
        { id: "ID: MAT004", nombre: "Ciencias Sociales III",           tipo: "Tipo: Básica",   color: "bg-azul_claro" },
        { id: "ID: MAT005", nombre: "Conciencia Histórica I",          tipo: "Tipo: Básica",   color: "bg-amarillo"   },
        { id: "ID: MAT006", nombre: "Submódulo 3",                     tipo: "Tipo: Avanzada", color: "bg-verde"      },
        { id: "ID: MAT007", nombre: "Submódulo 1",                     tipo: "Tipo: Básica",   color: "bg-naranja"    },
        { id: "ID: MAT008", nombre: "Submódulo 2",                     tipo: "Tipo: Básica",   color: "bg-cafe"       }
    ];

    // --- 3. PANEL ---
    const panelRegistro    = document.getElementById("panelRegistro");
    const btnNuevo         = document.querySelector(".btn-nuevo");
    const btnGuardar       = document.getElementById("btnGuardar");
    const btnCancelarPanel = document.getElementById("btnCancelar");

    // Solo al presionar + Nueva materia
    btnNuevo.addEventListener("click", () => {
        cerrarTodosLosMenus();
        document.getElementById("indiceEdicion").value      = "-1";
        document.getElementById("inputIdMateria").value     = "";
        document.getElementById("inputTipoMateria").value   = "";
        document.getElementById("inputNombreMateria").value = "";
        panelRegistro.classList.remove("hidden");
    });

    btnCancelarPanel.addEventListener("click", () => {
        panelRegistro.classList.add("hidden");
        document.getElementById("indiceEdicion").value = "-1";
    });

    btnGuardar.addEventListener("click", () => {
        const indice = parseInt(document.getElementById("indiceEdicion").value);
        const id     = document.getElementById("inputIdMateria").value.trim();
        const tipo   = document.getElementById("inputTipoMateria").value.trim();
        const nombre = document.getElementById("inputNombreMateria").value.trim();

        if (!nombre) { alert("El nombre de la materia es obligatorio."); return; }

        if (indice > -1) {
            todasLasMaterias[indice].id     = id;
            todasLasMaterias[indice].tipo   = tipo;
            todasLasMaterias[indice].nombre = nombre;
        } else {
            const colores = ["bg-rosa","bg-azul","bg-amarillo","bg-verde","bg-naranja","bg-morado","bg-azul_claro","bg-cafe"];
            todasLasMaterias.push({ id, tipo, nombre, color: colores[Math.floor(Math.random() * colores.length)] });
        }

        renderizar();
        panelRegistro.classList.add("hidden");
        document.getElementById("indiceEdicion").value = "-1";
    });

    // --- 4. BUSCADOR ---
    const inputBusqueda = document.querySelector(".input-buscar");
    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", (e) => {
            textoBusqueda = e.target.value.toLowerCase();
            paginaActual  = 1;
            renderizar();
        });
    }

    // --- 5. RENDERIZADO ---
    function renderizar() {
        const contenedor = document.getElementById("contenedorTarjetas");
        if (!contenedor) return;
        contenedor.innerHTML = "";

        const filtrados = todasLasMaterias.filter(m =>
            m.nombre.toLowerCase().includes(textoBusqueda)
        );

        const inicio  = (paginaActual - 1) * itemsPorPagina;
        const mostrar = filtrados.slice(inicio, inicio + itemsPorPagina);

        mostrar.forEach((m) => {
            const idx = todasLasMaterias.indexOf(m);
            contenedor.innerHTML += `
                <div class="tarjeta-grupo">
                    <div class="contenedor-menu">
                        <button class="btn-opciones" onclick="window.toggleMenu(event, ${idx})">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        <div class="menu-desplegable" id="menu-${idx}">
                            <button onclick="window.abrirEditar(${idx})">✏️ Editar</button>
                            <button class="btn-eliminar" onclick="window.eliminarMateria(${idx})">🗑️ Eliminar</button>
                        </div>
                    </div>

                    <!-- Ícono circular -->
                    <div class="icono-grupo ${m.color}">
                        <i class="fa-solid fa-table-cells-large"></i>
                    </div>

                    <!-- Info vertical: nombre → ID → etiqueta -->
                    <div class="info-grupo">
                        <h3>${m.nombre}</h3>
                        <p class="info-id">${m.id || ""}</p>
                        <span class="etiqueta-tipo ${m.color}">${m.tipo || ""}</span>
                    </div>
                </div>`;
        });

        renderizarPaginacion(filtrados.length);
    }

    // --- 6. PAGINACIÓN ---
    function renderizarPaginacion(totalFiltrados) {
        const totalPaginas = Math.ceil(totalFiltrados / itemsPorPagina);
        const paginacion   = document.getElementById("paginacion");
        if (!paginacion) return;
        paginacion.innerHTML = "";
        if (totalPaginas <= 1) return;

        for (let i = 1; i <= totalPaginas; i++) {
            const btn     = document.createElement("a");
            btn.innerText = i;
            btn.className = `btn-pag ${i === paginaActual ? "active" : ""}`;
            btn.href      = "#";
            btn.addEventListener("click", (e) => { e.preventDefault(); paginaActual = i; renderizar(); });
            paginacion.appendChild(btn);
        }
    }

    // --- 7. MENÚ DESPLEGABLE ---
    function cerrarTodosLosMenus() {
        document.querySelectorAll(".menu-desplegable").forEach(m => m.classList.remove("show"));
    }

    window.toggleMenu = (event, index) => {
        event.stopPropagation();
        const menu = document.getElementById(`menu-${index}`);
        const yaAbierto = menu.classList.contains("show");
        cerrarTodosLosMenus();
        if (!yaAbierto) menu.classList.add("show");
    };

    document.addEventListener("click", () => cerrarTodosLosMenus());

    // --- 8. EDITAR ---
    window.abrirEditar = (index) => {
        cerrarTodosLosMenus();
        const m = todasLasMaterias[index];
        document.getElementById("inputIdMateria").value     = m.id   || "";
        document.getElementById("inputTipoMateria").value   = m.tipo || "";
        document.getElementById("inputNombreMateria").value = m.nombre;
        document.getElementById("indiceEdicion").value      = index;
        panelRegistro.classList.remove("hidden");
    };

    // --- 9. ELIMINAR ---
    window.eliminarMateria = (index) => {
        cerrarTodosLosMenus();
        if (confirm("¿Eliminar esta materia?")) {
            todasLasMaterias.splice(index, 1);
            renderizar();
        }
    };

    renderizar();
});