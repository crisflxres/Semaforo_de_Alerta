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

let todasLasMaterias = [];
const colores = ["bg-rosa","bg-azul","bg-amarillo","bg-verde","bg-naranja","bg-morado","bg-azul_claro","bg-cafe"];

async function obtenerMaterias() {
    const respuesta = await fetch("http://127.0.0.1:5000/api/materias");
    const datos = await respuesta.json();

    todasLasMaterias = datos.map(m => ({
        id_materia: m.Id_Materia,
        nombre: m.Nombre,
        semestre: m.Semestre,
        clave_carrera: m.Id_Carrera,
        periodo: m.Periodo,
        tipo_materia: m.Tipo,
        color: colores[Math.floor(Math.random() * colores.length)]  // resolvemos esto en un momento
    }));
}

async function iniciar() {
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
        document.getElementById("inputClave_Carrera").value = "";
        document.getElementById("inputPeriodo").value = "";
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
        const semestre   = document.getElementById("inputSemestreMateria").value.trim();
        const clave_carrera = document.getElementById("inputClave_Carrera").value.trim();
        const periodo = document.getElementById("inputPeriodo").value.trim();
        const tipo_materia = document.getElementById("inputTipoMateria").value.trim();

        if (!nombre) { alert("El nombre de la materia es obligatorio."); return; }

        if(indice === -1) {
            await fetch("http://127.0.0.1:5000/api/materias", {
                method: "POST",
                headers: { "Content-Type":     "application/json"},
                    body: JSON.stringify({
                        Nombre: nombre,
                        Semestre: semestre,
                        Clave_Carrera: clave_carrera,
                        Periodo: periodo,
                        Tipo: tipo_materia
                    })
            });
        } else {
            await fetch("http://127.0.0.1:5000/api/materias", {
                method: "PUT",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    Id_Materia: todasLasMaterias[indice].id_materia,
                    Nombre: nombre,
                    Semestre: semestre,
                    Clave_Carrera: clave_carrera,
                    Periodo: periodo,
                    Tipo: tipo_materia
                })
            });
        }
        await obtenerMaterias();
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
                        <span class="etiqueta-tipo ${m.color}">${m.tipo_materia || ""}</span>
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
        document.getElementById("inputNombreMateria").value     = m.nombre || "";
        document.getElementById("inputSemestreMateria").value   = m.semestre || "";
        document.getElementById("inputClave_Carrera").value = m.clave_carrera || "";
        document.getElementById("inputPeriodo").value = m.periodo || "";
        document.getElementById("inputTipoMateria").value = m.tipo_materia || "";
        document.getElementById("indiceEdicion").value      = index;
        panelRegistro.classList.remove("hidden");
    };

    // --- 9. ELIMINAR ---
    window.eliminarMateria = async (index) => {
    cerrarTodosLosMenus();
    if (confirm("¿Eliminar esta materia?")) {
        await fetch("http://127.0.0.1:5000/api/materias", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Id_Materia: todasLasMaterias[index].id_materia
            })
        });

        await obtenerMaterias();
        renderizar();
    }
};

    iniciar();
});