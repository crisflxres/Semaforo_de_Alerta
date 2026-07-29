document.addEventListener('DOMContentLoaded', () => {

    const matricula = localStorage.getItem('matriculaSeleccionada');
    if (!matricula) { console.warn("No se seleccionó ningún alumno."); return; }

    const elNombreTutor   = document.getElementById('txt-nombre-tutor');
    const elTelefonoTutor = document.getElementById('txt-telefono-tutor');
    const elCorreoTutor   = document.getElementById('txt-correo-tutor');

    const inputNombreTutor   = document.getElementById('input-nombre-tutor');
    const inputTelefonoTutor = document.getElementById('input-telefono-tutor');
    const inputCorreoTutor   = document.getElementById('input-correo-tutor');

    const btnEditarTutor  = document.getElementById('btn-editar-tutor');
    const btnGuardarTutor = document.getElementById('btn-guardar-tutor');

    function cargarTutor() {
        fetch(`https://semaforo-de-alerta.onrender.com/api/tutor/${matricula}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.existe) {
                    elNombreTutor.textContent = data.tutor.Nombre;
                    elTelefonoTutor.textContent = data.tutor.Telefono;
                    elCorreoTutor.textContent = data.tutor.Email;

                    inputNombreTutor.value = data.tutor.Nombre;
                    inputTelefonoTutor.value = data.tutor.Telefono;
                    inputCorreoTutor.value = data.tutor.Email;
                } else {
                    elNombreTutor.textContent = 'Sin registrar';
                    elTelefonoTutor.textContent = 'Sin registrar';
                    elCorreoTutor.textContent = 'Sin registrar';
                }
            })
            .catch(err => console.error('Error al cargar tutor:', err));
    }

    cargarTutor();

    btnEditarTutor?.addEventListener('click', () => {
        document.querySelectorAll('.dato-tutor').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.input-tutor').forEach(el => el.style.display = 'inline-block');
        btnEditarTutor.style.display = 'none';
        btnGuardarTutor.style.display = 'inline-block';
    });

    btnGuardarTutor?.addEventListener('click', () => {
        const nombre = inputNombreTutor.value.trim();
        const telefono = inputTelefonoTutor.value.trim();
        const email = inputCorreoTutor.value.trim();

        if (!nombre || !telefono || !email) {
            alert('Todos los campos del tutor son obligatorios.');
            return;
        }

        fetch(`https://semaforo-de-alerta.onrender.com/api/tutor/${matricula}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono, email })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                cargarTutor();
                document.querySelectorAll('.dato-tutor').forEach(el => el.style.display = 'inline');
                document.querySelectorAll('.input-tutor').forEach(el => el.style.display = 'none');
                btnGuardarTutor.style.display = 'none';
                btnEditarTutor.style.display = 'inline-block';
            } else {
                alert('Error al guardar: ' + data.message);
            }
        })
        .catch(err => console.error('Error al guardar tutor:', err));
    });
});