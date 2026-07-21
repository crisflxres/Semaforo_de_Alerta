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
    const gruposPorPagina = 12;
    let paginaActual  = 1;
    let textoBusqueda = "";
    let todosLosGrupos = [];

    const colores = ["bg-rosa","bg-azul","bg-amarillo","bg-verde","bg-naranja",
                     "bg-morado","bg-azul_claro","bg-cafe","bg-gris","bg-rojo"];

    fetch("https://semaforo-de-alerta.onrender.com/grupos")
        .then(res => res.json())
        .then(respuesta => {
            if (respuesta.success) {
                todosLosGrupos = respuesta.data.map((g, i) => ({
                    id:      g.Id_Grupo,
                    nombre:  g.Nombre,
                    alumnos: g.Alumnos,
                    turno:   g.Turno,
                    color:   colores[i % colores.length]
                }));
                renderizar();
            }
        })
        .catch(err => console.error("Error al cargar grupos:", err));

    // --- 3. PANEL ---
    const panelRegistro    = document.getElementById("panelRegistro");
    const btnNuevo         = document.querySelector(".btn-nuevo");
    const btnGuardar       = document.getElementById("btnGuardar");
    const btnCancelarPanel = document.getElementById("btnCancelar");

    // Solo aparece al presionar + Nuevo grupo
    btnNuevo.addEventListener("click", () => {
        cerrarTodosLosMenus();
        document.getElementById("indiceEdicion").value   = "-1";
        document.getElementById("inputNombreGrupo").value = "";
        document.getElementById("inputAlumnos").value    = "";
        document.getElementById("inputTurno").value      = "";
        panelRegistro.classList.remove("hidden");
    });

    btnCancelarPanel.addEventListener("click", () => {
        panelRegistro.classList.add("hidden");
        document.getElementById("indiceEdicion").value = "-1";
    });

    btnGuardar.addEventListener("click", () => {
        const indice = parseInt(document.getElementById("indiceEdicion").value);
        const nombre  = document.getElementById("inputNombreGrupo").value.trim();
        const alumnos = parseInt(document.getElementById("inputAlumnos").value) || 0;
        const turno   = document.getElementById("inputTurno").value.trim();

        if (!nombre) { alert("El nombre del grupo es obligatorio."); return; }

        if (indice > -1) {
            todosLosGrupos[indice].nombre  = nombre;
            todosLosGrupos[indice].alumnos = alumnos;
            todosLosGrupos[indice].turno   = turno;
        } else {
            const colores = ["bg-rosa","bg-azul","bg-amarillo","bg-verde","bg-naranja","bg-morado","bg-azul_claro","bg-cafe"];
            todosLosGrupos.push({ nombre, alumnos, turno, color: colores[Math.floor(Math.random() * colores.length)] });
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

        const filtrados = todosLosGrupos.filter(g =>
            g.nombre.toLowerCase().includes(textoBusqueda)
        );

        const inicio  = (paginaActual - 1) * gruposPorPagina;
        const mostrar = filtrados.slice(inicio, inicio + gruposPorPagina);

        mostrar.forEach((g) => {
            const idx = todosLosGrupos.indexOf(g);
            contenedor.innerHTML += `
                <div class="tarjeta-grupo">
                    <div class="contenedor-menu">
                        <button class="btn-opciones" onclick="window.toggleMenu(event, ${idx})">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        <div class="menu-desplegable" id="menu-${idx}">
                            <button class="btn-editar" onclick="window.abrirEditar(${idx})">✏️ Editar</button>
                            <button class="btn-eliminar" onclick="window.eliminarGrupo(${idx})">🗑️ Eliminar</button>
                        </div>
                    </div>

                    <div class="icono-grupo ${g.color}">
                        <i class="fa-solid fa-table-cells-large"></i>
                    </div>

                    <div class="info-grupo">
                        <h3>${g.nombre}</h3>
                        <p>${g.alumnos} Alumnos</p>
                        <span class="etiqueta ${g.color}">${g.turno}</span>
                    </div>
                </div>`;
        });

        renderizarPaginacion(filtrados.length);
    }

    // --- 6. PAGINACIÓN ---
    function renderizarPaginacion(totalFiltrados) {
        const totalPaginas = Math.ceil(totalFiltrados / gruposPorPagina);
        const paginacion   = document.getElementById("paginacion");
        if (!paginacion) return;
        paginacion.innerHTML = "";
        if (totalPaginas <= 1) return;

        // Botón anterior
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

        // Botón siguiente
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
        const g = todosLosGrupos[index];
        document.getElementById("inputNombreGrupo").value = g.nombre;
        document.getElementById("inputAlumnos").value    = g.alumnos;
        document.getElementById("inputTurno").value      = g.turno;
        document.getElementById("indiceEdicion").value   = index;
        panelRegistro.classList.remove("hidden");
    };

    // --- 9. ELIMINAR ---
    window.eliminarGrupo = (index) => {
        cerrarTodosLosMenus();
        if (confirm("¿Eliminar este grupo?")) {
            todosLosGrupos.splice(index, 1);
            renderizar();
        }
    };

    renderizar();
});

document.addEventListener('DOMContentLoaded', () => {
    const avatarUsuario = document.getElementById('avatarUsuario');
    const dropdownPerfil = document.getElementById('dropdownPerfil');

    if (avatarUsuario && dropdownPerfil) {
        avatarUsuario.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownPerfil.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!dropdownPerfil.contains(e.target) && e.target !== avatarUsuario) {
                dropdownPerfil.classList.remove('open');
            }
        });
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('rolUsuario');
            localStorage.removeItem('nombreUsuario');
            window.location.href = 'index.html';
        });
    }
});