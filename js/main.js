const CONFIG = { grupoWA: "https://chat.whatsapp.com/I0pJazhm3ur5MAq9D9YkhU?s=cl&p=a&iam=2" };
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const escapar = (str) => String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function avisar(texto) {
  const toast = $("#toast"); 
  if (!toast) return;
  $("#toast-texto").textContent = texto;
  toast.classList.add("visible"); 
  clearTimeout(avisar._t);
  avisar._t = setTimeout(() => toast.classList.remove("visible"), 2600);
}

/* ===== CLIMA (Open-Meteo) ===== */
const CIUDADES = [{ nombre: "Posadas", lat: -27.39, lon: -55.92 }, { nombre: "Oberá", lat: -27.48, lon: -55.12 }, { nombre: "Eldorado", lat: -26.4, lon: -54.62 }, { nombre: "Puerto Iguazú", lat: -25.6, lon: -54.57 }];
const ICONO_CLIMA = {
  sol: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.3" fill="#F5C05A"/><path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" stroke="#E0A02F" stroke-width="1.7"/></svg>',
  parcial: '<svg viewBox="0 0 24 24" fill="none"><circle cx="8.6" cy="8.6" r="3.1" fill="#F5C05A"/><path d="M8.6 3.2v1.5M3.2 8.6h1.5M4.7 4.7l1 1" stroke="#E0A02F" stroke-width="1.6"/><path d="M8 18.4h9.4a3.4 3.4 0 0 0 .3-6.8 4.9 4.9 0 0 0-9.4 1.1A2.9 2.9 0 0 0 8 18.4z" fill="#E4EEE8" stroke="#7B8A83" stroke-width="1.4"/></svg>',
  nublado: '<svg viewBox="0 0 24 24" fill="none"><path d="M6.8 18.2h10a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-9.9 1.2 3.1 3.1 0 0 0-.4 6z" fill="#E1E8E4" stroke="#7B8A83" stroke-width="1.4"/></svg>',
  lluvia: '<svg viewBox="0 0 24 24" fill="none"><path d="M6.8 15.4h10a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-9.9 1.2 3.1 3.1 0 0 0-.4 6z" fill="#E1E8E4" stroke="#6D7F78" stroke-width="1.4"/><path d="M8.6 18.2l-.9 2.3M12 18.2l-.9 2.3M15.4 18.2l-.9 2.3" stroke="#4A7FA5" stroke-width="1.6"/></svg>',
  tormenta: '<svg viewBox="0 0 24 24" fill="none"><path d="M6.8 14.6h10a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-9.9 1.2 3.1 3.1 0 0 0-.4 6z" fill="#DFE3E6" stroke="#5F6B72" stroke-width="1.4"/><path d="M12.6 15.6l-2.4 3.4h2.2l-1 3 3.4-4.2h-2.2l1-2.2z" fill="#E0A02F"/></svg>',
  niebla: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 9h16M6 13h12M4 17h16" stroke="#8A9A92" stroke-width="1.8"/></svg>',
  nieve: '<svg viewBox="0 0 24 24" fill="none"><path d="M6.8 14.6h10a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-9.9 1.2 3.1 3.1 0 0 0-.4 6z" fill="#E4EEF3" stroke="#7FA8C9" stroke-width="1.4"/><circle cx="9" cy="18.6" r="1.1" fill="#7FA8C9"/><circle cx="13" cy="19.6" r="1.1" fill="#7FA8C9"/></svg>'
};
function grupoClima(c) { if (c === 0) return ["sol", "Despejado"]; if (c <= 2) return ["parcial", "Parcialmente nublado"]; if (c === 3) return ["nublado", "Nublado"]; if (c === 45 || c === 48) return ["niebla", "Niebla"]; if (c >= 51 && c <= 57) return ["lluvia", "Llovizna"]; if (c >= 61 && c <= 67) return ["lluvia", "Lluvia"]; if (c >= 71 && c <= 77) return ["nieve", "Nieve"]; if (c >= 80 && c <= 82) return ["lluvia", "Chaparrones"]; if (c >= 85 && c <= 86) return ["nieve", "Nieve"]; if (c >= 95) return ["tormenta", "Tormenta"]; return ["nublado", "Variable"]; }

async function cargarClima() {
  const cont = $("#clima-contenedor"); 
  if (!cont) return;
  const latitudes = CIUDADES.map(c => c.lat).join(","), longitudes = CIUDADES.map(c => c.lon).join(",");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=1`;
  
  try {
    const res = await fetch(url); 
    const datos = await res.json();
    const lista = (Array.isArray(datos) ? datos : [datos]).map((d, i) => ({ nombre: CIUDADES[i].nombre, temp: Math.round(d.current.temperature_2m), codigo: d.current.weather_code, max: Math.round(d.daily.temperature_2m_max[0]), min: Math.round(d.daily.temperature_2m_min[0]) }));
    cont.innerHTML = lista.map(c => { const [ico, etq] = grupoClima(c.codigo); return `<article class="clima-ciudad"><span class="clima-nombre">${escapar(c.nombre)}</span><div class="clima-fila"><span class="clima-temp">${c.temp}°</span><span class="clima-icono">${ICONO_CLIMA[ico]}</span></div><p class="clima-estado">${etq}</p><p class="clima-minmax">máx ${c.max}° · mín ${c.min}°</p></article>`; }).join("");
    cont.setAttribute("aria-busy", "false");
  } catch { 
    cont.innerHTML = '<p class="clima-error" style="grid-column:1/-1;text-align:center;padding:20px;color:#6B7280">Clima no disponible.</p>'; 
    cont.setAttribute("aria-busy", "false"); 
  }
}

/* ===== NOTICIAS (RSS a JSON) ===== */
const FUENTES_NOTICIAS = [
  { nombre: "MisionesOnline", rss: "https://misionesonline.net/feed/" },
  { nombre: "Canal Doce", rss: "https://www.canal12misiones.com/feed/" },
  { nombre: "Tiempo Misionero", rss: "https://tiempomisionero.com.ar/feed/" },
  { nombre: "Primera Edición", rss: "https://www.primeraedicion.com.ar/feed/" }
];

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

function fechaDe(cadena) { if (!cadena) return null; if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cadena)) return new Date(cadena.replace(" ", "T") + "Z"); const f = new Date(cadena); return isNaN(f.getTime()) ? null : f; }
function haceRato(iso) { const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000); if (min < 1) return "ahora"; if (min < 60) return `hace ${min} min`; const hrs = Math.round(min / 60); if (hrs < 24) return `hace ${hrs} h`; const dias = Math.round(hrs / 24); if (dias === 1) return "ayer"; return `hace ${dias} días`; }

async function pedirJSON(url, ms) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), ms);
  try {
    const respuesta = await fetch(url, { signal: control.signal, mode: "cors" });
    if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
    return await respuesta.json();
  } finally { clearTimeout(reloj); }
}

async function traerFuente(fuente, indice) {
  if (indice) await esperar(indice * 300);
  const url = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(fuente.rss) + "&count=8";
  const json = await pedirJSON(url, 9000);
  if (json.status !== "ok" || !Array.isArray(json.items)) throw new Error("feed vacío");
  return json.items.map((item) => ({
    titulo: (item.title || "").trim(),
    url: item.link,
    fecha: (fechaDe(item.pubDate) || new Date()).toISOString(),
    fuente: fuente.nombre
  }));
}

async function traerSigmaDiario() {
  const json = await pedirJSON("https://sigmadiario.com/api/v1/noticias?q=Misiones&limit=8", 8000);
  return (json.data || []).map((nota) => ({
    titulo: (nota.titulo || "").trim(),
    url: nota.url,
    fecha: (fechaDe(nota.fecha) || new Date()).toISOString(),
    fuente: "SigmaDiario"
  }));
}

async function cargarNoticias() {
  const cont = $("#noticias-contenedor"); 
  if (!cont) return;
  
  let items = [];
  const respuestas = await Promise.allSettled(FUENTES_NOTICIAS.map(traerFuente));
  respuestas.forEach(r => { if (r.status === "fulfilled") items = items.concat(r.value); });

  if (items.length < 3) {
    try { items = items.concat(await traerSigmaDiario()); } catch {}
  }

  const vistos = new Set(); const ahora = Date.now();
  items = items.filter(n => {
    if (!n.titulo || !n.url) return false;
    if (ahora - new Date(n.fecha).getTime() > 40 * 86400000) return false;
    const k = n.titulo.toLowerCase().slice(0, 40); if (vistos.has(k)) return false; vistos.add(k); return true;
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (!items.length) {
    cont.innerHTML = '<li class="noticias-error" style="grid-column:1/-1;text-align:center;padding:24px;color:#6B7280">No se pudieron cargar las noticias.</li>';
    cont.setAttribute("aria-busy", "false"); return;
  }
  
  cont.innerHTML = items.slice(0, 6).map(n => `<li class="noticia"><a href="${escapar(n.url)}" target="_blank" rel="noopener nofollow"><span class="noticia-texto"><span class="noticia-fuente">${escapar(n.fuente)} · ${haceRato(n.fecha)}</span><span class="noticia-titulo">${escapar(n.titulo)}</span></span><svg class="noticia-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg></a></li>`).join("");
  cont.setAttribute("aria-busy", "false");
}

/* ===== INIT & PWA ===== */
let promptInstalar = null;

function mostrarBotonInstalar(mostrar) { 
  const b = $("#btn-instalar-barra"); 
  if (b) b.classList.toggle("visible", mostrar); 
}

async function instalar() { 
  if (!promptInstalar) return; 
  promptInstalar.prompt(); 
  const e = await promptInstalar.userChoice; 
  if (e.outcome === "accepted") avisar("Instalando..."); 
  promptInstalar = null; 
  mostrarBotonInstalar(false); 
}

window.addEventListener("beforeinstallprompt", (e) => { 
  e.preventDefault(); 
  promptInstalar = e; 
  mostrarBotonInstalar(true); 
});

window.addEventListener("appinstalled", () => { 
  promptInstalar = null; 
  mostrarBotonInstalar(false); 
  avisar("App instalada"); 
});

function iniciar() {
  const anioEl = $("#anio");
  if (anioEl) anioEl.textContent = new Date().getFullYear();
  
  document.querySelectorAll("[data-grupo]").forEach(a => { a.href = CONFIG.grupoWA; });

  const header = $("#header"); const barra = $("#barra-movil");
  const alScrollear = () => { 
    if (header) header.classList.toggle("con-sombra", window.scrollY > 8); 
    if (barra) barra.classList.toggle("visible", window.scrollY > 400); 
  };
  window.addEventListener("scroll", alScrollear, { passive: true }); 
  alScrollear();

  cargarClima(); 
  cargarNoticias();
  
  const btnBarra = $("#btn-instalar-barra");
  if (btnBarra) btnBarra.addEventListener("click", instalar);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", iniciar);