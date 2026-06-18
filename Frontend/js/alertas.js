function ejecutarComando(comando) {
    document.execCommand(comando, false, null);
    document.getElementById('mensajeEditor').focus();
}

function insertarEnlace() {
    abrirModal('enlace');
}

function insertarImagen() {
    abrirModal('imagen');
}

function abrirModal(tipo) {
    const modal = document.getElementById('modalEditor');
    const titulo = document.getElementById('modalTitulo');
    const inputArchivo = document.getElementById('modalInputArchivo');
    const inputUrl = document.getElementById('modalInputUrl');
    const seccionArchivo = document.getElementById('seccionArchivo');
    const seccionUrl = document.getElementById('seccionUrl');

    modal.dataset.tipo = tipo;

    if (tipo === 'imagen') {
        titulo.textContent = 'Insertar imagen';
        seccionArchivo.style.display = 'block';
        seccionUrl.style.display = 'block';
        inputUrl.placeholder = 'https://ejemplo.com/imagen.png';
        inputArchivo.accept = 'image/*';
    } else {
        titulo.textContent = 'Insertar enlace';
        seccionArchivo.style.display = 'none';
        seccionUrl.style.display = 'block';
        inputUrl.placeholder = 'https://ejemplo.com';
    }

    inputUrl.value = '';
    inputArchivo.value = '';
    document.getElementById('previewImagen').style.display = 'none';
    modal.style.display = 'flex';
    inputUrl.focus();
}

function cerrarModal() {
    document.getElementById('modalEditor').style.display = 'none';
}

function confirmarModal() {
    const modal = document.getElementById('modalEditor');
    const tipo = modal.dataset.tipo;
    const inputUrl = document.getElementById('modalInputUrl');
    const inputArchivo = document.getElementById('modalInputArchivo');

    if (tipo === 'imagen') {
        if (inputArchivo.files && inputArchivo.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('mensajeEditor').focus();
                document.execCommand("insertImage", false, e.target.result);
            };
            reader.readAsDataURL(inputArchivo.files[0]);
        } else if (inputUrl.value.trim()) {
            document.getElementById('mensajeEditor').focus();
            document.execCommand("insertImage", false, inputUrl.value.trim());
        }
    } else {
        if (inputUrl.value.trim()) {
            document.getElementById('mensajeEditor').focus();
            document.execCommand("createLink", false, inputUrl.value.trim());
        }
    }
    cerrarModal();
}

document.getElementById('modalInputArchivo').addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('previewImagen');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(this.files[0]);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const btnHamburguesa = document.getElementById("btnHamburguesa");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const btnCerrarSidebar = document.getElementById("btnCerrarSidebar");

    const btnVerde = document.getElementById("btnVerde");
    const btnAmarillo = document.getElementById("btnAmarillo");
    const btnRojo = document.getElementById("btnRojo");

    const radiosAlcance = document.querySelectorAll('input[name="alcance"]');
    const selectGrupo = document.getElementById("selectGrupo");
    const radiosProgramacion = document.querySelectorAll('input[name="programacion"]');
    const bloqueProgramar = document.getElementById("bloqueProgramar");

    const resumenTipo = document.getElementById("resumenTipo");
    const resumenAlcance = document.getElementById("resumenAlcance");
    const resumenEnvio = document.getElementById("resumenEnvio");
    const resumenDestinatarios = document.getElementById("resumenDestinatarios");
    const resumenTotal = document.getElementById("resumenTotal");

    const checkboxesDestinatarios = document.querySelectorAll('input[name="destinatarios"]');
    const btnDropdownVars = document.getElementById("btnDropdownVars");
    const menuDesplegableVars = document.getElementById("menuDesplegableVars");
    const asuntoNotificacion = document.getElementById("asuntoNotificacion");
    const mensajeEditor = document.getElementById("mensajeEditor");

    let ultimoElementoEnfocado = mensajeEditor;
    asuntoNotificacion.addEventListener("focus", () => ultimoElementoEnfocado = asuntoNotificacion);
    mensajeEditor.addEventListener("focus", () => ultimoElementoEnfocado = mensajeEditor);

    btnDropdownVars.addEventListener("click", (e) => {
        e.stopPropagation();
        menuDesplegableVars.classList.toggle("show");
    });

    document.addEventListener("click", () => menuDesplegableVars.classList.remove("show"));

    menuDesplegableVars.querySelectorAll("li").forEach(item => {
        item.addEventListener("click", function() {
            const variable = this.getAttribute("data-variable");
            if (ultimoElementoEnfocado === asuntoNotificacion) {
                const startPos = asuntoNotificacion.selectionStart;
                const endPos = asuntoNotificacion.selectionEnd;
                const textoPrevio = asuntoNotificacion.value;
                asuntoNotificacion.value = textoPrevio.substring(0, startPos) + variable + textoPrevio.substring(endPos);
                asuntoNotificacion.focus();
            } else {
                mensajeEditor.focus();
                const seleccion = window.getSelection();
                if (seleccion.getRangeAt && seleccion.rangeCount) {
                    const rango = seleccion.getRangeAt(0);
                    rango.deleteContents();
                    const nodoTexto = document.createTextNode(variable);
                    rango.insertNode(nodoTexto);
                    rango.setStartAfter(nodoTexto);
                    rango.setEndAfter(nodoTexto);
                    seleccion.removeAllRanges();
                    seleccion.addRange(rango);
                }
            }
            menuDesplegableVars.classList.remove("show");
        });
    });

    btnHamburguesa.addEventListener("click", () => sidebarOverlay.classList.add("open"));
    btnCerrarSidebar.addEventListener("click", () => sidebarOverlay.classList.remove("open"));
    sidebarOverlay.addEventListener("click", (e) => { if (e.target === sidebarOverlay) sidebarOverlay.classList.remove("open"); });

    function limpiarEstadosSemaforicos() {
        btnVerde.classList.remove("active-verde");
        btnAmarillo.classList.remove("active-amarillo");
        btnRojo.classList.remove("active-rojo");
    }

    btnVerde.addEventListener("click", () => {
        limpiarEstadosSemaforicos();
        btnVerde.classList.add("active-verde");
        resumenTipo.textContent = "Regulares";
    });
    btnAmarillo.addEventListener("click", () => {
        limpiarEstadosSemaforicos();
        btnAmarillo.classList.add("active-amarillo");
        resumenTipo.textContent = "En Riesgo";
    });
    btnRojo.addEventListener("click", () => {
        limpiarEstadosSemaforicos();
        btnRojo.classList.add("active-rojo");
        resumenTipo.textContent = "Riesgo Crítico";
    });

    radiosAlcance.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "especifico") {
                selectGrupo.disabled = false;
                resumenAlcance.textContent = selectGrupo.value ? `Grupo: ${selectGrupo.value.toUpperCase()}` : "Grupo no elegido";
            } else {
                selectGrupo.disabled = true;
                resumenAlcance.textContent = "Todos los grupos";
            }
        });
    });

    selectGrupo.addEventListener("change", (e) => {
        if (!selectGrupo.disabled && e.target.value) {
            resumenAlcance.textContent = `Grupo: ${e.target.value.toUpperCase()}`;
        }
    });

    radiosProgramacion.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "programar") {
                bloqueProgramar.style.opacity = "1";
                bloqueProgramar.style.pointerEvents = "auto";
                resumenEnvio.textContent = "Planificado";
            } else {
                bloqueProgramar.style.opacity = "0.5";
                bloqueProgramar.style.pointerEvents = "none";
                resumenEnvio.textContent = "Inmediato";
            }
        });
    });

    checkboxesDestinatarios.forEach(check => {
        check.addEventListener("change", () => {
            const parentLabel = check.parentElement;
            if (check.checked) parentLabel.classList.add("is-selected");
            else parentLabel.classList.remove("is-selected");

            const seleccionados = [];
            checkboxesDestinatarios.forEach(c => { if (c.checked) seleccionados.push(c.parentNode.textContent.trim()); });
            resumenDestinatarios.textContent = seleccionados.length > 0 ? seleccionados.join(", ") : "0 seleccionados";
            resumenTotal.textContent = seleccionados.length * 125;
        });
    });

    document.getElementById("btnEnviarAlerta").addEventListener("click", () => {
        alert("¡Notificaciones procesadas!\nContenido listo para envío.");
    });

    document.getElementById("btnVistaPrevia").addEventListener("click", () => {
        alert("Abriendo panel de previsualización adaptativa...");
    });
});