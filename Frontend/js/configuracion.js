document.getElementById("btnHamburguesa").addEventListener("click", () => document.getElementById("sidebarOverlay").classList.add("open"));
document.getElementById("btnCerrarSidebar").addEventListener("click", () => document.getElementById("sidebarOverlay").classList.remove("open"));

// Cambia esto si tu Flask corre en otra URL/puerto
const API_BASE = "http://localhost:5000";

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
    if (tipo === 'academico') {
        procesarAcademico(archivo);
    } else {
        procesarContactos(archivo); // simulado por ahora
    }
}

/* ACADÉMICO (TACA) — conectado al backend real */
async function procesarAcademico(archivo) {
    const nombre = archivo.name.replace(/\.[^/.]+$/, "");
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-MX');
    const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const urlArchivo = URL.createObjectURL(archivo);

    const msg = document.getElementById('exitoAcademico');
    const textoMsg = document.getElementById('textoExitoAcademico');

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
        const respuesta = await fetch(`${API_BASE}/configuracion/importar-taca`, {
            method: "POST",
            body: formData,
        });
        const data = await respuesta.json();

        if (!respuesta.ok || !data.success) {
            mostrarErrorAcademico(data.mensaje || "Error al importar el archivo");
            return;
        }

        textoMsg.textContent = `Archivo ${nombre} cargado, ${data.registros} calificaciones agregadas.`;
        msg.style.display = 'flex';

        agregarHistorial(nombre, fecha, hora, `${data.registros} regs`, 'academico', urlArchivo, archivo.name, data.id_importacion);

        setTimeout(() => { msg.style.display = 'none'; }, 5000);

    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        mostrarErrorAcademico("No se pudo conectar con el servidor");
    }
}

function mostrarErrorAcademico(mensaje) {
    const msg = document.getElementById('exitoAcademico');
    const textoMsg = document.getElementById('textoExitoAcademico');
    textoMsg.textContent = mensaje;
    msg.style.display = 'flex';
    setTimeout(() => { msg.style.display = 'none'; }, 5000);
}

/* CONTACTOS — todavía simulado, lo conectamos cuando hagamos esa ruta */
function procesarContactos(archivo) {
    const nombre = archivo.name.replace(/\.[^/.]+$/, "");
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-MX');
    const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const registros = Math.floor(Math.random() * 500) + 1000;
    const urlArchivo = URL.createObjectURL(archivo);

    const msg = document.getElementById('exitoContactos');
    const textoMsg = document.getElementById('textoExitoContactos');
    textoMsg.textContent = `Archivo ${nombre} cargado, ${registros} contactos vinculados.`;
    msg.style.display = 'flex';

    agregarHistorial(nombre, fecha, hora, `${registros} regs`, 'contactos', urlArchivo, archivo.name);

    setTimeout(() => { msg.style.display = 'none'; }, 5000);
}

function agregarHistorial(nombre, fecha, hora, registros, tipo, urlArchivo, nombreArchivo, idImportacion) {
    const tbody = document.getElementById('cuerpoHistorial');
    const icono = tipo === 'academico' ? `<div class="icono-fila icono-verde-bg"><i class="fa-solid fa-file-lines"></i></div>` : `<div class="icono-fila icono-morado-bg"><i class="fa-solid fa-address-book"></i></div>`;
    const fila = document.createElement('tr');
    if (idImportacion) fila.dataset.idImportacion = idImportacion;

    const enlaceDescarga = urlArchivo
        ? `<a href="${urlArchivo}" download="${nombreArchivo}" title="Descargar" style="color:#1a7a31; font-size:18px;"><i class="fa-solid fa-download"></i></a>`
        : '';

    fila.innerHTML = `
        <td><div class="celda-archivo">${icono} ${nombre}</div></td>
        <td>${fecha} a las ${hora}</td>
        <td>${registros}</td>
        <td>
            <div style="display:flex; gap:25px; align-items:center; justify-content:center;">
                ${enlaceDescarga}
                <button class="btn-borrar-historial" style="background:none; border:none; cursor:pointer; color:#cc0000; font-size:18px;"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>`;

    fila.querySelector('.btn-borrar-historial').addEventListener('click', () => borrarImportacion(fila, idImportacion));

    tbody.insertBefore(fila, tbody.firstChild);
    document.getElementById('historialVacio').style.display = 'none';
}

function borrarImportacion(fila, idImportacion) {
    if (!idImportacion) {
        fila.remove();
        actualizarVacio();
        return;
    }
    if (!confirm('¿Borrar esta importación? Esto eliminará también sus calificaciones de la base de datos.')) return;

    fetch(`${API_BASE}/configuracion/historial/${idImportacion}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                fila.remove();
                actualizarVacio();
            } else {
                alert('No se pudo borrar: ' + data.mensaje);
            }
        })
        .catch(err => {
            console.error(err);
            alert('No se pudo conectar con el servidor');
        });
}

function actualizarVacio() {
    document.getElementById('historialVacio').style.display = document.getElementById('cuerpoHistorial').rows.length === 0 ? 'block' : 'none';
}

/* CARGAR HISTORIAL REAL DESDE EL BACKEND */

function cargarHistorial() {
    fetch(`${API_BASE}/configuracion/historial`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;
            const tbody = document.getElementById('cuerpoHistorial');
            tbody.innerHTML = '';
            data.data.forEach(item => {
                const fechaObj = new Date(item.fecha);
                const fecha = fechaObj.toLocaleDateString('es-MX');
                const hora = fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                const nombre = item.archivo.replace(/\.[^/.]+$/, "");
                agregarHistorial(nombre, fecha, hora, `${item.registros} regs`, 'academico', null, item.archivo, item.id_importacion);
            });
            actualizarVacio();
        })
        .catch(err => console.error("No se pudo cargar el historial:", err));
}
document.addEventListener('DOMContentLoaded', cargarHistorial);

/* LÓGICA INTERACTIVA DEL DROPDOWN DE PERFIL (CONECTADA AL CSS COMPLETAMENTE) */
const avatarUsuario = document.getElementById('avatarUsuario');
const dropdownPerfil = document.getElementById('dropdownPerfil');

if (avatarUsuario && dropdownPerfil) {
    avatarUsuario.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownPerfil.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!dropdownPerfil.contains(e.target) && e.target !== avatarUsuario) {
            dropdownPerfil.classList.remove('show');
        }
    });
}

/* CERRAR SESIÓN: borra los datos guardados del login y redirige */
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('rolUsuario');
        localStorage.removeItem('nombreUsuario');
        window.location.href = 'index.html';
    });
}