const API = 'https://semaforo-de-alerta-f2kf.onrender.com';

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
    let todasLasCarreras = [];

    const colores = ["bg-rosa","bg-azul","bg-amarillo","bg-verde","bg-naranja",
                     "bg-morado","bg-azul_claro","bg-cafe","bg-gris","bg-rojo"];

    function cargarCarreras() {
        return fetch(`${API}/api/carreras`)
            .then(res => res.json())
            .then(data => {
                todasLasCarreras = Array.isArray(data) ? data : [];
                const select = document.getElementById("inputCarrera");
                if (!select) return;
                select.innerHTML = '<option value="">Selecciona una carrera</option>';
                todasLasCarreras.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.Id_Carrera;
                    opt.textContent = c.Nombre;
                    select.appendChild(opt);
                });
            })
            .catch(err => console.error("Error al cargar carreras:", err));
    }

    function cargarGrupos() {
        fetch(`${API}/grupos`)
            .then(res => res.json())
            .then(respuesta => {
                if (respuesta.success) {
                    todosLosGrupos = respuesta.data.map((g, i) => ({
                        id:         g.Id_Grupo,
                        nombre:     g.Nombre,
                        semestre:   g.Semestre,
                        idCarrera:  g.Id_Carrera,
                        alumnos:    g.Alumnos,
                        turno:      g.Turno,
                        color:      colores[i % colores.length]
                    }));
                    renderizar();
                }
            })
            .catch(err => console.error("Error al cargar grupos:", err));
    }

    cargarCarreras().then(cargarGrupos);

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
        const selectCarrera = document.getElementById("inputCarrera");
        if (selectCarrera) selectCarrera.value = "";
        panelRegistro.classList.remove("hidden");
    });

    btnCancelarPanel.addEventListener("click", () => {
        panelRegistro.classList.add("hidden");
        document.getElementById("indiceEdicion").value = "-1";
    });

    btnGuardar.addEventListener("click", () => {
        const indice   = parseInt(document.getElementById("indiceEdicion").value);
        const nombre   = document.getElementById("inputNombreGrupo").value.trim();

        // Este input conserva el id "inputAlumnos" en el HTML por compatibilidad,
        // pero representa el Semestre (el número de alumnos real se calcula
        // en el backend según los alumnos inscritos al grupo).
        const valorSemestre = document.getElementById("inputAlumnos").value;
        const semestre = valorSemestre === "" ? null : valorSemestre;

        const turno    = document.getElementById("inputTurno").value.trim();

        const selectCarrera = document.getElementById("inputCarrera");
        const idCarrera = selectCarrera ? selectCarrera.value : "";

        if (!nombre) { alert("El nombre del grupo es obligatorio."); return; }
        if (semestre === null) { alert("El semestre es obligatorio."); return; }
        if (!idCarrera) { alert("Selecciona una carrera."); return; }

        const payload = {
            Nombre: nombre,
            Semestre: semestre,
            Turno: turno,
            Id_Carrera: idCarrera
        };

        if (indice > -1) {
            // --- EDITAR (PUT) ---
            const idGrupo = todosLosGrupos[indice].id;

            fetch(`${API}/grupos/${idGrupo}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(resultado => {
                if (resultado.success) {
                    todosLosGrupos[indice].nombre    = nombre;
                    todosLosGrupos[indice].semestre  = semestre;
                    todosLosGrupos[indice].turno     = turno;
                    todosLosGrupos[indice].idCarrera = idCarrera;
                    renderizar();
                    panelRegistro.classList.add("hidden");
                    document.getElementById("indiceEdicion").value = "-1";
                } else {
                    alert("Error al editar grupo: " + resultado.message);
                }
            })
            .catch(err => {
                console.error("Error al editar grupo:", err);
                alert("No se pudo conectar con el servidor.");
            });

        } else {
            // --- CREAR (POST) ---
            fetch(`${API}/grupos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(resultado => {
                if (resultado.success) {
                    todosLosGrupos.push({
                        id:        resultado.id_grupo,
                        nombre,
                        semestre,
                        idCarrera,
                        alumnos:   0, // un grupo recién creado empieza sin alumnos inscritos
                        turno,
                        color: colores[Math.floor(Math.random() * colores.length)]
                    });
                    renderizar();
                    panelRegistro.classList.add("hidden");
                    document.getElementById("indiceEdicion").value = "-1";
                } else {
                    alert("Error al crear grupo: " + resultado.message);
                }
            })
            .catch(err => {
                console.error("Error al crear grupo:", err);
                alert("No se pudo conectar con el servidor.");
            });
        }
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

        const crearBoton = (contenido, pagina, extraClass = "") => {
            const btn = document.createElement("a");
            btn.innerHTML = contenido;
            btn.className = `btn-pag ${extraClass}`;
            btn.href = "#";
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                if (pagina < 1 || pagina > totalPaginas || pagina === paginaActual) return;
                paginaActual = pagina;
                renderizar();
            });
            return btn;
        };

        const crearPuntos = () => {
            const span = document.createElement("span");
            span.className = "puntos-pag";
            span.innerText = "...";
            return span;
        };

        // Flecha anterior
        const btnAnterior = crearBoton('<i class="fa-solid fa-chevron-left"></i>', paginaActual - 1, "btn-flecha");
        if (paginaActual === 1) btnAnterior.classList.add("disabled");
        paginacion.appendChild(btnAnterior);

        // En pantallas chicas solo se muestra la página actual (+ primera/última);
        // en pantallas más grandes se muestra 1 vecino a cada lado
        const delta = window.innerWidth <= 480 ? 0 : 1;
        const rango = [];

        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= paginaActual - delta && i <= paginaActual + delta)) {
                rango.push(i);
            }
        }

        let ultimaPagina = 0;
        rango.forEach((i) => {
            if (ultimaPagina && i - ultimaPagina > 1) {
                paginacion.appendChild(crearPuntos());
            }
            paginacion.appendChild(crearBoton(i, i, i === paginaActual ? "active" : ""));
            ultimaPagina = i;
        });

        // Flecha siguiente
        const btnSiguiente = crearBoton('<i class="fa-solid fa-chevron-right"></i>', paginaActual + 1, "btn-flecha");
        if (paginaActual === totalPaginas) btnSiguiente.classList.add("disabled");
        paginacion.appendChild(btnSiguiente);
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
        document.getElementById("inputAlumnos").value    = (g.semestre || "").toString().toLowerCase();
        document.getElementById("inputTurno").value      = g.turno;
        document.getElementById("indiceEdicion").value   = index;
        const selectCarrera = document.getElementById("inputCarrera");
        if (selectCarrera) selectCarrera.value = g.idCarrera ?? "";
        panelRegistro.classList.remove("hidden");
    };

    // --- 9. ELIMINAR (DELETE) ---
    window.eliminarGrupo = (index) => {
        cerrarTodosLosMenus();
        if (confirm("¿Eliminar este grupo?")) {
            const idGrupo = todosLosGrupos[index].id;

            fetch(`${API}/grupos/${idGrupo}`, { method: "DELETE" })
                .then(res => res.json())
                .then(resultado => {
                    if (resultado.success) {
                        todosLosGrupos.splice(index, 1);
                        renderizar();
                    } else {
                        alert("Error al eliminar grupo: " + resultado.message);
                    }
                })
                .catch(err => {
                    console.error("Error al eliminar grupo:", err);
                    alert("No se pudo conectar con el servidor.");
                });
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