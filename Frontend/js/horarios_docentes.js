// ── VARIABLES GLOBALES ──────────────────────────────────────────────────────
let docentes = [];

// ── CARGAR DOCENTES DESDE LA BD ─────────────────────────────────────────────
async function cargarDocentes() {
    const res = await fetch('http://127.0.0.1:5000/docentes');
    const data = await res.json();
    if (data.success) {
        docentes = data.data.map(d => ({
            id: d.Id_Usuario,
            nombre: `${d.Nombre} ${d.Apellidos}`,
            email: d.Email || 'Sin correo',
            tel: d.Telefono || 'Sin teléfono',
            rol: parseInt(d.Id_Rol) === 2 ? 'Docente' : 'Tutor'
        }));
        renderizar();
    }
}

// ── RENDERIZAR LISTA ─────────────────────────────────────────────────────────
function renderizar() {
    const lista = document.getElementById('listaDocentes');
    const term = document.getElementById('buscador').value.toLowerCase();
    const filtrados = docentes.filter(d => d.nombre.toLowerCase().includes(term));

    lista.innerHTML = '';

    filtrados.forEach((doc) => {
        lista.innerHTML += `
        <div class="docente-card">
            <div><h3>${doc.nombre}</h3><p>${doc.email}</p><p>${doc.tel}</p><p>${doc.rol}</p></div>
            <div>
                <button  class="btn-editar" onclick="editar(${doc.id})">✏️</button>
                <button class="btn-eliminar" onclick="eliminar(${doc.id})">🗑️</button>
            </div>
        </div>`;
    });
}

// ── CRUD ─────────────────────────────────────────────────────────────────────
document.getElementById('btnNuevoDocente').addEventListener('click', () => {
    document.getElementById('inputNombre').value = '';
    document.getElementById('inputEmail').value = '';
    document.getElementById('inputTelefono').value = '';
    document.getElementById('inputRol').value = '2';
    document.getElementById('indiceEdicion').value = '-1';
    document.getElementById('panelRegistro').classList.remove('hidden');
});

document.getElementById('btnCancelar').addEventListener('click', () => {
    document.getElementById('panelRegistro').classList.add('hidden');
});

document.getElementById('btnGuardar').addEventListener('click', async () => {
    const indice = document.getElementById('indiceEdicion').value;
    const nombre = document.getElementById('inputNombre').value.trim();
    const partes = nombre.split(' ');
    const datos = {
        nombre:    partes[0],
        apellidos: partes.slice(1).join(' ') || 'No especificado',
        email:     document.getElementById('inputEmail').value.trim(),
        telefono:  document.getElementById('inputTelefono').value.trim(),
        id_rol:    document.getElementById('inputRol').value
    };

    if (indice !== "-1") {
        await fetch(`http://127.0.0.1:5000/docentes/${indice}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
    } else {
        await fetch('http://127.0.0.1:5000/docentes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
    }

    await cargarDocentes();
    document.getElementById('panelRegistro').classList.add('hidden');
    document.getElementById('indiceEdicion').value = "-1";
});

function editar(id) {
    const doc = docentes.find(d => d.id === id);
    document.getElementById('inputNombre').value = doc.nombre;
    document.getElementById('inputEmail').value = doc.email;
    document.getElementById('inputTelefono').value = doc.tel;
    document.getElementById('inputRol').value = doc.rol === 'Docente' ? '2' : '3';
    document.getElementById('panelRegistro').classList.remove('hidden');
    document.getElementById('indiceEdicion').value = id;
}

async function eliminar(id) {
    await fetch(`http://127.0.0.1:5000/docentes/${id}`, { method: 'DELETE' });
    await cargarDocentes();
}

document.getElementById('buscador').addEventListener('input', () => {
    renderizar();
});

// ── MENÚ HAMBURGUESA ─────────────────────────────────────────────────────────
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