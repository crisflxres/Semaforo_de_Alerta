document.addEventListener('DOMContentLoaded', function () {
    const rolUsuario = parseInt(localStorage.getItem('rolUsuario'));

    if (rolUsuario !== 1) {
        alert('No tienes permisos para acceder a esta sección.');
        window.location.href = 'inicio.html';
    }
});

document.getElementById("btnHamburguesa").addEventListener("click", () => document.getElementById("sidebarOverlay").classList.add("open"));
document.getElementById("btnCerrarSidebar").addEventListener("click", () => document.getElementById("sidebarOverlay").classList.remove("open"));

// Cambia esto si tu Flask corre en otra URL/puerto
const API_BASE = "https://semaforo-de-alerta.onrender.com";

function manejarArchivo(input, tipo) {
    if (input.files && input.files.length > 0) {
        procesarArchivos(Array.from(input.files), tipo);
        input.value = '';
    }
}

function manejarDrop(event, tipo) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    const archivos = event.dataTransfer.files;
    if (archivos && archivos.length > 0) {
        procesarArchivos(Array.from(archivos), tipo);
    }
}

function procesarArchivos(archivos, tipo) {
    if (tipo === 'academico') {
        procesarVariosAcademicos(archivos);
    } else {
        procesarVariosContactos(archivos);
    }
}

/* ================== ACADÉMICO (TACA) ================== */

async function procesarVariosAcademicos(archivos) {
    const msg = document.getElementById('exitoAcademico');
    const textoMsg = document.getElementById('textoExitoAcademico');

    let exitosos = 0;
    let fallidos = [];

    for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        textoMsg.textContent = `Importando ${archivo.name} (${i + 1}/${archivos.length})...`;
        msg.style.display = 'flex';

        const resultado = await procesarAcademico(archivo, true);

        if (resultado.exito) {
            exitosos++;
        } else {
            fallidos.push({ nombre: archivo.name, mensaje: resultado.mensaje });
        }
    }

    if (fallidos.length === 0) {
        textoMsg.textContent = `${exitosos} archivo(s) importado(s) correctamente.`;
    } else {
        const detalleFallos = fallidos.map(f => `${f.nombre}: ${f.mensaje}`).join(' | ');
        textoMsg.textContent = `${exitosos} importado(s), ${fallidos.length} con error → ${detalleFallos}`;
    }
    msg.style.display = 'flex';
    setTimeout(() => { msg.style.display = 'none'; }, 7000);
}

async function procesarAcademico(archivo, silencioso = false) {
    const nombre = archivo.name.replace(/\.[^/.]+$/, "");
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-MX');
    const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const urlArchivo = URL.createObjectURL(archivo);

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
        const respuesta = await fetch(`${API_BASE}/configuracion/importar-taca`, {
            method: "POST",
            body: formData,
        });
        const data = await respuesta.json();

        if (!respuesta.ok || !data.success) {
            const mensajeError = data.mensaje || "Error al importar el archivo";
            if (!silencioso) mostrarErrorAcademico(mensajeError);
            return { exito: false, mensaje: mensajeError };
        }

        if (!silencioso) {
            const msg = document.getElementById('exitoAcademico');
            const textoMsg = document.getElementById('textoExitoAcademico');
            textoMsg.textContent = `Archivo ${nombre} cargado, ${data.registros} calificaciones agregadas.`;
            msg.style.display = 'flex';
            setTimeout(() => { msg.style.display = 'none'; }, 5000);
        }

        agregarHistorial(nombre, fecha, hora, `${data.registros} regs`, 'academico', urlArchivo, archivo.name, data.id_importacion);
        return { exito: true, mensaje: "" };

    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        const mensajeError = "No se pudo conectar con el servidor";
        if (!silencioso) mostrarErrorAcademico(mensajeError);
        return { exito: false, mensaje: mensajeError };
    }
}

function mostrarErrorAcademico(mensaje) {
    const msg = document.getElementById('exitoAcademico');
    const textoMsg = document.getElementById('textoExitoAcademico');
    textoMsg.textContent = mensaje;
    msg.style.display = 'flex';
    setTimeout(() => { msg.style.display = 'none'; }, 5000);
}

/* ================== CONTACTOS ================== */

async function procesarVariosContactos(archivos) {
    const msg = document.getElementById('exitoContactos');
    const textoMsg = document.getElementById('textoExitoContactos');

    let exitosos = 0;
    let fallidos = [];

    for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        textoMsg.textContent = `Importando ${archivo.name} (${i + 1}/${archivos.length})...`;
        msg.style.display = 'flex';

        const resultado = await procesarContactos(archivo, true);

        if (resultado.exito) {
            exitosos++;
        } else {
            fallidos.push({ nombre: archivo.name, mensaje: resultado.mensaje });
        }
    }

    if (fallidos.length === 0) {
        textoMsg.textContent = `${exitosos} archivo(s) importado(s) correctamente.`;
    } else {
        const detalleFallos = fallidos.map(f => `${f.nombre}: ${f.mensaje}`).join(' | ');
        textoMsg.textContent = `${exitosos} importado(s), ${fallidos.length} con error → ${detalleFallos}`;
    }
    msg.style.display = 'flex';
    setTimeout(() => { msg.style.display = 'none'; }, 7000);
}

async function procesarContactos(archivo, silencioso = false) {
    const nombre = archivo.name.replace(/\.[^/.]+$/, "");
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-MX');
    const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const urlArchivo = URL.createObjectURL(archivo);

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
        const respuesta = await fetch(`${API_BASE}/configuracion/importar-contactos`, {
            method: "POST",
            body: formData,
        });
        const data = await respuesta.json();

        if (!respuesta.ok || !data.success) {
            const mensajeError = data.mensaje || "Error al importar el archivo";
            if (!silencioso) mostrarErrorContactos(mensajeError);
            return { exito: false, mensaje: mensajeError };
        }

        if (!silencioso) {
            const msg = document.getElementById('exitoContactos');
            const textoMsg = document.getElementById('textoExitoContactos');
            textoMsg.textContent = `Archivo ${nombre} cargado, ${data.registros} contactos vinculados.`;
            msg.style.display = 'flex';
            setTimeout(() => { msg.style.display = 'none'; }, 5000);
        }

        agregarHistorial(nombre, fecha, hora, `${data.registros} regs`, 'contactos', urlArchivo, archivo.name, data.id_importacion);
        return { exito: true, mensaje: "" };

    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        const mensajeError = "No se pudo conectar con el servidor";
        if (!silencioso) mostrarErrorContactos(mensajeError);
        return { exito: false, mensaje: mensajeError };
    }
}

function mostrarErrorContactos(mensaje) {
    const msg = document.getElementById('exitoContactos');
    const textoMsg = document.getElementById('textoExitoContactos');
    textoMsg.textContent = mensaje;
    msg.style.display = 'flex';
    setTimeout(() => { msg.style.display = 'none'; }, 5000);
}

/* ================== FOTOS (carpeta arrastrada) ================== */

const TAMANO_LOTE_FOTOS = 25;
let lotesFallidos = []; // guarda { numero, archivos, mensaje } de los lotes que fallaron

function bloquearZonaContactos(bloquear) {
    const zona = document.getElementById('dropContactos');
    const input = document.getElementById('inputContactos');
    if (bloquear) {
        zona.classList.add('deshabilitada');
        input.disabled = true;
    } else {
        zona.classList.remove('deshabilitada');
        input.disabled = false;
    }
}

function actualizarBarraProgreso(porcentaje, texto) {
    const container = document.getElementById('barraProgresoFotosContainer');
    const relleno = document.getElementById('barraProgresoFotosRelleno');
    const textoEl = document.getElementById('barraProgresoFotosTexto');

    container.style.display = 'block';
    relleno.style.width = `${porcentaje}%`;
    textoEl.textContent = texto;
}

function ocultarBarraProgreso() {
    document.getElementById('barraProgresoFotosContainer').style.display = 'none';
}

/* Sube UN lote de fotos. Regresa { exito, registros, mensaje } */
async function subirLoteFotos(lote) {
    const formData = new FormData();
    lote.forEach((archivo) => {
        formData.append("fotos", archivo, archivo.name);
    });

    try {
        const respuesta = await fetch(`${API_BASE}/configuracion/importar-fotos`, {
            method: "POST",
            body: formData,
        });
        const data = await respuesta.json();

        if (!respuesta.ok || !data.success) {
            return { exito: false, registros: 0, mensaje: data.mensaje || "Error desconocido" };
        }
        return { exito: true, registros: data.registros, mensaje: "" };

    } catch (error) {
        return { exito: false, registros: 0, mensaje: "No se pudo conectar con el servidor" };
    }
}

async function procesarCarpetaFotos(archivos) {
    const msg = document.getElementById('exitoContactos');
    const textoMsg = document.getElementById('textoExitoContactos');
    const btnReintentar = document.getElementById('btnReintentarFotos');

    if (!archivos || archivos.length === 0) {
        textoMsg.textContent = "La carpeta no contiene archivos válidos.";
        msg.style.display = 'flex';
        setTimeout(() => { msg.style.display = 'none'; }, 5000);
        return;
    }

    bloquearZonaContactos(true);
    btnReintentar.style.display = 'none';
    lotesFallidos = [];

    try {
        const totalLotes = Math.ceil(archivos.length / TAMANO_LOTE_FOTOS);
        let totalRegistros = 0;

        for (let i = 0; i < totalLotes; i++) {
            const inicio = i * TAMANO_LOTE_FOTOS;
            const lote = archivos.slice(inicio, inicio + TAMANO_LOTE_FOTOS);
            const numeroLote = i + 1;

            const porcentaje = Math.round((numeroLote / totalLotes) * 100);
            actualizarBarraProgreso(porcentaje, `Subiendo lote ${numeroLote} de ${totalLotes} (${lote.length} fotos)...`);

            const resultado = await subirLoteFotos(lote);

            if (resultado.exito) {
                totalRegistros += resultado.registros;
            } else {
                lotesFallidos.push({ numero: numeroLote, archivos: lote, mensaje: resultado.mensaje });
            }
        }

        await finalizarImportacionFotos(totalRegistros);
        mostrarReporteFinalFotos(totalRegistros);

    } catch (error) {
        console.error("Error inesperado al procesar fotos:", error);
        textoMsg.textContent = "Ocurrió un error inesperado durante la importación.";
        msg.style.display = 'flex';

    } finally {
        bloquearZonaContactos(false);
        ocultarBarraProgreso();
    }
}

async function finalizarImportacionFotos(totalRegistros) {
    try {
        const respuesta = await fetch(`${API_BASE}/configuracion/finalizar-importacion-fotos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registros: totalRegistros }),
        });
        const data = await respuesta.json();

        agregarHistorial(
            "Carpeta de fotos",
            new Date().toLocaleDateString('es-MX'),
            new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            `${totalRegistros} regs`,
            'contactos',
            null,
            null,
            data.id_importacion
        );
    } catch (error) {
        console.error("Error al finalizar importación de fotos:", error);
    }
}

function mostrarReporteFinalFotos(totalRegistros) {
    const msg = document.getElementById('exitoContactos');
    const textoMsg = document.getElementById('textoExitoContactos');
    const btnReintentar = document.getElementById('btnReintentarFotos');

    if (lotesFallidos.length === 0) {
        textoMsg.textContent = `${totalRegistros} foto(s) vinculada(s) correctamente. Sin errores.`;
    } else {
        const fotosFallidas = lotesFallidos.reduce((suma, l) => suma + l.archivos.length, 0);
        textoMsg.textContent = `${totalRegistros} foto(s) vinculada(s). ${lotesFallidos.length} lote(s) fallaron (${fotosFallidas} fotos sin subir).`;
        btnReintentar.style.display = 'flex';
    }

    msg.style.display = 'flex';
    setTimeout(() => { msg.style.display = 'none'; }, 8000);
}

async function reintentarLotesFallidos() {
    if (lotesFallidos.length === 0) return;

    const btnReintentar = document.getElementById('btnReintentarFotos');
    btnReintentar.style.display = 'none';
    bloquearZonaContactos(true);

    const lotesAReintentar = [...lotesFallidos];
    lotesFallidos = [];
    let totalRegistros = 0;

    try {
        for (let i = 0; i < lotesAReintentar.length; i++) {
            const loteInfo = lotesAReintentar[i];
            actualizarBarraProgreso(
                Math.round(((i + 1) / lotesAReintentar.length) * 100),
                `Reintentando lote ${loteInfo.numero} (${i + 1}/${lotesAReintentar.length})...`
            );

            const resultado = await subirLoteFotos(loteInfo.archivos);

            if (resultado.exito) {
                totalRegistros += resultado.registros;
            } else {
                lotesFallidos.push({ ...loteInfo, mensaje: resultado.mensaje });
            }
        }

        if (totalRegistros > 0) {
            await finalizarImportacionFotos(totalRegistros);
        }

        mostrarReporteFinalFotos(totalRegistros);

    } catch (error) {
        console.error("Error inesperado al reintentar fotos:", error);

    } finally {
        bloquearZonaContactos(false);
        ocultarBarraProgreso();
    }
}

document.getElementById('btnReintentarFotos').addEventListener('click', reintentarLotesFallidos);

/* ================== DETECCIÓN ARCHIVO vs CARPETA (drag & drop en Contactos) ================== */

async function manejarDropContactos(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');

    const items = event.dataTransfer.items;
    const archivosExcel = [];
    const archivosFotos = [];
    const carpetasEncontradas = []; // antes era una sola variable; ahora soporta varias carpetas

    for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (!entry) continue;

        if (entry.isDirectory) {
            carpetasEncontradas.push(entry);

        } else if (entry.isFile) {
            const archivo = items[i].getAsFile();
            const extension = archivo.name.split('.').pop().toLowerCase();

            if (extension === 'xls' || extension === 'xlsx') {
                archivosExcel.push(archivo);
            } else if (extension === 'jpg' || extension === 'jpeg') {
                archivosFotos.push(archivo);
            }
            // cualquier otra extensión se ignora silenciosamente
        }
    }

    if (carpetasEncontradas.length > 0) {
        // Se leen todas las carpetas en paralelo y se juntan sus archivos en un solo lote
        const resultados = await Promise.all(
            carpetasEncontradas.map((carpeta) => leerCarpetaRecursiva(carpeta))
        );
        const archivosDeFotos = resultados.flat();
        procesarCarpetaFotos(archivosDeFotos);
    }

    if (archivosExcel.length > 0) {
        procesarVariosContactos(archivosExcel);
    }

    if (archivosFotos.length > 0) {
        procesarCarpetaFotos(archivosFotos);
    }
}

function leerCarpetaRecursiva(directoryEntry) {
    return new Promise((resolve, reject) => {
        const lector = directoryEntry.createReader();
        const archivosEncontrados = [];

        function leerSiguienteBloque() {
            lector.readEntries(async (entradas) => {

                if (entradas.length === 0) {
                    resolve(archivosEncontrados);
                    return;
                }

                for (const entrada of entradas) {
                    if (entrada.isFile) {
                        const archivoReal = await new Promise((res) => entrada.file(res));
                        archivosEncontrados.push(archivoReal);

                    } else if (entrada.isDirectory) {
                        const archivosDeSubcarpeta = await leerCarpetaRecursiva(entrada);
                        archivosEncontrados.push(...archivosDeSubcarpeta);
                    }
                }

                leerSiguienteBloque();
            }, reject);
        }

        leerSiguienteBloque();
    });
}

/* ================== HISTORIAL ================== */

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

/* ================== PERFIL / SESIÓN ================== */

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

const btnCerrarSesion = document.getElementById('btnCerrarSesion');
if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('rolUsuario');
        localStorage.removeItem('nombreUsuario');
        window.location.href = 'index.html';
    });
}
document.getElementById('btnIrCrearCuenta').addEventListener('click', function () {
    window.location.href = 'crear_cuenta.html';
});