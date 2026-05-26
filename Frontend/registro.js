document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue sola

    // 1. Obtener los valores del HTML
    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 2. Validar que las contraseñas coincidan en el cliente
    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden.");
        return; // Detiene el envío
    }

    try {
        // 3. Enviar los datos al servidor de Python (Puerto 5000)
        const respuesta = await fetch('http://127.0.0.1:5000/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                correo: correo,
                password: password
            })
        });

        const resultado = await respuesta.json();

        // 4. Evaluar la respuesta del backend
        if (resultado.success) {
            alert("¡Usuario registrado correctamente en MySQL Workbench!");
            window.location.href = 'index.html'; // Redirecciona al login
        } else {
            alert("Error al registrar: " + resultado.message);
        }

    } catch (error) {
        console.error("Error en la conexión:", error);
        alert("No se pudo conectar con el servidor de Python. Verifica que la terminal esté corriendo.");
    }
});