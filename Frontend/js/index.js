const API = 'http://127.0.0.1:5000';

// 1. PROCESAR EL INICIO DE SESIÓN
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const correo = document.getElementById('usuario').value;
    const password = document.getElementById('matricula').value;

    try {
        const respuesta = await fetch(`${API}/login`, {
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

            window.location.href = 'inicio.html'; 
        } else {
            alert("Error: " + resultado.message);
        }

    } catch (error) {
        console.error("Error en la conexión:", error);
        alert("No se pudo conectar con el servidor de Python. Verifica que la terminal esté corriendo.");
    }
});