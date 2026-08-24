// Cambia esto si tu Flask corre en otra URL/puerto (misma variable que en alumnos.js)
const API_BASE = 'https://semaforo-de-alerta-f2kf.onrender.com';

// VARIABLES GLOBALES
let docentes = [];

// CARGAR DOCENTES DESDE LA BD
async function cargarDocentes() {
    const res = await fetch(`${API_BASE}/docentes`);
    const data = await res.json();
    if (data.success) {
        docentes = data.data.map(d => {
            const idRol = parseInt(d.Id_Rol);
            let rolTexto = 'Tutor';
            if (idRol === 2) rolTexto = 'Docente';
            if (idRol === 5) rolTexto = 'Docente/Tutor';

            return {
                id: d.Id_Usuario,
                nombre: `${d.Nombre} ${d.Apellidos}`,
                email: d.Email || 'Sin correo',
                rol: rolTexto
            };
        });
        renderizar();
    }
}

// RENDERIZAR LISTA
function renderizar() {
    const lista = document.getElementById('listaDocentes');
    const term = document.getElementById('buscador').value.toLowerCase();
    const filtrados = docentes.filter(d => d.nombre.toLowerCase().includes(term));

    lista.innerHTML = '';

    filtrados.forEach((doc) => {
        lista.innerHTML += `
        <div class="docente-card">
            <div><h3>${doc.nombre}</h3><p>${doc.email}</p><p>${doc.rol}</p></div>
            <div>
                <button  class="btn-editar" onclick="editar(${doc.id})">✏️</button>
                <button class="btn-eliminar" onclick="eliminar(${doc.id})">🗑️</button>
            </div>
        </div>`;
    });
}

// CRUD
document.getElementById('btnNuevoDocente').addEventListener('click', () => {
    document.getElementById('inputNombre').value = '';
    document.getElementById('inputEmail').value = '';
    document.getElementById('inputRol').value = '2';
    document.getElementById('indiceEdicion').value = '-1';
    document.getElementById('panelRegistro').classList.remove('hidden');
});

document.getElementById('btnCancelar').addEventListener('click', () => {
    document.getElementById('panelRegistro').classList.add('hidden');
});

document.getElementById('btnGuardar').addEventListener('click', async () => {
    const indice = document.getElementById('indiceEdicion').value;
    const esEdicion = indice !== "-1";
    const nombre = document.getElementById('inputNombre').value.trim();
    const partes = nombre.split(' ');
    const datos = {
        nombre:    partes[0],
        apellidos: partes.slice(1).join(' ') || 'No especificado',
        email:     document.getElementById('inputEmail').value.trim(),
        id_rol:    document.getElementById('inputRol').value
    };

    // Confirmación antes de crear o editar
    const mensajeConfirmacion = esEdicion
        ? `¿Confirmas que deseas guardar los cambios de "${nombre}"?`
        : `¿Confirmas que deseas registrar a "${nombre}" como nuevo docente?`;

    if (!confirm(mensajeConfirmacion)) {
        return;
    }

    try {
        let res;
        if (esEdicion) {
            res = await fetch(`${API_BASE}/docentes/${indice}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        } else {
            res = await fetch(`${API_BASE}/docentes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        }

        const data = await res.json();

        if (!data.success) {
            alert(`No se pudo guardar el docente: ${data.message || 'Error desconocido.'}`);
            return;
        }

        await cargarDocentes();
        document.getElementById('panelRegistro').classList.add('hidden');
        document.getElementById('indiceEdicion').value = "-1";
    } catch (err) {
        alert('Ocurrió un error de conexión al guardar el docente.');
        console.error(err);
    }
});

function editar(id) {
    const doc = docentes.find(d => d.id === id);
    document.getElementById('inputNombre').value = doc.nombre;
    document.getElementById('inputEmail').value = doc.email;

    let valorRol = '3';
    if (doc.rol === 'Docente') valorRol = '2';
    if (doc.rol === 'Docente/Tutor') valorRol = '5';
    document.getElementById('inputRol').value = valorRol;

    document.getElementById('panelRegistro').classList.remove('hidden');
    document.getElementById('indiceEdicion').value = id;
}

async function eliminar(id) {
    const doc = docentes.find(d => d.id === id);
    const nombre = doc ? doc.nombre : 'este docente';

    if (!confirm(`¿Seguro que deseas eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        // Se manda un objeto "headers" explícito (aunque vacío) para que
        // interceptor.js tenga dónde inyectar el header X-Id-Rol.
        // Antes esta llamada no lo llevaba y el backend la rechazaba
        // (401/403) sin que se notara en la interfaz.
        const res = await fetch(`${API_BASE}/docentes/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (!data.success) {
            alert(`No se pudo eliminar al docente: ${data.message || 'Error desconocido.'}`);
            return;
        }

        await cargarDocentes();
    } catch (err) {
        alert('Ocurrió un error de conexión al eliminar el docente.');
        console.error(err);
    }
}

document.getElementById('buscador').addEventListener('input', () => {
    renderizar();
});

// MENÚ HAMBURGUESA
document.getElementById('btnHamburguesa').addEventListener('click', () => {
    document.getElementById('sidebarOverlay').classList.add('open');
});

document.getElementById('btnCerrarSidebar').addEventListener('click', () => {
    document.getElementById('sidebarOverlay').classList.remove('open');
});

document.getElementById('sidebarOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('sidebarOverlay')) {
        document.getElementById('sidebarOverlay').classList.remove('open');
    }
});

// ── INICIO ───────────────────────────────────────────────────────────────────
cargarDocentes();

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
