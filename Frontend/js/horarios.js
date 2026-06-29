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

    // --- 2. DATOS ---
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

    // Almacén: clave "hora|dia" → { materia, docente, aula, color }
    const clases = {};

    // Mapa de celdas DOM para poder actualizarlas: key → elemento div
    const mapaCeldas = {};

    // --- 3. GENERAR CELDAS ---
    const grid = document.getElementById("gridHorarios");

    horas.forEach((hora) => {
        // Celda de hora
        const celdaHora = document.createElement("div");
        celdaHora.className   = "celda-hora";
        celdaHora.textContent = hora;
        grid.appendChild(celdaHora);

        // 5 celdas de días
        dias.forEach((dia) => {
            const key   = `${hora}|${dia}`;
            const celda = document.createElement("div");
            celda.className   = "celda-btn";
            celda.textContent = "+";
            celda.addEventListener("click", () => abrirPanel(hora, dia, key));
            grid.appendChild(celda);
            mapaCeldas[key] = celda;
        });
    });

    // --- 4. PANEL ---
    const panel       = document.getElementById("panelNuevaClase");
    const panelInfo   = document.getElementById("panelInfo");
    const selMateria  = document.getElementById("selectMateria");
    const selDocente  = document.getElementById("selectDocente");
    const selAula     = document.getElementById("selectAula");
    const btnCancelar = document.getElementById("btnCancelarClase");
    const btnGuardar  = document.getElementById("btnGuardarClase");

    let keyActual = null;

    function abrirPanel(hora, dia, key) {
        keyActual = key;
        panelInfo.textContent = `Has seleccionado: ${dia} ${hora}`;

        // Precargar si ya hay clase asignada
        const c      = clases[key];
        selMateria.value = c ? c.materia : "";
        selDocente.value = c ? c.docente : "";
        selAula.value    = c ? c.aula    : "";

        panel.classList.remove("hidden");
    }

    btnCancelar.addEventListener("click", () => {
        panel.classList.add("hidden");
        keyActual = null;
    });

    btnGuardar.addEventListener("click", () => {
        if (!keyActual) return;

        const materia = selMateria.value;
        const docente = selDocente.value;
        const aula    = selAula.value;

        if (!materia) { alert("Selecciona una materia."); return; }

        // Mantener color si ya existía, o asignar uno nuevo
        const color = clases[keyActual]?.color
            || coloresClase[Math.floor(Math.random() * coloresClase.length)];

        clases[keyActual] = { materia, docente, aula, color };

        // Actualizar la celda en el grid
        actualizarCelda(keyActual);

        panel.classList.add("hidden");
        keyActual = null;
    });

    // Actualiza el aspecto de una celda según su estado en `clases`
    function actualizarCelda(key) {
        const celda = mapaCeldas[key];
        if (!celda) return;

        const c = clases[key];
        if (c) {
            // Celda con clase asignada
            celda.className             = "celda-clase";
            celda.style.backgroundColor = c.color;
            celda.innerHTML             = `<span title="${c.docente} · ${c.aula}">${c.materia}</span>`;
        } else {
            // Celda vacía
            celda.className             = "celda-btn";
            celda.style.backgroundColor = "";
            celda.textContent           = "+";
        }
    }
});