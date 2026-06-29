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

    const todasLasAulas = [
        { nombre: "Aula 10",                  id: 1, color: "bg-rosa"       },
        { nombre: "Aula 14",                  id: 2, color: "bg-azul"       },
        { nombre: "Aula 17",                  id: 3, color: "bg-morado"     },
        { nombre: "Aula 23",                  id: 4, color: "bg-azul_claro" },
        { nombre: "Laboratorio de Cómputo 1", id: 5, color: "bg-amarillo"   },
        { nombre: "Submódulo 3",              id: 6, color: "bg-verde"      },
        { nombre: "Submódulo 1",              id: 7, color: "bg-naranja"    },
        { nombre: "Submódulo 2",              id: 8, color: "bg-cafe"       }
    ];

    // --- 3. PANEL ---
    const panelRegistro    = document.getElementById("panelRegistro");
    const btnNuevo         = document.querySelector(".btn-nuevo");
    const btnGuardar       = document.getElementById("btnGuardar");
    const btnCancelarPanel = document.getElementById("btnCancelar");

    // Solo aparece al presionar + Nueva aula
    btnNuevo.addEventListener("click", () => {
        cerrarTodosLosMenus();
        document.getElementById("indiceEdicion").value  = "-1";
        document.getElementById("inputNombreAula").value = "";
        document.getElementById("inputIdAula").value    = "";
        panelRegistro.classList.remove("hidden");
    });

    btnCancelarPanel.addEventListener("click", () => {
        panelRegistro.classList.add("hidden");
        document.getElementById("indiceEdicion").value = "-1";
    });

    btnGuardar.addEventListener("click", () => {
        const indice = parseInt(document.getElementById("indiceEdicion").value);
        const nombre = document.getElementById("inputNombreAula").value.trim();
        const id     = parseInt(document.getElementById("inputIdAula").value) || 0;

        if (!nombre) { alert("El nombre del aula es obligatorio."); return; }

        if (indice > -1) {
            todasLasAulas[indice].nombre = nombre;
            todasLasAulas[indice].id     = id;
        } else {
            const colores = ["bg-rosa","bg-azul","bg-amarillo","bg-verde","bg-naranja","bg-morado","bg-azul_claro","bg-cafe"];
            todasLasAulas.push({ nombre, id, color: colores[Math.floor(Math.random() * colores.length)] });
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

        const filtrados = todasLasAulas.filter(a =>
            a.nombre.toLowerCase().includes(textoBusqueda)
        );

        const inicio  = (paginaActual - 1) * itemsPorPagina;
        const mostrar = filtrados.slice(inicio, inicio + itemsPorPagina);

        mostrar.forEach((a) => {
            const idx = todasLasAulas.indexOf(a);
            contenedor.innerHTML += `
                <div class="tarjeta-grupo">
                    <div class="contenedor-menu">
                        <button class="btn-opciones" onclick="window.toggleMenu(event, ${idx})">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        <div class="menu-desplegable" id="menu-${idx}">
                            <button onclick="window.abrirEditar(${idx})">✏️ Editar</button>
                            <button class="btn-eliminar" onclick="window.eliminarAula(${idx})">🗑️ Eliminar</button>
                        </div>
                    </div>

                    <div class="icono-grupo ${a.color}">
                        <i class="fa-solid fa-door-open"></i>
                    </div>

                    <div class="info-grupo">
                        <h3>${a.nombre}</h3>
                        <p class="info-id">ID: ${a.id}</p>
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

        const prev = document.createElement("a");
        prev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prev.className = "btn-pag";
        prev.href = "#";
        prev.addEventListener("click", (e) => {
            e.preventDefault();
            if (paginaActual > 1) { paginaActual--; renderizar(); }
        });
        paginacion.appendChild(prev);

        for (let i = 1; i <= totalPaginas; i++) {
            const btn     = document.createElement("a");
            btn.innerText = i;
            btn.className = `btn-pag ${i === paginaActual ? "active" : ""}`;
            btn.href      = "#";
            btn.addEventListener("click", (e) => { e.preventDefault(); paginaActual = i; renderizar(); });
            paginacion.appendChild(btn);
        }

        const next = document.createElement("a");
        next.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        next.className = "btn-pag";
        next.href = "#";
        next.addEventListener("click", (e) => {
            e.preventDefault();
            if (paginaActual < totalPaginas) { paginaActual++; renderizar(); }
        });
        paginacion.appendChild(next);
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
        const a = todasLasAulas[index];
        document.getElementById("inputNombreAula").value = a.nombre;
        document.getElementById("inputIdAula").value    = a.id;
        document.getElementById("indiceEdicion").value  = index;
        panelRegistro.classList.remove("hidden");
    };

    // --- 9. ELIMINAR ---
    window.eliminarAula = (index) => {
        cerrarTodosLosMenus();
        if (confirm("¿Eliminar esta aula?")) {
            todasLasAulas.splice(index, 1);
            renderizar();
        }
    };

    renderizar();
});