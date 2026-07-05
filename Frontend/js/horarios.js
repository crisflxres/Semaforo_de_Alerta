// Ajusta esto si tu backend corre en otra IP/puerto
const API_BASE = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {

    // --- 1. MENÚ LATERAL ---
    const sidebar   = document.getElementById("sidebarOverlay");
    const btnAbrir  = document.getElementById("btnHamburguesa");
    const btnCerrar = document.getElementById("btnCerrarSidebar");
    if (btnAbrir && sidebar && btnCerrar) {
        btnAbrir.addEventListener("click",  () => sidebar.classList.add("open"));
        btnCerrar.addEventListener("click", () => sidebar.classList.remove("open"));
        sidebar.addEventListener("click", (e) => { if (e.target === sidebar) sidebar.classList.remove("open"); });
    }

    // --- 2. DATOS BASE DE LA CUADRÍCULA ---
    const horas = [
        "07:00 - 8:00", "8:00 - 9:00", "9:00 - 10:00", "10:00 - 11:00",
        "11:00 - 12:00", "12:50 - 13:40", "13:40 - 14:30", "14:30 - 15:20",
        "15:20 - 16:10", "16:10 - 17:00", "17:15 - 18:05", "18:05 - 18:55",
        "18:55 - 19:45", "19:45 - 20:35"
    ];
    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    const coloresClase = [
        "#bbdefb", "#c8e6c9", "#e1bee7", "#b2ebf2",
        "#ffe0b2", "#fce4ec", "#fff9c4", "#dcedc8"
    ];

    // Almacén: clave "hora|dia|grupo|materia" -> { materia, docente, grupo, aula, color, ids:{...} }
    // (varias clases pueden compartir el mismo hora|dia si son de grupos distintos)
    const clases = {};

    // Mapa de celdas DOM: keyBase "hora|dia" -> elemento div
    const mapaCeldas = {};

    // Qué keyReal se está mostrando actualmente en cada celda (según los filtros activos)
    // keyBase "hora|dia" -> keyReal completa o null
    const celdaVisible = {};

    // --- 3. GENERAR CELDAS ---
    const grid = document.getElementById("gridHorarios");

    horas.forEach((hora) => {
        const celdaHora = document.createElement("div");
        celdaHora.className   = "celda-hora";
        celdaHora.textContent = hora;
        grid.appendChild(celdaHora);

        dias.forEach((dia) => {
            const key   = `${hora}|${dia}`;
            const celda = document.createElement("div");
            celda.className   = "celda-btn";
            celda.textContent = "+";

            // Clic simple = abrir panel (lista + formulario). Doble clic = nota de la materia.
            let clickTimer = null;
            celda.addEventListener("click", () => {
                if (clickTimer) return;
                clickTimer = setTimeout(() => {
                    clickTimer = null;
                    abrirPanel(hora, dia, key);
                }, 250);
            });
            celda.addEventListener("dblclick", () => {
                clearTimeout(clickTimer);
                clickTimer = null;
                const keyReal = celdaVisible[key];
                if (keyReal && clases[keyReal]) {
                    mostrarNotaMateria(clases[keyReal].ids.Id_Materia, celda);
                }
            });

            grid.appendChild(celda);
            mapaCeldas[key] = celda;
            celdaVisible[key] = null;
        });
    });

    // --- 4. HELPERS DE HORA ---
    function normalizarHora(t) {
        let [hh, mm] = t.trim().split(":");
        hh = hh.padStart(2, "0");
        return `${hh}:${mm}`;
    }

    function rangoAHoraSQL(rango) {
        const [inicio, fin] = rango.split(" - ");
        return {
            inicio: `${normalizarHora(inicio)}:00`,
            fin: `${normalizarHora(fin)}:00`
        };
    }

    function labelDesdeHoraSQL(horaInicioSQL) {
        const horaCorta = normalizarHora(horaInicioSQL.slice(0, 5));
        return horas.find(h => normalizarHora(h.split(" - ")[0]) === horaCorta);
    }

    // --- 5. REFERENCIAS DEL PANEL ---
    const panel       = document.getElementById("panelNuevaClase");
    const panelInfo   = document.getElementById("panelInfo");
    const listaEl     = document.getElementById("listaClasesExistentes");
    const selMateria  = document.getElementById("selectMateria");
    const selDocente  = document.getElementById("selectDocente");
    const selGrupo    = document.getElementById("selectGrupo");
    const selAula     = document.getElementById("selectAula");
    const btnCancelar = document.getElementById("btnCancelarClase");
    const btnGuardar  = document.getElementById("btnGuardarClase");

    const filtroDocente = document.getElementById("filtroDocente");
    const filtroGrupo   = document.getElementById("filtroGrupo");
    const filtroMateria = document.getElementById("filtroMateria");
    const filtroAula    = document.getElementById("filtroAula");

    let keyActual        = null;   // "hora|dia" del panel abierto
    let modoEdicion       = false;
    let idHorarioEditando = null;
    let keyRealEditando   = null;  // keyReal que se está editando (para borrarla del store al guardar)

    // --- 6. CARGA DE CATÁLOGOS REALES DESDE LA API ---

    function llenarSelect(selectEl, items, valueField, textFn, incluirPlaceholder = true) {
        selectEl.innerHTML = incluirPlaceholder ? '<option value="">Seleccionar...</option>' : "";
        items.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item[valueField];
            opt.textContent = textFn(item);
            selectEl.appendChild(opt);
        });
    }

    function llenarFiltro(selectEl, items, valueField, textFn) {
        selectEl.innerHTML = '<option value="">...</option>';
        items.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item[valueField];
            opt.textContent = textFn(item);
            selectEl.appendChild(opt);
        });
    }

    async function cargarCatalogos() {
        try {
            const [resDocentes, resGrupos, resMaterias, resAulas] = await Promise.all([
                fetch(`${API_BASE}/docentes`),
                fetch(`${API_BASE}/grupos`),
                fetch(`${API_BASE}/api/materias`),
                fetch(`${API_BASE}/api/aulas`)
            ]);

            const docentes = (await resDocentes.json()).data || [];
            const grupos   = (await resGrupos.json()).data || [];
            const materias = await resMaterias.json(); // /api/materias devuelve un array plano
            const aulas    = (await resAulas.json()).data || [];

            const textoDocente = d => `${d.Nombre} ${d.Apellidos}`;

            llenarSelect(selDocente, docentes, "Id_Usuario", textoDocente);
            llenarSelect(selGrupo,   grupos,   "Id_Grupo",   g => g.Nombre);
            llenarSelect(selMateria, materias, "Id_Materia", m => m.Nombre);
            llenarSelect(selAula,    aulas,    "Id_Aula",    a => a.Nombre);

            llenarFiltro(filtroDocente, docentes, "Id_Usuario", textoDocente);
            llenarFiltro(filtroGrupo,   grupos,   "Id_Grupo",   g => g.Nombre);
            llenarFiltro(filtroMateria, materias, "Id_Materia", m => m.Nombre);
            llenarFiltro(filtroAula,    aulas,    "Id_Aula",    a => a.Nombre);
        } catch (err) {
            console.error("Error cargando catálogos:", err);
            alert("No se pudieron cargar los datos del servidor. Verifica que el backend (Flask) esté corriendo.");
        }
    }

    // --- 7. CARGA DE CLASES YA REGISTRADAS ---
    async function cargarHorarios() {
        try {
            const res = await fetch(`${API_BASE}/api/horarios`);
            const json = await res.json();
            if (!json.success) return;

            Object.keys(clases).forEach(k => delete clases[k]);

            json.data.forEach(h => {
                const label = labelDesdeHoraSQL(h.Hora_Inicio);
                if (!label) return;
                const key = `${label}|${h.Dia_Semana}|${h.Id_Grupo}|${h.Id_Materia}`;

                clases[key] = {
                    materia: h.Materia,
                    docente: h.Docente,
                    grupo: h.Grupo,
                    aula: h.Aula,
                    color: coloresClase[Math.floor(Math.random() * coloresClase.length)],
                    ids: {
                        Id_Horario: h.Id_Horario,
                        Id_Usuario: h.Id_Usuario,
                        Id_Grupo: h.Id_Grupo,
                        Id_Materia: h.Id_Materia,
                        Id_Aula: h.Id_Aula
                    }
                };
            });

            aplicarFiltros();
        } catch (err) {
            console.error("Error cargando horarios:", err);
        }
    }

    // --- 8. LISTA DE CLASES EXISTENTES EN EL PANEL (editar / eliminar) ---

    function clasesDeEsteHorario(keyBase) {
        return Object.keys(clases)
            .filter(k => k.startsWith(`${keyBase}|`))
            .map(k => ({ keyReal: k, info: clases[k] }));
    }

    function renderListaExistentes(keyBase) {
        const items = clasesDeEsteHorario(keyBase);

        if (items.length === 0) {
            listaEl.innerHTML = "";
            return;
        }

        listaEl.innerHTML = `
            <div class="lista-existente-titulo">Clases ya registradas en este horario:</div>
            ${items.map(({ keyReal, info }) => `
                <div class="fila-existente" data-key="${keyReal}">
                    <div class="fila-existente-info">
                        <strong>${info.materia}</strong>
                        <span>${info.docente} · ${info.grupo} · ${info.aula}</span>
                    </div>
                    <div class="fila-existente-acciones">
                        <button type="button" class="btn-fila-editar">Editar</button>
                        <button type="button" class="btn-fila-eliminar">Eliminar</button>
                    </div>
                </div>
            `).join("")}
        `;
    }

    listaEl.addEventListener("click", async (e) => {
        const fila = e.target.closest(".fila-existente");
        if (!fila) return;
        const keyReal = fila.dataset.key;
        const info = clases[keyReal];
        if (!info) return;

        if (e.target.classList.contains("btn-fila-editar")) {
            modoEdicion       = true;
            idHorarioEditando = info.ids.Id_Horario;
            keyRealEditando   = keyReal;

            selMateria.value = info.ids.Id_Materia;
            selDocente.value = info.ids.Id_Usuario;
            selGrupo.value   = info.ids.Id_Grupo;
            selAula.value    = info.ids.Id_Aula;

            btnGuardar.textContent = "Guardar cambios";
        }

        if (e.target.classList.contains("btn-fila-eliminar")) {
            if (!confirm(`¿Eliminar "${info.materia}" (${info.grupo})?`)) return;
            try {
                const res = await fetch(`${API_BASE}/api/horarios/${info.ids.Id_Horario}`, { method: "DELETE" });
                const json = await res.json();
                if (!json.success) {
                    alert(`No se pudo eliminar: ${json.message}`);
                    return;
                }
                // Recargamos todo desde la BD para no depender de la memoria local
                await cargarHorarios();
                renderListaExistentes(keyActual);
            } catch (err) {
                console.error("Error al eliminar:", err);
                alert("No se pudo conectar con el servidor.");
            }
        }
    });

    // --- 9. PANEL: ABRIR / CANCELAR / GUARDAR ---
    function abrirPanel(hora, dia, keyBase) {
        keyActual          = keyBase;
        modoEdicion        = false;
        idHorarioEditando  = null;
        keyRealEditando    = null;
        btnGuardar.textContent = "Guardar";

        panelInfo.textContent = `Has seleccionado: ${dia} ${hora}`;

        // Formulario limpio para registrar una clase nueva, precargando los filtros activos
        selMateria.value = "";
        selDocente.value = filtroDocente.value || "";
        selGrupo.value   = filtroGrupo.value   || "";
        selAula.value    = filtroAula.value    || "";

        renderListaExistentes(keyBase);
        panel.classList.remove("hidden");
    }

    btnCancelar.addEventListener("click", () => {
        panel.classList.add("hidden");
        keyActual          = null;
        modoEdicion        = false;
        idHorarioEditando  = null;
        keyRealEditando    = null;
    });

    btnGuardar.addEventListener("click", async () => {
        if (!keyActual) return;

        const idMateria = selMateria.value;
        const idDocente = selDocente.value;
        const idGrupo   = selGrupo.value;
        const idAula    = selAula.value;

        if (!idMateria || !idDocente || !idGrupo || !idAula) {
            alert("Completa Materia, Docente, Grupo y Aula.");
            return;
        }

        const [hora, dia] = keyActual.split("|");
        const { inicio, fin } = rangoAHoraSQL(hora);

        const payload = {
            Id_Usuario: idDocente,
            Id_Grupo: idGrupo,
            Id_Materia: idMateria,
            Dia_Semana: dia,
            Hora_Inicio: inicio,
            Hora_Fin: fin,
            Id_Aula: idAula
        };

        try {
            const url    = modoEdicion ? `${API_BASE}/api/horarios/${idHorarioEditando}` : `${API_BASE}/api/horarios`;
            const method = modoEdicion ? "PUT" : "POST";

            const res  = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (!json.success) {
                alert(`Error al guardar: ${json.message}`);
                return;
            }

            // Recargamos todo desde la BD: así el grid nunca puede quedar
            // mostrando datos viejos (ej. una materia editada que ya no debería
            // aparecer bajo la materia anterior).
            await cargarHorarios();

            aplicarFiltros();
            panel.classList.add("hidden");
            keyActual          = null;
            modoEdicion        = false;
            idHorarioEditando  = null;
            keyRealEditando    = null;
        } catch (err) {
            console.error("Error de red al guardar:", err);
            alert("No se pudo conectar con el servidor.");
        }
    });

    // --- 10. FILTRADO EN EL FRONTEND ---
    function aplicarFiltros() {
        const valDocente = filtroDocente.value;
        const valGrupo   = filtroGrupo.value;
        const valMateria = filtroMateria.value;
        const valAula    = filtroAula.value;

        Object.keys(mapaCeldas).forEach((keyBase) => {
            const celda = mapaCeldas[keyBase];

            const clasesEncontradas = Object.keys(clases).filter(keyReal => {
                if (!keyReal.startsWith(`${keyBase}|`)) return false;
                const infoClase = clases[keyReal];
                const cumpleDocente = valDocente === "" || String(infoClase.ids.Id_Usuario) === valDocente;
                const cumpleGrupo   = valGrupo   === "" || String(infoClase.ids.Id_Grupo)   === valGrupo;
                const cumpleMateria = valMateria === "" || String(infoClase.ids.Id_Materia) === valMateria;
                const cumpleAula    = valAula    === "" || String(infoClase.ids.Id_Aula)    === valAula;
                return cumpleDocente && cumpleGrupo && cumpleMateria && cumpleAula;
            });

            if (clasesEncontradas.length > 0) {
                const keyReal   = clasesEncontradas[0];
                const infoClase = clases[keyReal];
                celdaVisible[keyBase] = keyReal;

                celda.className             = "celda-clase";
                celda.style.backgroundColor = infoClase.color;
                celda.innerHTML             = `<span title="Docente: ${infoClase.docente} · Grupo: ${infoClase.grupo} · Aula: ${infoClase.aula}">${infoClase.materia}</span>`;
            } else {
                celdaVisible[keyBase] = null;
                celda.className             = "celda-btn";
                celda.style.backgroundColor = "";
                celda.textContent           = "+";
            }
        });
    }

    if (filtroDocente) filtroDocente.addEventListener("change", aplicarFiltros);
    if (filtroGrupo)   filtroGrupo.addEventListener("change", aplicarFiltros);
    if (filtroMateria) filtroMateria.addEventListener("change", aplicarFiltros);
    if (filtroAula)    filtroAula.addEventListener("change", aplicarFiltros);

    // --- 11. NOTA GENERAL DE LA MATERIA (doble clic) ---

    (function inyectarEstiloExtra() {
        if (document.getElementById("estilo-horarios-extra")) return;
        const style = document.createElement("style");
        style.id = "estilo-horarios-extra";
        style.textContent = `
            .lista-existente-titulo {
                font-size: 12px;
                font-weight: 600;
                color: #777;
                margin: 4px 0 8px;
            }
            .fila-existente {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
                padding: 8px 10px;
                border: 1px solid #eee;
                border-radius: 8px;
                margin-bottom: 6px;
                font-size: 13px;
            }
            .fila-existente-info { display: flex; flex-direction: column; }
            .fila-existente-info span { color: #888; font-size: 11px; }
            .fila-existente-acciones { display: flex; gap: 6px; }
            .fila-existente-acciones button {
                border: none;
                border-radius: 6px;
                padding: 4px 8px;
                font-size: 11px;
                cursor: pointer;
            }
            .btn-fila-editar { background: #f0e0e6; color: #a3123a; }
            .btn-fila-eliminar { background: #f8d7da; color: #842029; }

            .celda-clase {
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 6px 4px;
                overflow: hidden;
            }
            .celda-clase span {
                display: -webkit-box;
                -webkit-line-clamp: 4;
                -webkit-box-orient: vertical;
                overflow: hidden;
                word-break: break-word;
                font-size: 12px;
                line-height: 1.25;
                width: 100%;
            }

            .nota-materia-overlay {
                position: fixed;
                inset: 0;
                z-index: 999;
                background: transparent;
            }
            .nota-materia-card {
                position: absolute;
                z-index: 1000;
                width: 260px;
                background: #fff;
                border: 1px solid #e0d5d5;
                border-radius: 14px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.18);
                padding: 16px 18px;
                font-family: inherit;
            }
            .nota-materia-titulo {
                color: #a3123a;
                font-weight: 700;
                font-size: 15px;
                margin-bottom: 12px;
            }
            .nota-materia-fila { margin-bottom: 10px; font-size: 13px; line-height: 1.4; }
            .nota-materia-fila:last-child { margin-bottom: 0; }
            .nota-materia-label { font-weight: 600; color: #333; }
            .nota-materia-valor { color: #777; }
            .nota-materia-cerrar {
                position: absolute;
                top: 8px;
                right: 10px;
                cursor: pointer;
                color: #aaa;
                font-size: 16px;
                line-height: 1;
                background: none;
                border: none;
            }
            .nota-materia-cerrar:hover { color: #a3123a; }
        `;
        document.head.appendChild(style);
    })();

    function listaOGuion(arr) {
        return arr && arr.length ? arr.join(", ") : "—";
    }

    async function mostrarNotaMateria(idMateria, celdaEl) {
        cerrarNotaMateria();

        try {
            const res  = await fetch(`${API_BASE}/api/horarios/resumen-materia/${idMateria}`);
            const json = await res.json();
            if (!json.success) return;

            const d = json.data;

            const overlay = document.createElement("div");
            overlay.className = "nota-materia-overlay";
            overlay.addEventListener("click", cerrarNotaMateria);

            const card = document.createElement("div");
            card.className = "nota-materia-card";
            card.innerHTML = `
                <button class="nota-materia-cerrar" type="button">&times;</button>
                <div class="nota-materia-titulo">${d.materia}</div>
                <div class="nota-materia-fila">
                    <span class="nota-materia-label">Docente${d.docentes.length > 1 ? "s" : ""}:</span>
                    <span class="nota-materia-valor">${listaOGuion(d.docentes)}</span>
                </div>
                <div class="nota-materia-fila">
                    <span class="nota-materia-label">Grupo${d.grupos.length > 1 ? "s" : ""}:</span>
                    <span class="nota-materia-valor">${listaOGuion(d.grupos)}</span>
                </div>
                <div class="nota-materia-fila">
                    <span class="nota-materia-label">Aula${d.aulas.length > 1 ? "s" : ""}:</span>
                    <span class="nota-materia-valor">${listaOGuion(d.aulas)}</span>
                </div>
            `;
            card.querySelector(".nota-materia-cerrar").addEventListener("click", cerrarNotaMateria);
            card.addEventListener("click", (e) => e.stopPropagation());

            document.body.appendChild(overlay);
            document.body.appendChild(card);

            const rect = celdaEl.getBoundingClientRect();
            let left = rect.right + 10;
            let top  = rect.top;

            const anchoCard = 260;
            if (left + anchoCard > window.innerWidth - 10) {
                left = rect.left - anchoCard - 10;
            }
            if (top + 160 > window.innerHeight - 10) {
                top = window.innerHeight - 170;
            }

            card.style.left = `${Math.max(10, left)}px`;
            card.style.top  = `${Math.max(10, top)}px`;
        } catch (err) {
            console.error("Error cargando resumen de materia:", err);
        }
    }

    function cerrarNotaMateria() {
        document.querySelectorAll(".nota-materia-overlay, .nota-materia-card").forEach(el => el.remove());
    }

    // --- 12. INICIALIZAR ---
    (async function iniciar() {
        await cargarCatalogos();
        await cargarHorarios();
    })();
});