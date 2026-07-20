// Cambia esta URL por la ruta real de tu backend Flask
const RESET_ENDPOINT = "https://semaforo-de-alerta.onrender.com/api/nueva-password";

const form = document.getElementById("newPasswordForm");
const btn = document.getElementById("saveBtn");
const feedback = document.getElementById("feedback");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");
const hint = document.getElementById("passwordHint");

const MIN_LENGTH = 8;

// El token normalmente llega por la URL, ej: nueva_contrasena.html?token=xxxx
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

function showMessage(text, type){
  feedback.textContent = text;
  feedback.className = "msg show " + type;
}

function clearFieldErrors(){
  passwordInput.classList.remove("input-error");
  confirmInput.classList.remove("input-error");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback.className = "msg";
  clearFieldErrors();

  const password = passwordInput.value;
  const confirmPassword = confirmInput.value;

  if(password.length < MIN_LENGTH){
    passwordInput.classList.add("input-error");
    showMessage(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`, "error");
    return;
  }

  if(password !== confirmPassword){
    confirmInput.classList.add("input-error");
    showMessage("Las contraseñas no coinciden.", "error");
    return;
  }

  if(!token){
    showMessage("El enlace no es válido o ha expirado. Solicita uno nuevo.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    const response = await fetch(RESET_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });

    const data = await response.json().catch(() => ({}));

    if(response.ok){
      showMessage(data.message || "Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.", "success");
      form.reset();
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    } else {
      showMessage(data.message || "No pudimos actualizar tu contraseña. Intenta de nuevo.", "error");
    }
  } catch (err){
    showMessage("Error de conexión con el servidor. Intenta más tarde.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar";
  }
}); 