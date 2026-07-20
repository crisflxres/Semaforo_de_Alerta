const API = 'https://semaforo-de-alerta.onrender.com';

document.getElementById('formCrearCuenta').addEventListener('submit', async function (e) {
    e.preventDefault();

    const mensajeError = document.getElementById('mensajeError');
    mensajeError.style.display = 'none';

    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        password: document.getElementById('password').value.trim(),
        id_rol: document.getElementById('id_rol').value
    };

    try {
        const respuesta = await fetch(`${API}/admin/crear_usuario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            alert('Usuario creado correctamente.');
            document.getElementById('formCrearCuenta').reset();
        } else {
            mensajeError.textContent = resultado.message;
            mensajeError.style.display = 'block';
        }

    } catch (error) {
        console.error('Error en la conexión:', error);
        mensajeError.textContent = 'No se pudo conectar con el servidor. Verifica que app.py esté corriendo en el puerto 5000.';
        mensajeError.style.display = 'block';
    }
});