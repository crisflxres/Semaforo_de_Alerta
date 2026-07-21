// Cambia esta URL por la ruta real de tu backend Flask
const RECOVERY_ENDPOINT = "https://semaforo-de-alerta.onrender.com/api/recuperar-password";
const form = document.getElementById("recoverForm");
const btn = document.getElementById("sendBtn");
const feedback = document.getElementById("feedback");
const emailInput = document.getElementById("email");

function showMessage(text, type){
  feedback.textContent = text;
  feedback.className = "msg show " + type;
} 

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback.className = "msg";

  const email = emailInput.value.trim();
  if(!email){
    showMessage("Por favor ingresa tu correo electrónico.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const response = await fetch(RECOVERY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await response.json().catch(() => ({}));

    if(response.ok){
      showMessage(data.message || "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.", "success");
      form.reset();
    } else {
      showMessage(data.message || "No pudimos procesar tu solicitud. Intenta de nuevo.", "error");
    }
  } catch (err){
    showMessage("Error de conexión con el servidor. Intenta más tarde.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Enviar Enlace";
  }
});