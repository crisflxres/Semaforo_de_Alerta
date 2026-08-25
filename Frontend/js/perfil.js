document.addEventListener("DOMContentLoaded", () => {

    // 1. CONTROL DEL DROPDOWN DE PERFIL (HEADER)
    const avatarUsuario = document.getElementById("avatarUsuario");
    const dropdownPerfil = document.getElementById("dropdownPerfil");

    if (avatarUsuario && dropdownPerfil) {
        avatarUsuario.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownPerfil.classList.toggle("open");
        });
    }

    // 2. CONTROL DEL SIDEBAR FLOTANTE LATERAL
    const btnHamburguesa = document.getElementById("btnHamburguesa");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const btnCerrarSidebar = document.getElementById("btnCerrarSidebar");

    if (btnHamburguesa && sidebarOverlay) {
        btnHamburguesa.addEventListener("click", () => {
            sidebarOverlay.classList.add("open");
        });
    }

    if (btnCerrarSidebar && sidebarOverlay) {
        btnCerrarSidebar.addEventListener("click", () => {
            sidebarOverlay.classList.remove("open");
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", (e) => { 
            if (e.target === sidebarOverlay) {
                sidebarOverlay.classList.remove("open");
            }
        });
    }

    // 3. CIERRE GLOBAL AL HACER CLIC FUERA
    document.addEventListener("click", (e) => {
        if (dropdownPerfil && avatarUsuario && !avatarUsuario.contains(e.target)) {
            dropdownPerfil.classList.remove("open");
        }
    });

    // 4. MOSTRAR CARGO SEGÚN EL ROL
    const CARGOS_POR_ROL = {
        1: "Administrador",
        2: "Docente",
        3: "Tutor Académico",
        4: "Alumno",
        5: "Docente/Tutor"
    };

    const elCargo = document.getElementById("txt-cargo");
    const rolActual = parseInt(localStorage.getItem("rolUsuario"));

    if (elCargo) {
        elCargo.textContent = CARGOS_POR_ROL[rolActual] || "---";
    }

    const elNombre = document.getElementById("txt-nombre-usuario");
    const nombreGuardado = localStorage.getItem("nombreUsuario");
    if (elNombre) {
        elNombre.textContent = nombreGuardado ? nombreGuardado.toUpperCase() : "USUARIO";
    }

    const elCorreo = document.getElementById("txt-correo-usuario");
    const correoGuardado = localStorage.getItem("correoUsuario");
    if (elCorreo) {
        elCorreo.textContent = correoGuardado || "correo no disponible";
        elCorreo.href = correoGuardado ? `mailto:${correoGuardado}` : "#";
    }

// 5. CERRAR SESIÓN
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("rolUsuario");
            localStorage.removeItem("nombreUsuario");
            window.location.href = "index.html";
        });
    }

});
