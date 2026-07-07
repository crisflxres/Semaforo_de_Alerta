// ── PLANTILLA GENERAL (aplica para los 3 niveles) ───────────────────────────
const PLANTILLA_GENERAL = {
    asunto: "Situación Académica de {alumno} - Estatus: {estatus}",
    mensaje: `Estimado(a) {destinatario}:

Por medio de la presente, le informamos sobre la situación académica del alumno(a) {alumno}, con matrícula {matricula}, perteneciente al grupo {grupo} de la carrera de {carrera}.

De acuerdo con los registros académicos, el estudiante mantiene actualmente un estatus académico {estatus}, con un Promedio de Aprovechamiento Académico (PAC) de {pac} y {reprobadas} materia(s) en situación de riesgo.

Le invitamos a dar seguimiento a esta información y, de ser necesario, mantener comunicación con la institución y los docentes correspondientes para favorecer el desempeño académico del estudiante.

Atentamente,
Coordinación Académica Institucional CECyTE Hidalgo`
};

function aplicarPlantilla() {
    const asunto = document.getElementById('asuntoNotificacion');
    const editor = document.getElementById('mensajeEditor');
    if (asunto) asunto.value = PLANTILLA_GENERAL.asunto;
    if (editor) editor.innerHTML = PLANTILLA_GENERAL.mensaje.replace(/\n/g, '<br>');
}

// ── EDITOR ───────────────────────────────────────────────────────────────────
function ejecutarComando(comando) {
    document.execCommand(comando, false, null);
    document.getElementById('mensajeEditor')?.focus();
}

function insertarEnlace() { abrirModal('enlace'); }
function insertarImagen() { abrirModal('imagen'); }

function abrirModal(tipo) {
    const modal = document.getElementById('modalEditor');
    const inputUrl = document.getElementById('modalInputUrl');
    const inputArchivo = document.getElementById('modalInputArchivo');
    if (!modal) return;
    modal.dataset.tipo = tipo;
    document.getElementById('modalTitulo').textContent = tipo === 'imagen' ? 'Insertar imagen' : 'Insertar enlace';
    document.getElementById('seccionArchivo').style.display = tipo === 'imagen' ? 'block' : 'none';
    inputUrl.placeholder = tipo === 'imagen' ? 'https://ejemplo.com/imagen.png' : 'https://ejemplo.com';
    inputUrl.value = '';
    inputArchivo.value = '';
    const preview = document.getElementById('previewImagen');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    modal.style.display = 'flex';
    inputUrl.focus();
}

function cerrarModal() {
    document.getElementById('modalEditor').style.display = 'none';
}

function confirmarModal() {
    const modal = document.getElementById('modalEditor');
    const inputUrl = document.getElementById('modalInputUrl');
    const inputArchivo = document.getElementById('modalInputArchivo');
    const editor = document.getElementById('mensajeEditor');
    if (!modal || !editor) return;

    const ESTILO_IMG = 'max-width:180px;max-height:180px;width:auto;height:auto;display:block;margin:16px auto 8px auto;border-radius:8px;border:1px solid #e0e0e0;';

  function insertarImagenConEstilo(src) {
    editor.focus();
    const img = document.createElement('img');
    img.src = src;
    img.setAttribute('style', ESTILO_IMG);
    editor.appendChild(img); // siempre al final, sin importar el cursor
}

    if (modal.dataset.tipo === 'imagen') {
        if (inputArchivo.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (e) => insertarImagenConEstilo(e.target.result);
            reader.readAsDataURL(inputArchivo.files[0]);
        } else if (inputUrl.value.trim()) {
            insertarImagenConEstilo(inputUrl.value.trim());
        }
    } else if (inputUrl.value.trim()) {
        editor.focus(); document.execCommand('createLink', false, inputUrl.value.trim());
    }
    cerrarModal();
}

// ── BD ───────────────────────────────────────────────────────────────────────
let nivelActual = null;
let resumenBD = [];

async function cargarGrupos() {
    try {
        const res = await fetch('http://127.0.0.1:5000/alertas/grupos');
        const data = await res.json();
        if (data.ok) {
            const select = document.getElementById('selectGrupo');
            select.innerHTML = '<option value="">-- Elige un grupo --</option>';
            data.datos.forEach(g => {
                select.innerHTML += `<option value="${g.Id_Grupo}">${g.Nombre}</option>`;
            });
        }
    } catch (e) { console.error('Error cargando grupos:', e); }
}

async function cargarResumen() {
    try {
        const res = await fetch('http://127.0.0.1:5000/alertas/resumen');
        const data = await res.json();
        if (data.ok) resumenBD = data.datos;
    } catch (e) { console.error('Error cargando resumen:', e); }
}

async function cargarHistorial() {
    try {
        const res = await fetch('http://127.0.0.1:5000/alertas/historial');
        const data = await res.json();
        const contenedor = document.querySelector('.lista-historial');
        if (!contenedor) return;

        if (!data.ok || data.datos.length === 0) {
            contenedor.innerHTML = '<p style="font-size:13px; color:#999; text-align:center;">Sin envíos registrados</p>';
            return;
        }

        contenedor.innerHTML = '';
        data.datos.slice(0, 3).forEach(item => {
            const colorEstado = item.Estado === 'Enviado' ? '#28a745' : '#dc3545';
            const fecha = new Date(item.Fecha_Enviado).toLocaleString('es-MX', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });
            const bloque = document.createElement('div');
            bloque.style.cssText = 'border:1px solid #e0e0e0; border-radius:6px; padding:10px 12px; background:#fafafa;';
            bloque.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:13px; font-weight:600; color:#333;">${item.Asunto}</span>
                    <span style="font-size:11px; font-weight:700; color:${colorEstado};">${item.Estado}</span>
                </div>
                <div style="font-size:12px; color:#888; margin-top:3px;">${item.Matricula} · ${item.Destinatario} · ${fecha}</div>
            `;
            contenedor.appendChild(bloque);
        });
    } catch (e) {
        console.error('Error cargando historial:', e);
    }
}

function actualizarTotal() {
    if (!nivelActual) return;
    const nivel = resumenBD.find(d => d.Nivel_Alerta === nivelActual);
    const checkboxes = document.querySelectorAll('input[name="destinatarios"]:checked');
    let total = 0;
    if (nivel) {
        checkboxes.forEach(c => {
            if (c.value === 'alumnos') total += nivel.Total_Alumnos;
            if (c.value === 'tutores') total += nivel.Total_Tutores;
            if (c.value === 'docentes') total += nivel.Total_Docentes;
        });
    }
    document.getElementById('resumenTotal').textContent = total;
}

async function abrirModalHistorial() {
    const modal = document.getElementById('modalHistorial');
    const lista = document.getElementById('listaHistorialCompleto');
    if (!modal || !lista) return;

    lista.innerHTML = '<p style="color:#888;">Cargando...</p>';
    modal.style.display = 'flex';

    try {
        const res = await fetch('http://127.0.0.1:5000/alertas/historial?completo=1');
        const data = await res.json();

        if (!data.ok || data.datos.length === 0) {
            lista.innerHTML = '<p style="color:#888;">No hay envíos registrados todavía.</p>';
            return;
        }

        lista.innerHTML = data.datos.map(item => `
            <div style="border-bottom:1px solid #eee; padding:10px 0;">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <strong style="font-size:14px;">${item.Asunto}</strong>
                    <span style="font-size:12px; font-weight:600; color:${item.Estado === 'Enviado' ? '#28a745' : '#dc3545'};">${item.Estado}</span>
                </div>
                <div style="font-size:12px; color:#888; margin-top:4px;">
                    ${item.Matricula} · ${item.Destinatario} · ${item.Fecha_Enviado}
                </div>
            </div>
        `).join('');
    } catch (e) {
        lista.innerHTML = '<p style="color:#dc3545;">Error al cargar el historial.</p>';
        console.error(e);
    }
}

function cerrarModalHistorial() {
    document.getElementById('modalHistorial').style.display = 'none';
}

// ── INICIO ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await cargarGrupos();
    await cargarResumen();
    await cargarHistorial();

    // Menú hamburguesa
    const overlay = document.getElementById('sidebarOverlay');
    document.getElementById('btnHamburguesa')?.addEventListener('click', () => overlay.classList.add('open'));
    document.getElementById('btnCerrarSidebar')?.addEventListener('click', () => overlay.classList.remove('open'));
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

    // Dropdown perfil
    const avatar = document.getElementById('avatarUsuario');
    const dropdown = document.getElementById('dropdownPerfil');
    const menuVars = document.getElementById('menuDesplegableVars');
    avatar?.addEventListener('click', (e) => { e.stopPropagation(); menuVars?.classList.remove('show'); dropdown?.classList.toggle('show'); });
    document.addEventListener('click', () => { dropdown?.classList.remove('show'); menuVars?.classList.remove('show'); });

    // Cerrar sesión
    document.getElementById('btnCerrarSesion')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('rolUsuario');
        localStorage.removeItem('nombreUsuario');
        window.location.href = 'index.html';
    });

    // Preview imagen modal
    document.getElementById('modalInputArchivo')?.addEventListener('change', function () {
        if (this.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (e) => { const p = document.getElementById('previewImagen'); if (p) { p.src = e.target.result; p.style.display = 'block'; } };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Variables en editor
    let ultimoFoco = document.getElementById('mensajeEditor');
    document.getElementById('asuntoNotificacion')?.addEventListener('focus', () => ultimoFoco = document.getElementById('asuntoNotificacion'));
    document.getElementById('mensajeEditor')?.addEventListener('focus', () => ultimoFoco = document.getElementById('mensajeEditor'));
    document.getElementById('btnDropdownVars')?.addEventListener('click', (e) => { e.stopPropagation(); dropdown?.classList.remove('show'); menuVars?.classList.toggle('show'); });
    menuVars?.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', function () {
            const variable = this.getAttribute('data-variable');
            const asunto = document.getElementById('asuntoNotificacion');
            const editor = document.getElementById('mensajeEditor');
            if (ultimoFoco === asunto) {
                const s = asunto.selectionStart, e2 = asunto.selectionEnd;
                asunto.value = asunto.value.substring(0, s) + variable + asunto.value.substring(e2);
                asunto.focus();
            } else {
                editor.focus();
                const sel = window.getSelection();
                if (sel.getRangeAt && sel.rangeCount) {
                    const r = sel.getRangeAt(0); r.deleteContents();
                    const t = document.createTextNode(variable); r.insertNode(t);
                    r.setStartAfter(t); r.setEndAfter(t);
                    sel.removeAllRanges(); sel.addRange(r);
                }
            }
            menuVars.classList.remove('show');
        });
    });

    // Semáforo
    function limpiarSemaforo() {
        ['btnVerde', 'btnAmarillo', 'btnRojo'].forEach(id => {
            document.getElementById(id)?.classList.remove('active-verde', 'active-amarillo', 'active-rojo');
        });
    }

    document.getElementById('btnVerde')?.addEventListener('click', () => {
        limpiarSemaforo(); document.getElementById('btnVerde').classList.add('active-verde');
        document.getElementById('resumenTipo').textContent = 'Regulares';
        nivelActual = 'Verde'; actualizarTotal();
        aplicarPlantilla();
    });

    document.getElementById('btnAmarillo')?.addEventListener('click', () => {
        limpiarSemaforo(); document.getElementById('btnAmarillo').classList.add('active-amarillo');
        document.getElementById('resumenTipo').textContent = 'En Riesgo';
        nivelActual = 'Amarillo'; actualizarTotal();
        aplicarPlantilla();
    });

    document.getElementById('btnRojo')?.addEventListener('click', () => {
        limpiarSemaforo(); document.getElementById('btnRojo').classList.add('active-rojo');
        document.getElementById('resumenTipo').textContent = 'Riesgo Crítico';
        nivelActual = 'Rojo'; actualizarTotal();
        aplicarPlantilla();
    });

    // Alcance
    document.querySelectorAll('input[name="alcance"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const select = document.getElementById('selectGrupo');
            const resumenAlcance = document.getElementById('resumenAlcance');
            if (e.target.value === 'especifico') {
                select.disabled = false;
                resumenAlcance.textContent = select.value ? `Grupo: ${select.value}` : 'Grupo no elegido';
            } else {
                select.disabled = true;
                resumenAlcance.textContent = 'Todos los grupos';
            }
        });
    });

    document.getElementById('selectGrupo')?.addEventListener('change', (e) => {
        const texto = e.target.options[e.target.selectedIndex].text;
        document.getElementById('resumenAlcance').textContent = `Grupo: ${texto}`;
    });

    // Programación
    document.querySelectorAll('input[name="programacion"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const bloque = document.getElementById('bloqueProgramar');
            const esProgramar = e.target.value === 'programar';
            bloque.style.opacity = esProgramar ? '1' : '0.5';
            bloque.style.pointerEvents = esProgramar ? 'auto' : 'none';
            document.getElementById('resumenEnvio').textContent = esProgramar ? 'Planificado' : 'Inmediato';
        });
    });

    // Destinatarios
    document.querySelectorAll('input[name="destinatarios"]').forEach(check => {
        check.addEventListener('change', () => {
            check.parentElement.classList.toggle('is-selected', check.checked);
            const seleccionados = [...document.querySelectorAll('input[name="destinatarios"]:checked')]
                .map(c => c.parentNode.textContent.trim());
            document.getElementById('resumenDestinatarios').textContent =
                seleccionados.length > 0 ? seleccionados.join(', ') : '0 seleccionados';
            actualizarTotal();
        });
    });

    // Enviar
    document.getElementById('btnEnviarAlerta')?.addEventListener('click', async () => {
        if (!nivelActual) {
            alert('Selecciona un tipo de alerta (Verde, Amarillo o Rojo).');
            return;
        }
        const destinatarios = [...document.querySelectorAll('input[name="destinatarios"]:checked')].map(c => c.value);
        if (destinatarios.length === 0) {
            alert('Selecciona al menos un destinatario.');
            return;
        }
        const alcance = document.querySelector('input[name="alcance"]:checked').value;
        const grupoId = alcance === 'especifico' ? document.getElementById('selectGrupo').value : null;
        const asunto = document.getElementById('asuntoNotificacion').value.trim();
        const mensaje = document.getElementById('mensajeEditor').innerHTML.trim();

        if (!asunto || !mensaje) {
            alert('Escribe un asunto y un mensaje antes de enviar.');
            return;
        }

        const modalidad = document.querySelector('input[name="programacion"]:checked').value; // "ahora" o "programar"
        let fechaEnvio = null;
        let horaEnvio = null;

        if (modalidad === 'programar') {
            fechaEnvio = document.getElementById('inputFecha').value;
            horaEnvio = document.getElementById('inputHora').value;

            if (!fechaEnvio || !horaEnvio) {
                alert('Selecciona la fecha y hora de envío.');
                return;
            }
        }

        const payload = { 
            nivel: nivelActual, 
            destinatarios, 
            alcance, 
            grupo_id: grupoId, 
            asunto, 
            mensaje,
            modalidad,
            fecha_envio: fechaEnvio,
            hora_envio: horaEnvio
        };

        const btn = document.getElementById('btnEnviarAlerta');
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        try {
            const res = await fetch('http://127.0.0.1:5000/alertas/enviar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.ok) {
                if (modalidad === 'programar') {
                    alert(`Alerta programada para ${fechaEnvio} ${horaEnvio}.`);
                } else {
                    alert(`Alerta enviada.\nCorreos enviados: ${data.enviados}\nFallidos: ${data.fallidos}`);
                }
                await cargarHistorial();
            } else {
                alert(`Error al enviar: ${data.mensaje}`);
            }
        } catch (e) {
            alert('No se pudo conectar con el servidor. Revisa que Flask esté corriendo.');
            console.error(e);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Alerta';
        }
    });

    document.getElementById('btnVistaPrevia')?.addEventListener('click', () => {
        alert('Abriendo panel de previsualización adaptativa...');
    });
});