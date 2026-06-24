document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Control del Menú Lateral (Sidebar) 
    const sidebar = document.getElementById('sidebarMenu');
    const btnAbrir = document.getElementById('btnAbrirMenu');
    const btnCerrar = document.getElementById('btnCerrar');

    if (btnAbrir && sidebar && btnCerrar) {
        btnAbrir.addEventListener('click', () => sidebar.classList.add('open'));
        btnCerrar.addEventListener('click', () => sidebar.classList.remove('open'));
        
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') sidebar.classList.remove('open');
        });
    }

    // 2. Control del Menú de Avatar 
    const btnAvatar = document.querySelector('.contenedor-avatar');
    const menuPerfil = document.querySelector('.menu-perfil-desplegable');

    if (btnAvatar && menuPerfil) {
        btnAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menuPerfil.style.display === 'block';
            menuPerfil.style.display = isVisible ? 'none' : 'block';
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', () => {
            menuPerfil.style.display = 'none';
        });
    }

    // 3. Motor de Renderizado de Seguimiento 
    // función que se ejecuta cuando el importador tenga los datos listos
    const cuerpoTabla = document.getElementById('cuerpo-tabla-seguimiento');

    window.renderizarSeguimiento = function(datos) {
        // Actualizar indicadores superiores
        document.getElementById('total-materias').textContent = `Total de materias: ${datos.total}`;
        document.getElementById('materias-reprobadas').textContent = `Materias reprobadas: ${datos.reprobadas}`;
        document.getElementById('estado-desempeño').textContent = `Estado: ${datos.estado}`;

        // Limpiar tabla y rellenar con nuevas filas
        cuerpoTabla.innerHTML = '';
        
        datos.materias.forEach(materia => {
            const fila = document.createElement('div');
            fila.className = 'fila-materia-renglon';
            fila.innerHTML = `
                <div class="txt-materia">${materia.nombre}</div>
                <div class="txt-nota">${materia.p1}</div>
                <div class="txt-nota">${materia.p2}</div>
                <div class="txt-nota">${materia.p3}</div>
                <div class="txt-nota">${materia.pr}</div>
            `;
            cuerpoTabla.appendChild(fila);
        });
    };
});