// Guarda la función fetch original
const fetchOriginal = window.fetch;

// La reemplaza con una versión que agrega el header del rol automáticamente
window.fetch = function (url, opciones = {}) {
    const rol = localStorage.getItem('rolUsuario');

    opciones.headers = {
        ...(opciones.headers || {}),
        'X-Id-Rol': rol
    };

    return fetchOriginal(url, opciones);
};