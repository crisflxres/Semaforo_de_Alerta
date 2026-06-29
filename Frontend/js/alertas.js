function ejecutarComando(comando) {
    document.execCommand(comando, false, null);

    const mensajeEditor = document.getElementById('mensajeEditor');
    if (mensajeEditor) mensajeEditor.focus();
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
    const previewImagen = document.getElementById('previewImagen');

    if (!modal || !titulo || !inputArchivo || !inputUrl || !seccionArchivo || !seccionUrl) return;

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

    if (previewImagen) {
        previewImagen.src = '';
        previewImagen.style.display = 'none';
    }

    modal.style.display = 'flex';
    inputUrl.focus();
}

function cerrarModal() {
    const modal = document.getElementById('modalEditor');
    if (modal) modal.style.display = 'none';
}

function confirmarModal() {
    const modal = document.getElementById('modalEditor');
    const inputUrl = document.getElementById('modalInputUrl');
    const inputArchivo = document.getElementById('modalInputArchivo');
    const mensajeEditor = document.getElementById('mensajeEditor');

    if (!modal || !inputUrl || !inputArchivo || !mensajeEditor) return;

    const tipo = modal.dataset.tipo;

    if (tipo === 'imagen') {
        if (inputArchivo.files && inputArchivo.files[0]) {
            const reader = new FileReader();

            reader.onload = (e) => {
                mensajeEditor.focus();
                document.execCommand('insertImage', false, e.target.result);
            };

            reader.readAsDataURL(inputArchivo.files[0]);
        } else if (inputUrl.value.trim()) {
            mensajeEditor.focus();
            document.execCommand('insertImage', false, inputUrl.value.trim());
        }
    } else {
        if (inputUrl.value.trim()) {
            mensajeEditor.focus();
            document.execCommand('createLink', false, inputUrl.value.trim());
        }
    }

    cerrarModal();
}

document.addEventListener('DOMContentLoaded', () => {
    const btnHamburguesa = document.getElementById('btnHamburguesa');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const btnCerrarSidebar = document.getElementById('btnCerrarSidebar');

    const avatarUsuario = document.getElementById('avatarUsuario');
    const dropdownPerfil = document.getElementById('dropdownPerfil');

    const btnVerde = document.getElementById('btnVerde');
    const btnAmarillo = document.getElementById('btnAmarillo');
    const btnRojo = document.getElementById('btnRojo');

    const radiosAlcance = document.querySelectorAll('input[name="alcance"]');
    const selectGrupo = document.getElementById('selectGrupo');
    const radiosProgramacion = document.querySelectorAll('input[name="programacion"]');
    const bloqueProgramar = document.getElementById('bloqueProgramar');

    const resumenTipo = document.getElementById('resumenTipo');
    const resumenAlcance = document.getElementById('resumenAlcance');
    const resumenEnvio = document.getElementById('resumenEnvio');
    const resumenDestinatarios = document.getElementById('resumenDestinatarios');
    const resumenTotal = document.getElementById('resumenTotal');

    const checkboxesDestinatarios = document.querySelectorAll('input[name="destinatarios"]');
    const btnDropdownVars = document.getElementById('btnDropdownVars');
    const menuDesplegableVars = document.getElementById('menuDesplegableVars');
    const asuntoNotificacion = document.getElementById('asuntoNotificacion');
    const mensajeEditor = document.getElementById('mensajeEditor');
    const inputArchivo = document.getElementById('modalInputArchivo');
    const previewImagen = document.getElementById('previewImagen');

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', (e) => {
            e.preventDefault();

            localStorage.removeItem('rolUsuario');
            localStorage.removeItem('nombreUsuario');

            window.location.href = 'index.html';
        });
    }

    if (inputArchivo) {
        inputArchivo.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    if (previewImagen) {
                        previewImagen.src = e.target.result;
                        previewImagen.style.display = 'block';
                    }
                };

                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    if (avatarUsuario && dropdownPerfil) {
        avatarUsuario.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menuDesplegableVars) menuDesplegableVars.classList.remove('show');
            dropdownPerfil.classList.toggle('show');
        });
    }

    let ultimoElementoEnfocado = mensajeEditor;

    if (asuntoNotificacion) {
        asuntoNotificacion.addEventListener('focus', () => {
            ultimoElementoEnfocado = asuntoNotificacion;
        });
    }

    if (mensajeEditor) {
        mensajeEditor.addEventListener('focus', () => {
            ultimoElementoEnfocado = mensajeEditor;
        });
    }

    if (btnDropdownVars && menuDesplegableVars) {
        btnDropdownVars.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdownPerfil) dropdownPerfil.classList.remove('show');
            menuDesplegableVars.classList.toggle('show');
        });
    }

    document.addEventListener('click', () => {
        if (menuDesplegableVars) menuDesplegableVars.classList.remove('show');
        if (dropdownPerfil) dropdownPerfil.classList.remove('show');
    });

    if (menuDesplegableVars) {
        menuDesplegableVars.querySelectorAll('li').forEach((item) => {
            item.addEventListener('click', function () {
                const variable = this.getAttribute('data-variable');

                if (ultimoElementoEnfocado === asuntoNotificacion && asuntoNotificacion) {
                    const startPos = asuntoNotificacion.selectionStart;
                    const endPos = asuntoNotificacion.selectionEnd;
                    const textoPrevio = asuntoNotificacion.value;

                    asuntoNotificacion.value =
                        textoPrevio.substring(0, startPos) +
                        variable +
                        textoPrevio.substring(endPos);

                    asuntoNotificacion.focus();
                } else if (mensajeEditor) {
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

                menuDesplegableVars.classList.remove('show');
            });
        });
    }

    if (btnHamburguesa && sidebarOverlay) {
        btnHamburguesa.addEventListener('click', () => {
            sidebarOverlay.classList.add('open');
        });
    }

    if (btnCerrarSidebar && sidebarOverlay) {
        btnCerrarSidebar.addEventListener('click', () => {
            sidebarOverlay.classList.remove('open');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', (e) => {
            if (e.target === sidebarOverlay) {
                sidebarOverlay.classList.remove('open');
            }
        });
    }

    function limpiarEstadosSemaforicos() {
        if (btnVerde) btnVerde.classList.remove('active-verde');
        if (btnAmarillo) btnAmarillo.classList.remove('active-amarillo');
        if (btnRojo) btnRojo.classList.remove('active-rojo');
    }

    if (btnVerde) {
        btnVerde.addEventListener('click', () => {
            limpiarEstadosSemaforicos();
            btnVerde.classList.add('active-verde');
            if (resumenTipo) resumenTipo.textContent = 'Regulares';
        });
    }

    if (btnAmarillo) {
        btnAmarillo.addEventListener('click', () => {
            limpiarEstadosSemaforicos();
            btnAmarillo.classList.add('active-amarillo');
            if (resumenTipo) resumenTipo.textContent = 'En Riesgo';
        });
    }

    if (btnRojo) {
        btnRojo.addEventListener('click', () => {
            limpiarEstadosSemaforicos();
            btnRojo.classList.add('active-rojo');
            if (resumenTipo) resumenTipo.textContent = 'Riesgo Crítico';
        });
    }

    radiosAlcance.forEach((radio) => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'especifico') {
                if (selectGrupo) selectGrupo.disabled = false;

                if (resumenAlcance && selectGrupo) {
                    resumenAlcance.textContent = selectGrupo.value
                        ? `Grupo: ${selectGrupo.value.toUpperCase()}`
                        : 'Grupo no elegido';
                }
            } else {
                if (selectGrupo) selectGrupo.disabled = true;
                if (resumenAlcance) resumenAlcance.textContent = 'Todos los grupos';
            }
        });
    });

    if (selectGrupo) {
        selectGrupo.addEventListener('change', (e) => {
            if (!selectGrupo.disabled && e.target.value && resumenAlcance) {
                resumenAlcance.textContent = `Grupo: ${e.target.value.toUpperCase()}`;
            }
        });
    }

    radiosProgramacion.forEach((radio) => {
        radio.addEventListener('change', (e) => {
            if (!bloqueProgramar) return;

            if (e.target.value === 'programar') {
                bloqueProgramar.style.opacity = '1';
                bloqueProgramar.style.pointerEvents = 'auto';
                if (resumenEnvio) resumenEnvio.textContent = 'Planificado';
            } else {
                bloqueProgramar.style.opacity = '0.5';
                bloqueProgramar.style.pointerEvents = 'none';
                if (resumenEnvio) resumenEnvio.textContent = 'Inmediato';
            }
        });
    });

    checkboxesDestinatarios.forEach((check) => {
        check.addEventListener('change', () => {
            const parentLabel = check.parentElement;

            if (check.checked) {
                parentLabel.classList.add('is-selected');
            } else {
                parentLabel.classList.remove('is-selected');
            }

            const seleccionados = [];

            checkboxesDestinatarios.forEach((c) => {
                if (c.checked) {
                    const textoLimpio = c.parentNode.textContent.replace(/\s+/g, ' ').trim();
                    seleccionados.push(textoLimpio);
                }
            });

            if (resumenDestinatarios) {
                resumenDestinatarios.textContent =
                    seleccionados.length > 0 ? seleccionados.join(', ') : '0 seleccionados';
            }

            if (resumenTotal) {
                resumenTotal.textContent = seleccionados.length * 125;
            }
        });
    });

    const btnEnviarAlerta = document.getElementById('btnEnviarAlerta');

    if (btnEnviarAlerta) {
        btnEnviarAlerta.addEventListener('click', () => {
            alert('¡Notificaciones procesadas!\nContenido listo para envío.');
        });
    }

    const btnVistaPrevia = document.getElementById('btnVistaPrevia');

    if (btnVistaPrevia) {
        btnVistaPrevia.addEventListener('click', () => {
            alert('Abriendo panel de previsualización adaptativa...');
        });
    }
});