document.getElementById("btnHamburguesa").addEventListener("click", () => document.getElementById("sidebarOverlay").classList.add("open"));
document.getElementById("btnCerrarSidebar").addEventListener("click", () => document.getElementById("sidebarOverlay").classList.remove("open"));

function manejarArchivo(input, tipo) {
    if (input.files && input.files[0]) {
        procesarArchivo(input.files[0], tipo);
        input.value = ''; 
    }
}

function manejarDrop(event, tipo) {
    event.preventDefault();
    const archivo = event.dataTransfer.files[0];
    if (archivo) procesarArchivo(archivo, tipo);
}

function procesarArchivo(archivo, tipo) {
    const nombre = archivo.name.replace(/\.[^/.]+$/, "");
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-MX');
    const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const registros = Math.floor(Math.random() * 500) + 1000;
    const urlArchivo = URL.createObjectURL(archivo);

    let msg, textoMsg;

    if (tipo === 'academico') {
        msg = document.getElementById('exitoAcademico');
        textoMsg = document.getElementById('textoExitoAcademico');
        textoMsg.textContent = `Archivo ${nombre} cargado, ${registros} calificaciones agregadas.`;
    } else {
        msg = document.getElementById('exitoContactos');
        textoMsg = document.getElementById('textoExitoContactos');
        textoMsg.textContent = `Archivo ${nombre} cargado, ${registros} contactos vinculados.`;
    }

    msg.style.display = 'flex';
    agregarHistorial(nombre, fecha, hora, `${registros} regs`, tipo, urlArchivo, archivo.name);

    setTimeout(() => {
        msg.style.display = 'none';
    }, 5000);
}

function agregarHistorial(nombre, fecha, hora, registros, tipo, urlArchivo, nombreArchivo) {
    const tbody = document.getElementById('cuerpoHistorial');
    const icono = tipo === 'academico' ? `<div class="icono-fila icono-verde-bg"><i class="fa-solid fa-file-lines"></i></div>` : `<div class="icono-fila icono-morado-bg"><i class="fa-solid fa-address-book"></i></div>`;
    const fila = document.createElement('tr');
    
    fila.innerHTML = `
        <td><div class="celda-archivo">${icono} ${nombre}</div></td>
        <td>${fecha} a las ${hora}</td>
        <td>${registros}</td>
        <td>
            <div style="display:flex; gap:25px; align-items:center; justify-content:center;">
                <a href="${urlArchivo}" download="${nombreArchivo}" title="Descargar" style="color:#1a7a31; font-size:18px;"><i class="fa-solid fa-download"></i></a>
                <button onclick="this.closest('tr').remove(); actualizarVacio();" style="background:none; border:none; cursor:pointer; color:#cc0000; font-size:18px;"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>`;
    
    tbody.insertBefore(fila, tbody.firstChild);
    document.getElementById('historialVacio').style.display = 'none';
}

function actualizarVacio() {
    document.getElementById('historialVacio').style.display = document.getElementById('cuerpoHistorial').rows.length === 0 ? 'block' : 'none';
}

/* ==========================================================================
   LÓGICA INTERACTIVA DEL DROPDOWN DE PERFIL (CONECTADA AL CSS COMPLETAMENTE)
   ========================================================================== */
const avatarUsuario = document.getElementById('avatarUsuario');
const dropdownPerfil = document.getElementById('dropdownPerfil');

if (avatarUsuario && dropdownPerfil) {
    // Al dar clic al avatar, se abre/cierra la cajita usando la clase '.show'
    avatarUsuario.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownPerfil.classList.toggle('show');
    });

    // Cerrar el menú si das clic fuera del dropdown
    document.addEventListener('click', (e) => {
        if (!dropdownPerfil.contains(e.target) && e.target !== avatarUsuario) {
            dropdownPerfil.classList.remove('show');
        }
    });
}

/* ==========================================================================
   CERRAR SESIÓN: borra los datos guardados del login y redirige
   ========================================================================== */
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('rolUsuario');
        localStorage.removeItem('nombreUsuario');
        window.location.href = 'index.html';
    });
}