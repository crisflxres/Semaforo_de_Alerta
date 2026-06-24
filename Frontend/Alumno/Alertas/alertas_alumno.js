document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Control del Menú Lateral 
    const sidebar = document.getElementById('sidebarMenu');
    const btnAbrir = document.querySelector('.menu-btn-global');
    const btnCerrar = document.getElementById('btnCerrar');

    if (btnAbrir && sidebar && btnCerrar) {
        btnAbrir.addEventListener('click', () => sidebar.classList.add('open'));
        btnCerrar.addEventListener('click', () => sidebar.classList.remove('open'));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') sidebar.classList.remove('open');
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

    // 3. Lógica de Filtros
    const botonesFiltro = document.querySelectorAll('.btn-filtro');
    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesFiltro.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');
        });
    });

    // 4. Lógica de Fecha 
    const inputFecha = document.getElementById('inputFecha');
    const contenedorFecha = document.querySelector('.input-fecha-contenedor');
    
    if (contenedorFecha && inputFecha) {
        contenedorFecha.addEventListener('click', () => {
            inputFecha.showPicker();
        });
    }

    // 5. Renderizado Dinámico de Alertas 
    const contenedorAlertas = document.getElementById('contenedor-alertas');

    window.renderizarAlertas = function(listaAlertas) {
        contenedorAlertas.innerHTML = ''; // Limpiamos antes de inyectar

        listaAlertas.forEach(alerta => {
            const div = document.createElement('div');
            div.className = 'tarjeta-alerta';
            div.dataset.id = alerta.id; // Asignamos ID único aquí
            
            div.innerHTML = `
                <div class="barra-lateral ${alerta.tipo}"></div>
                <div class="alerta-contenido">
                    <div class="alerta-encabezado">
                        <h2>${alerta.titulo}</h2>
                        <span class="alerta-fecha">${alerta.fecha} &nbsp;&nbsp; ${alerta.hora}</span>
                    </div>
                    <p class="alerta-descripcion">
                        Estimado(a) <span>${alerta.destinatario}</span>:<br>
                        Nos complace informarle que el alumno(a) <span>${alerta.alumno}</span>, 
                        con matrícula <span>${alerta.matricula}</span>, perteneciente al grupo <span>${alerta.grupo}</span>
                    </p>
                </div>
                <button class="btn-detalle">Ver detalle</button>
            `;
            contenedorAlertas.appendChild(div);
        });
    };

    // 6. Delegación de eventos para el botón "Ver detalle" 
    contenedorAlertas.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-detalle')) {
            const tarjeta = e.target.closest('.tarjeta-alerta');
            const idAlerta = tarjeta.dataset.id;
            console.log("Accediendo al detalle de la alerta ID:", idAlerta);
            
            // Aquí llamarás a tu función que abre el Modal o despliega el detalle
            // abrirModalDetalle(idAlerta); 
        }
    });
});