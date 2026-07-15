const API = 'http://127.0.0.1:5000';

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!usuario || !password) {
        alert('Completa usuario y contraseña.');
        return;
    }

    try {
        const respuesta = await fetch(`${API}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo: usuario,
                password: password
            })
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            alert(`Bienvenido, ${resultado.nombre}`);

            localStorage.setItem('rolUsuario', resultado.rol);
            localStorage.setItem('nombreUsuario', resultado.nombre);
            localStorage.setItem('matriculaSeleccionada', resultado.matricula);

            const rol = resultado.rol;

            if (rol === 5) {
                window.location.href = 'http://127.0.0.1:5500/Semaforo_de_Alerta/Frontend/Alumno/Inicio/alumno_inicio.html';
            } else {
                window.location.href = 'inicio.html';
            }

        } else {
            alert('Error: ' + resultado.message);
        }

    } catch (error) {
        console.error('Error en la conexión:', error);
        alert('No se pudo conectar con el servidor. Verifica que app.py esté corriendo en el puerto 5000.');
    }
});