const CONFIG = { grupoWA: "https://chat.whatsapp.com/I0pJazhm3ur5MAq9D9YkhU?s=cl&p=a&iam=2" };
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const escapar = (str) => String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ===== NOTICIAS (RSS a JSON) ===== */
const FUENTES_NOTICIAS = [
  { nombre: "MisionesOnline", rss: "https://misionesonline.net/feed/" },
  { nombre: "Canal Doce", rss: "https://www.canal12misiones.com/feed/" },
  { nombre: "Tiempo Misionero", rss: "https://tiempomisionero.com.ar/feed/" },
  { nombre: "Primera Edición", rss: "https://www.primeraedicion.com.ar/feed/" }
];

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

function fechaDe(cadena) {
  if (!cadena) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cadena)) return new Date(cadena.replace(" ", "T") + "Z");
  const f = new Date(cadena);
  return isNaN(f.getTime()) ? null : f;
}

function haceRato(iso) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const dias = Math.round(hrs / 24);
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

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
  const respuestas = await Promise.allSettled(FUENTES_NOTICIAS.map((f, i) => traerFuente(f, i)));
  respuestas.forEach(r => { if (r.status === "fulfilled") items = items.concat(r.value); });

  if (items.length < 3) {
    try { items = items.concat(await traerSigmaDiario()); } catch {}
  }

  const vistos = new Set(); const ahora = Date.now();
  items = items.filter(n => {
    if (!n.titulo || !n.url) return false;
    if (ahora - new Date(n.fecha).getTime() > 40 * 86400000) return false;
    const k = n.titulo.toLowerCase().slice(0, 40);
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (!items.length) {
    cont.innerHTML = '<li class="noticias-error" style="grid-column:1/-1;text-align:center;padding:24px;color:#6B7280">No se pudieron cargar las noticias.</li>';
    cont.setAttribute("aria-busy", "false");
    return;
  }

  cont.innerHTML = items.slice(0, 6).map(n =>
    `<li class="noticia"><a href="${escapar(n.url)}" target="_blank" rel="noopener nofollow"><span class="noticia-texto"><span class="noticia-fuente">${escapar(n.fuente)} · ${haceRato(n.fecha)}</span><span class="noticia-titulo">${escapar(n.titulo)}</span></span><svg class="noticia-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg></a></li>`
  ).join("");
  cont.setAttribute("aria-busy", "false");
}

/* ===== MENÚ MÓVIL ===== */
function iniciarMenu() {
  const toggle = $("#menu-toggle");
  const nav = $("#nav");
  if (!toggle || !nav) return;

  const cerrar = () => {
    nav.classList.remove("abierto");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
  };
  const abrir = () => {
    nav.classList.add("abierto");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    nav.classList.contains("abierto") ? cerrar() : abrir();
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) cerrar();
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("abierto")) return;
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    cerrar();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) cerrar();
  });
}

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  // Año dinámico
  const anioEl = $("#anio");
  if (anioEl) anioEl.textContent = new Date().getFullYear();

  // Enlaces de WhatsApp
  document.querySelectorAll("[data-grupo]").forEach(a => { a.href = CONFIG.grupoWA; });

  // Scroll Header
  const header = $("#header");
  const barra = $("#barra-movil");
  const alScrollear = () => {
    if (header) header.classList.toggle("con-sombra", window.scrollY > 8);
    if (barra) barra.classList.toggle("visible", window.scrollY > 400);
  };
  window.addEventListener("scroll", alScrollear, { passive: true });
  alScrollear();

  // Iniciar Módulos
  iniciarMenu();
  cargarNoticias();
});