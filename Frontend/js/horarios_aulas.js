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
    let todasLasAulas = [];

    async function cargarAulas() {

        try {

            const respuesta = await fetch("https://semaforo-de-alerta-f2kf.onrender.com/api/aulas");
            const resultado = await respuesta.json();

            if (resultado.success) {

                const colores = [
                    "bg-rosa",
                    "bg-azul",
                    "bg-amarillo",
                    "bg-verde",
                    "bg-naranja",
                    "bg-morado",
                    "bg-azul_claro",
                    "bg-cafe"
                ];

                todasLasAulas = resultado.data.map((aula, index) => ({
                    id: aula.Id_Aula,
                    nombre: aula.Nombre,
                    color: colores[index % colores.length]
                }));

            // NUEVO: ordenar por ID ascendente (1, 2, 3... 29)
            todasLasAulas.sort((a, b) => a.id - b.id);

                renderizar();

            }
        } catch (error) {

            console.error(error);

        }

    }

    // --- 3. PANEL ---
    const panelRegistro    = document.getElementById("panelRegistro");
    const btnNuevo         = document.querySelector(".btn-nuevo");
    const btnGuardar       = document.getElementById("btnGuardar");
    const btnCancelarPanel = document.getElementById("btnCancelar");

    // Solo aparece al presionar + Nueva aula
    btnNuevo.addEventListener("click", async () => {
        cerrarTodosLosMenus();
        document.getElementById("indiceEdicion").value  = "-1";
        document.getElementById("inputNombreAula").value = "";
        document.getElementById("inputIdAula").value    = "";
        panelRegistro.classList.remove("hidden");

        // Mostrar el siguiente ID disponible (solo informativo, el backend lo recalcula al guardar)
        try {
            const respuesta = await fetch("https://semaforo-de-alerta-f2kf.onrender.com/api/aulas/siguiente-id");
            const resultado = await respuesta.json();
            if (resultado.success) {
                document.getElementById("inputIdAula").value = resultado.siguiente_id;
            }
        } catch (error) {
            console.error(error);
        }
    });

    btnCancelarPanel.addEventListener("click", () => {
        panelRegistro.classList.add("hidden");
        document.getElementById("indiceEdicion").value = "-1";
    });

    btnGuardar.addEventListener("click", async () => {

        const indice = parseInt(document.getElementById("indiceEdicion").value);
        const nombre = document.getElementById("inputNombreAula").value.trim();
        const id = parseInt(document.getElementById("inputIdAula").value);

        if (!nombre) {
            alert("Debes capturar el nombre del aula.");
            return;
        }

        // Registrar nueva aula
        if (indice == -1) {

            try {

                const respuesta = await fetch("https://semaforo-de-alerta-f2kf.onrender.com/api/aulas", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        nombre: nombre
                        // ya no se manda "id": el backend lo calcula solo (MAX + 1)
                    })

                });

                const resultado = await respuesta.json();

                if (resultado.success) {

                    alert("Aula registrada correctamente.");

                    panelRegistro.classList.add("hidden");

                    document.getElementById("inputNombreAula").value = "";
                    document.getElementById("inputIdAula").value = "";
                    document.getElementById("indiceEdicion").value = "-1";

                    await cargarAulas();

                } else {

                    alert(resultado.message);

                }

            } catch (error) {

                console.error(error);
                alert("Error al conectar con el servidor.");

            }

        // Editar aula existente
        } else {

            try {

                const respuesta = await fetch(`https://semaforo-de-alerta-f2kf.onrender.com/api/aulas/${id}`, {

                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        nombre: nombre
                    })

                });

                const resultado = await respuesta.json();

                if (resultado.success) {

                    alert("Aula actualizada correctamente.");

                    panelRegistro.classList.add("hidden");

                    document.getElementById("indiceEdicion").value = "-1";

                    await cargarAulas();

                } else {

                    alert(resultado.message);

                }

            } catch (error) {

                console.error(error);

                alert("Error al actualizar.");

            }

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
                            <button class="btn-editar" onclick="window.abrirEditar(${idx})">✏️ Editar</button>
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
        const a = todasLasAulas[index];
        document.getElementById("inputNombreAula").value = a.nombre;
        document.getElementById("inputIdAula").value    = a.id;
        document.getElementById("indiceEdicion").value  = index;
        panelRegistro.classList.remove("hidden");
    };

    // --- 9. ELIMINAR ---
    window.eliminarAula = async (index) => {

        cerrarTodosLosMenus();

        if (!confirm("¿Eliminar esta aula?")) return;

        const aula = todasLasAulas[index];

        try {

            const respuesta = await fetch(`https://semaforo-de-alerta-f2kf.onrender.com/api/aulas/${aula.id}`, {
                method: "DELETE"
            });

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Aula eliminada.");

                await cargarAulas();

            } else {

                alert(resultado.message);

            }

        } catch (error) {

            console.error(error);

            alert("Error al eliminar.");

        }

    };

    cargarAulas();

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
