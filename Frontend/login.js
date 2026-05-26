// 1. INICIO DE SESIÓN (LOGIN)
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;

    try {
        const respuesta = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo: correo,
                password: password
            })
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            alert(`¡Bienvenido de nuevo, ${resultado.nombre}!`);
            
            localStorage.setItem('rolUsuario', resultado.rol);
            localStorage.setItem('nombreUsuario', resultado.nombre);

            window.location.href = 'Inicio.html'; 
        } else {
            alert("Error: " + resultado.message);
        }

    } catch (error) {
        console.error("Error en la conexión:", error);
        alert("No se pudo conectar con el servidor de Python. Verifica que la terminal siga activa.");
    }
});

// 2. REDIRECCIÓN AL FORMULARIO DE REGISTRO
document.getElementById('btnIrRegistro').addEventListener('click', () => {
    window.location.href = 'crear_cuenta.html';
});