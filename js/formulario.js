document.addEventListener("DOMContentLoaded", () => {
  const WHATSAPP_NUMBER = "5493765168963";
  const form = document.getElementById("registrationForm");

  if (!form) return;

  form.addEventListener("submit", function(event) {
    event.preventDefault();
    
    // Validación nativa de HTML5
    if (!form.reportValidity()) return;

    // Obtener valores
    const get = id => document.getElementById(id).value.trim();
    
    const owner = get("owner");
    const city = get("city");
    const phone = get("phone");
    const business = get("business");
    const category = get("category");
    const description = get("description");
    const products = get("products");
    const instagram = get("instagram");
    const facebook = get("facebook");

    // Construir mensaje
    const message = `
🌱 *NUEVA INSCRIPCIÓN*
*EMPRENDIMIENTOS MISIONEROS*
━━━━━━━━━━━━━━━━━━
👤 *DATOS DEL EMPRENDEDOR*
Nombre: ${owner}
Localidad: ${city}
WhatsApp: ${phone}
━━━━━━━━━━━━━━━━━━
🏪 *DATOS DEL EMPRENDIMIENTO*
Nombre: ${business}
Rubro: ${category}
Descripción:
${description}
Productos / Servicios:
${products || "No especificado"}
━━━━━━━━━━━━━━━━━━
📱 *REDES SOCIALES*
Instagram: ${instagram || "No especificado"}
Facebook / Web: ${facebook || "No especificado"}
━━━━━━━━━━━━━━━━━━
⚠️ *RECORDATORIO:* No olvides enviar una foto de tu emprendimiento por este medio para poder publicarte.
    `.trim();

    // Redireccionar
    const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    window.location.href = url;
  });
});