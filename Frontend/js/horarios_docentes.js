let docentes = [{nombre: "María López", email: "maria@escuela.com", tel: "555 123 4567", rol: "Docente"}];
let paginaActual = 1;
const porPagina = 5;

// Panel control
document.getElementById('btnNuevoDocente').addEventListener('click', () => {
    document.getElementById('panelRegistro').classList.remove('hidden');
});

document.getElementById('btnCancelar').addEventListener('click', () => {
    document.getElementById('panelRegistro').classList.add('hidden');
});

// Guardar
document.getElementById('btnGuardar').addEventListener('click', () => {
    const indice = document.getElementById('indiceEdicion').value;
    const nuevo = {
        nombre: document.getElementById('inputNombre').value,
        email: document.getElementById('inputEmail').value,
        tel: document.getElementById('inputTelefono').value,
        rol: document.getElementById('inputRol').value
    };
    if(indice > -1) {
        docentes[indice] = nuevo; // Sobrescribir
    } else {
        docentes.push(nuevo);     // Crear nuevo
    }
        renderizar();
        document.getElementById('panelRegistro').classList.add('hidden');
        document.getElementById('indiceEdicion').value = "-1"; // Resetear
});


// Renderizar, Filtrar y Paginar
function renderizar() {
    const lista = document.getElementById('listaDocentes');
    const term = document.getElementById('buscador').value.toLowerCase();
    const filtrados = docentes.filter(d => d.nombre.toLowerCase().includes(term));
    
    lista.innerHTML = '';
    const inicio = (paginaActual - 1) * porPagina;
    const paginaDocentes = filtrados.slice(inicio, inicio + porPagina);

    paginaDocentes.forEach((doc, index) => {
        lista.innerHTML += `
        <div class="docente-card">
            <div><h3>${doc.nombre}</h3><p>${doc.email}</p><p>${doc.tel}</p><p>${doc.rol}</p></div>
            <div>
                <button onclick="editar(${index})">✏️</button>
                <button onclick="eliminar(${index})">🗑️</button>
            </div>
        </div>`;
    });
}

document.getElementById('buscador').addEventListener('input', () => { paginaActual = 1; renderizar(); });

function eliminar(index) {
    docentes.splice(index, 1);
    renderizar();
}

// Agrega esta nueva función para editar
function editar(index) {
    const doc = docentes[index];
    // Rellenar el formulario con los datos actuales
    document.getElementById('inputNombre').value = doc.nombre;
    document.getElementById('inputEmail').value = doc.email;
    document.getElementById('inputTelefono').value = doc.tel;
    document.getElementById('inputRol').value = doc.rol;
    
    // Abrir el panel
    document.getElementById('panelRegistro').classList.remove('hidden');
    document.getElementById('indiceEdicion').value = index; // Guardar qué índice estamos editando
    
    // Aquí podrías añadir lógica para saber que estás editando 
    // y no creando uno nuevo (como un ID oculto)
}

renderizar();