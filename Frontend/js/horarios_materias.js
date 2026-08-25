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
const BASE_URL = "https://semaforo-de-alerta.onrender.com";

// Rol del usuario guardado al hacer login. El backend lo exige
function obtenerHeadersAuth(conContentType = false) {
    const headers = {
        "X-Id-Rol": localStorage.getItem("rolUsuario") || ""
    };
    if (conContentType) {
        headers["Content-Type"] = "application/json";
    }
    return headers;
}

const itemsPorPagina = 12;
let paginaActual  = 1;
let textoBusqueda = "";

const etiquetasTipo = {
    basica: "Básica",
    optativa: "Optativa",
    submodulo: "Submódulo"
};

let todasLasMaterias = [];
let todasLasCarreras = [];
const colores = ["bg-rosa","bg-azul","bg-amarillo","bg-verde","bg-naranja","bg-morado","bg-azul_claro","bg-cafe"];

async function obtenerMaterias() {
    try {
        const respuesta = await fetch(`${BASE_URL}/api/materias`, {
            headers: obtenerHeadersAuth()
        });
        if (!respuesta.ok) {
            console.error(`Error al cargar materias: HTTP ${respuesta.status}`);
            return;
        }
        const datos = await respuesta.json();

        todasLasMaterias = datos.map(m => ({
            id_materia: m.Id_Materia,
            nombre: m.Nombre,
            semestre: m.Semestre,
            clave_carrera: m.Id_Carrera,
            tipo_materia: m.Tipo,
            color: colores[Math.floor(Math.random() * colores.length)]  // resolvemos esto en un momento
        }));
    } catch (err) {
        console.error("No se pudo conectar a /api/materias:", err);
    }
}

// Trae el catálogo de carreras para llenar el select del panel.
async function obtenerCarreras() {
    try {
        const respuesta = await fetch(`${BASE_URL}/api/carreras`, {
            headers: obtenerHeadersAuth()
        });
        if (!respuesta.ok) {
            console.error(`Error al cargar carreras: HTTP ${respuesta.status}`);
            return;
        }
        const datos = await respuesta.json();

        todasLasCarreras = datos.map(c => ({
            id_carrera: c.Id_Carrera,
            nombre: c.Nombre,
            clave: c.Clave
        }));
    } catch (err) {
        console.error("No se pudo conectar a /api/carreras:", err);
        return;
    }

    llenarSelectCarreras();
}

function llenarSelectCarreras() {
    const select = document.getElementById("inputCarreraMateria");
    if (!select) return;

    // Deja el placeholder y agrega una opción por cada carrera
    select.innerHTML = `<option value="" disabled selected>Clave de Carrera</option>`;
    todasLasCarreras.forEach(c => {
        select.innerHTML += `<option value="${c.id_carrera}">${c.clave}</option>`;
    });
}

async function iniciar() {
    await obtenerCarreras();
    await obtenerMaterias();
    renderizar();
}

    // --- 3. PANEL ---
    const panelRegistro    = document.getElementById("panelRegistro");
    const btnNuevo         = document.querySelector(".btn-nuevo");
    const btnGuardar       = document.getElementById("btnGuardar");
    const btnCancelarPanel = document.getElementById("btnCancelar");

    // Solo al presionar + Nueva materia
    btnNuevo.addEventListener("click", () => {
        cerrarTodosLosMenus();
        document.getElementById("indiceEdicion").value      = "-1";
        document.getElementById("inputNombreMateria").value     = "";
        document.getElementById("inputSemestreMateria").value   = "";
        document.getElementById("inputCarreraMateria").value = "";
        document.getElementById("inputTipoMateria").value = "";
        panelRegistro.classList.remove("hidden");
    });

    btnCancelarPanel.addEventListener("click", () => {
        panelRegistro.classList.add("hidden");
        document.getElementById("indiceEdicion").value = "-1";
    });

    btnGuardar.addEventListener("click", async () => {
        const indice = parseInt(document.getElementById("indiceEdicion").value);
        const nombre = document.getElementById("inputNombreMateria").value.trim();
        const semestre   = document.getElementById("inputSemestreMateria").value;
        const clave_carrera = document.getElementById("inputCarreraMateria").value;
        const tipo_materia = document.getElementById("inputTipoMateria").value;

        if (!nombre) { alert("El nombre de la materia es obligatorio."); return; }
        if (!semestre) { alert("Selecciona el semestre."); return; }
        if (!clave_carrera) { alert("Selecciona la carrera."); return; }
        if (!tipo_materia) { alert("Selecciona el tipo de materia."); return; }

        try {
            let respuesta;
            if (indice === -1) {
                respuesta = await fetch(`${BASE_URL}/api/materias`, {
                    method: "POST",
                    headers: obtenerHeadersAuth(true),
                    body: JSON.stringify({
                        Nombre: nombre,
                        Semestre: semestre,
                        Clave_Carrera: clave_carrera,
                        Tipo: tipo_materia
                    })
                });
            } else {
                respuesta = await fetch(`${BASE_URL}/api/materias/${todasLasMaterias[indice].id_materia}`, {
                    method: "PUT",
                    headers: obtenerHeadersAuth(true),
                    body: JSON.stringify({
                        Nombre: nombre,
                        Semestre: semestre,
                        Clave_Carrera: clave_carrera,
                        Tipo: tipo_materia
                    })
                });
            }

            if (!respuesta.ok) {
                const errorTexto = await respuesta.text();
                console.error(`Error al guardar materia: HTTP ${respuesta.status}`, errorTexto);
                alert(`No se pudo guardar la materia (HTTP ${respuesta.status}). Revisa la consola.`);
                return;
            }
        } catch (err) {
            console.error("Error de red al guardar materia:", err);
            alert("No se pudo conectar con el servidor.");
            return;
        }

        await obtenerMaterias();
        renderizar();

        panelRegistro.classList.add("hidden");
        document.getElementById("indiceEdicion").value = "-1";

        alert(indice === -1 ? "Materia creada correctamente." : "Materia editada correctamente.");
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
        ).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

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
                            <button class="btn-editar" onclick="window.abrirEditar(${idx})">✏️ Editar</button>
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
                        <p class="info-id">${m.semestre ? "Semestre: " + m.semestre : ""}</p>
                        <span class="etiqueta-tipo ${m.color}">${etiquetasTipo[m.tipo_materia] || m.tipo_materia || ""}</span>
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
        const m = todasLasMaterias[index];
        document.getElementById("inputNombreMateria").value     = m.nombre || "";
        document.getElementById("inputSemestreMateria").value   = m.semestre || "";
        document.getElementById("inputCarreraMateria").value = m.clave_carrera || "";
        document.getElementById("inputTipoMateria").value = m.tipo_materia || "";
        document.getElementById("indiceEdicion").value      = index;
        panelRegistro.classList.remove("hidden");
    };

    // --- 9. ELIMINAR ---
    window.eliminarMateria = async (index) => {
        cerrarTodosLosMenus();
        if (confirm("¿Eliminar esta materia?")) {
            try {
                const respuesta = await fetch(`${BASE_URL}/api/materias/${todasLasMaterias[index].id_materia}`, {
                    method: "DELETE",
                    headers: obtenerHeadersAuth(true)
                });

                if (!respuesta.ok) {
                    const errorTexto = await respuesta.text();
                    console.error(`Error al eliminar materia: HTTP ${respuesta.status}`, errorTexto);
                    alert(`No se pudo eliminar la materia (HTTP ${respuesta.status}). Revisa la consola.`);
                    return;
                }
            } catch (err) {
                console.error("Error de red al eliminar materia:", err);
                alert("No se pudo conectar con el servidor.");
                return;
            }

            await obtenerMaterias();
            renderizar();

            alert("Materia eliminada correctamente.");
        }
    };

    iniciar();
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