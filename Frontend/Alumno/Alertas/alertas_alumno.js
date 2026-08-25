// Plantilla para el detalle de la alerta (vista alumno)
const PLANTILLA_GENERAL = {
    asunto: "Situación Académica de {alumno} - Estatus: {estatus}",
    mensaje: `Estimado(a) {destinatario}:

Por medio de la presente, le informamos sobre la situación académica del alumno(a) {alumno}, con matrícula {matricula}, perteneciente al grupo {grupo} de la carrera de {carrera}.

De acuerdo con los registros académicos, el estudiante mantiene actualmente un estatus académico {estatus}, con un Promedio de Aprovechamiento Académico (PAC) de {pac} y {reprobadas} materia(s) en situación de riesgo.

Le invitamos a dar seguimiento a esta información y, de ser necesario, mantener comunicación con la institución y los docentes correspondientes para favorecer el desempeño académico del estudiante.

Atentamente,
Coordinación Académica Institucional CECyTE Hidalgo`
};

document.addEventListener('DOMContentLoaded', () => {

    // 1. Control del Menú Lateral 
    const sidebar = document.getElementById('sidebarMenu');
    const btnAbrir = document.querySelector('.menu-btn-global');
    const btnCerrar = document.getElementById('btnCerrar');

     if (btnAbrir && sidebar && btnCerrar) {
        btnAbrir.addEventListener('click', () => {
            sidebar.classList.add('open');
        });

        btnCerrar.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });

        sidebar.addEventListener('click', (e) => {
            if (e.target === sidebar) {
                sidebar.classList.remove('open');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                sidebar.classList.remove('open');
            }
        });
    }

    // 2. Control del Menú de Avatar (Cerrar Sesión) 
    const btnAvatar = document.querySelector('.contenedor-avatar');
    const menuPerfil = document.querySelector('.menu-perfil-desplegable');

    if (btnAvatar && menuPerfil) {
        btnAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menuPerfil.style.display === 'block';
            menuPerfil.style.display = isVisible ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            menuPerfil.style.display = 'none';
        });
    }

    // 2.5. Mostrar inicial del usuario en el avatar
    const avatarLetra = document.getElementById('avatarUsuario');
    const nombreUsuario = localStorage.getItem('nombreUsuario');
    if (avatarLetra && nombreUsuario) {
        avatarLetra.textContent = nombreUsuario.trim().charAt(0).toUpperCase();
    }


    // 3. Lógica de Filtros
    const botonesFiltro = document.querySelectorAll('.btn-filtro');
    let filtroEstadoActual = 'todas';

    const MAPA_ESTADO = {
        'regulares': 'Verde',
        'en-riesgo': 'Amarillo',
        'criticas': 'Rojo'
    };

    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesFiltro.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');
            filtroEstadoActual = boton.dataset.filtro;
            aplicarFiltros();
        });
    });

    function aplicarFiltros() {
        let resultado = todasLasAlertas;

        if (filtroEstadoActual !== 'todas') {
            const nivelEsperado = MAPA_ESTADO[filtroEstadoActual];
            resultado = resultado.filter(a => a.titulo === nivelEsperado);
        }

        const fechaSeleccionada = document.getElementById('inputFecha').value; // formato yyyy-mm-dd
        if (fechaSeleccionada) {
            const [anio, mes, dia] = fechaSeleccionada.split('-');
            const fechaFormateada = `${dia}/${mes}/${anio}`;
            resultado = resultado.filter(a => a.fecha === fechaFormateada);
        }

        renderizarAlertas(resultado);
    }

    // 4. Lógica de Fecha 
    const inputFecha = document.getElementById('inputFecha');
    const contenedorFecha = document.querySelector('.input-fecha-contenedor');

    if (contenedorFecha && inputFecha) {
        contenedorFecha.addEventListener('click', () => {
            inputFecha.showPicker();
        });
        inputFecha?.addEventListener('change', () => {
    aplicarFiltros();
});
    }

    // 5. Renderizado Dinámico de Alertas 
    const contenedorAlertas = document.getElementById('contenedor-alertas');
    let alertasCargadas = [];   // lo que está actualmente pintado en pantalla
    let todasLasAlertas = [];   // copia completa sin filtrar, para poder filtrar y re-filtrar

    window.renderizarAlertas = function (listaAlertas) {
        alertasCargadas = listaAlertas; // Actualizamos la referencia para "Ver detalle"
        contenedorAlertas.innerHTML = ''; // Limpiamos antes de inyectar

        listaAlertas.forEach(alerta => {
            const div = document.createElement('div');
            div.className = 'tarjeta-alerta';
            div.dataset.id = alerta.id; // Asignamos ID único aquí

            div.innerHTML = `
                <div class="barra-lateral" style="background-color: ${alerta.color_hex};"></div>
                <div class="alerta-contenido">
                    <div class="alerta-encabezado">
                        <h2>${alerta.titulo}</h2>
                        <span class="alerta-fecha">${alerta.fecha} &nbsp;&nbsp; ${alerta.hora}</span>
                    </div>
                    <p class="alerta-descripcion">
                        Alumno(a) <span>${alerta.alumno}</span>, matrícula <span>${alerta.matricula}</span>, 
                        grupo <span>${alerta.grupo}</span>.
                    </p>
                </div>
                <button class="btn-detalle">Ver detalle</button>
            `;
            contenedorAlertas.appendChild(div);
        });
    };

    // 5.1 Cargar alertas del alumno desde Flask
    const matricula = localStorage.getItem('matriculaSeleccionada');

    if (matricula) {
        fetch(`https://semaforo-de-alerta-f2kf.onrender.com/api/alertas/${matricula}`)
            .then(res => res.json())
            .then(data => {
                todasLasAlertas = data;
                aplicarFiltros();
                })
            .catch(err => console.error('Error cargando alertas:', err));
    } else {
        console.warn('No hay matrícula guardada en localStorage.');
    }

    // 6. Delegación de eventos para el botón "Ver detalle" 
    contenedorAlertas.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-detalle')) {
            const tarjeta = e.target.closest('.tarjeta-alerta');
            const idAlerta = tarjeta.dataset.id;

            const alerta = alertasCargadas.find(a => String(a.id) === String(idAlerta));
            if (!alerta) return;

            abrirModalDetalle(alerta);
        }
    });

    function abrirModalDetalle(alerta) {
        const asunto = PLANTILLA_GENERAL.asunto
            .replace('{alumno}', alerta.alumno)
            .replace('{estatus}', alerta.titulo);

        const mensaje = PLANTILLA_GENERAL.mensaje
            .replace('{destinatario}', alerta.alumno)
            .replace('{alumno}', alerta.alumno)
            .replace('{matricula}', alerta.matricula)
            .replace('{grupo}', alerta.grupo)
            .replace('{carrera}', alerta.carrera)
            .replace('{estatus}', alerta.titulo)
            .replace('{pac}', alerta.pac)
            .replace('{reprobadas}', alerta.materias_reprobadas);

        document.getElementById('modalDetalleAsunto').textContent = asunto;
        document.getElementById('modalDetalleMensaje').textContent = mensaje;
        document.getElementById('modalDetalleAlerta').classList.add('abierto');
    }

    document.getElementById('btnCerrarModalDetalle')?.addEventListener('click', () => {
        document.getElementById('modalDetalleAlerta').classList.remove('abierto');
    });

    document.getElementById('modalDetalleAlerta')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalDetalleAlerta') {
            e.currentTarget.classList.remove('abierto');
        }
    });

});
