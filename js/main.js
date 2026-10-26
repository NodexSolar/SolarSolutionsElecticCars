/* Nodex Solar Mobility — interacciones */
(() => {
'use strict';

/* ======== CONFIGURACIÓN (editar acá) ======== */
const CONFIG = {
  whatsapp: '5491176438672',    // número con código de país, sin + ni espacios (54 9 11 7643-8672)
  waMessage: 'Hola Nodex Solar Mobility! Vi su página de cargadores para autos eléctricos y carport solar ¿Me pueden asesorar y pasar una cotización?',

  /* Publicidad y medición: completar y se activan solas (vacío = no se carga nada) */
  gaId: '',            // Google Analytics 4, por ejemplo 'G-XXXXXXXXXX'
  adsId: '',           // Google Ads, por ejemplo 'AW-1234567890'
  adsLeadLabel: '',    // etiqueta de la conversión de Google Ads, por ejemplo 'AbC-D_efG-h12'
  metaPixelId: ''      // Meta Pixel, por ejemplo '123456789012345'
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
document.documentElement.classList.add('js');

/* ======================================================
   MEDICIÓN (Google y Meta) + UTM
   ====================================================== */
const params = new URLSearchParams(location.search);
const attrib = {};
['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(k => {
  if (params.get(k)) attrib[k] = params.get(k);
});
try {
  if (Object.keys(attrib).length) sessionStorage.setItem('nsm_attrib', JSON.stringify(attrib));
  else Object.assign(attrib, JSON.parse(sessionStorage.getItem('nsm_attrib') || '{}'));
} catch (e) { /* sin storage */ }

function loadScript(src) {
  const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s);
}
window.dataLayer = window.dataLayer || [];
window.gtag = function () { window.dataLayer.push(arguments); };
const googleId = CONFIG.gaId || CONFIG.adsId;
if (googleId) {
  loadScript('https://www.googletagmanager.com/gtag/js?id=' + googleId);
  gtag('js', new Date());
  if (CONFIG.gaId) gtag('config', CONFIG.gaId);
  if (CONFIG.adsId) gtag('config', CONFIG.adsId);
}
if (CONFIG.metaPixelId) {
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  fbq('init', CONFIG.metaPixelId);
  fbq('track', 'PageView');
}

/* Eventos: whatsapp_click y generate_lead son las conversiones para Google Ads y Meta */
function track(name, extra = {}) {
  if (googleId) {
    gtag('event', name, extra);
    if (CONFIG.adsId && CONFIG.adsLeadLabel && (name === 'whatsapp_click' || name === 'generate_lead')) {
      gtag('event', 'conversion', { send_to: CONFIG.adsId + '/' + CONFIG.adsLeadLabel });
    }
  }
  if (window.fbq && CONFIG.metaPixelId) {
    if (name === 'whatsapp_click') fbq('track', 'Contact', extra);
    else if (name === 'generate_lead') fbq('track', 'Lead', extra);
    else fbq('trackCustom', name, extra);
  }
}

/* ======================================================
   APARICIÓN AL HACER SCROLL
   ====================================================== */
const rv = $$('.tiles button, .steps article, .three > div, .feat figure, .checks li, .pack, .contact-photo, .form, .qa');
rv.forEach(el => el.classList.add('rv'));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .1, rootMargin: '0px 0px -30px 0px' });
  rv.forEach(el => io.observe(el));
} else rv.forEach(el => el.classList.add('in'));

/* ======================================================
   RUBRO / PACK ELEGIDOS
   ====================================================== */
const fRubro = $('#fRubro'), fPack = $('#fPack');
$$('.tiles button').forEach(b => b.addEventListener('click', () => {
  if (fRubro) fRubro.value = b.dataset.rubro;
  track('select_rubro', { rubro: b.dataset.rubro });
  $('#contacto').scrollIntoView({ behavior: 'smooth' });
}));
$$('[data-pack]').forEach(a => a.addEventListener('click', () => {
  if (fPack) fPack.value = a.dataset.pack;
}));

/* ======================================================
   WHATSAPP: botón flotante y botones "Cotizar"
   ====================================================== */
const waLink = text => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text || CONFIG.waMessage)}`;
$$('[data-wa]').forEach(a => {
  a.href = waLink(); a.target = '_blank'; a.rel = 'noopener';
  a.addEventListener('click', () => track('whatsapp_click', { link_location: a.id || a.dataset.pack || a.textContent.trim().slice(0, 30) }));
});
const waFloat = $('#waFloat');
const showWa = () => waFloat.classList.toggle('show', scrollY > 500);
addEventListener('scroll', showWa, { passive: true }); showWa();

/* formulario → WhatsApp */
$('#contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, v = n => f.elements[n].value.trim();
  const msg = $('#formMsg');
  if (!v('nombre')) { msg.textContent = 'Escribí tu nombre para poder responderte.'; f.elements.nombre.focus(); return; }
  const origen = attrib.utm_source ? [attrib.utm_source, attrib.utm_campaign].filter(Boolean).join(' / ') : '';
  const lines = [
    CONFIG.waMessage,
    `Nombre: ${v('nombre')}`,
    v('empresa') && `Empresa: ${v('empresa')}`,
    `Rubro: ${v('rubro')}`,
    v('ciudad') && `Ciudad: ${v('ciudad')}`,
    v('pack') && v('pack') !== 'Todavía no sé' && `Pack de interés: ${v('pack')}`,
    origen && `Origen: ${origen}`
  ].filter(Boolean);
  track('generate_lead', { rubro: v('rubro'), pack: v('pack') });
  window.open(waLink(lines.join('\n')), '_blank', 'noopener');
  msg.textContent = 'Listo: se abrió WhatsApp con tu consulta.';
});

/* ======================================================
   MAPA DE PUNTOS DE CARGA (OpenStreetMap, se carga al acercarse)
   ====================================================== */
const mapEl = $('#map');
let mapLoaded = false;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function initMap() {
  if (mapLoaded) return; mapLoaded = true;
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  document.head.appendChild(css);
  const js = document.createElement('script');
  js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  js.onload = () => fetch('data/estaciones-ev-buenos-aires.json').then(r => r.json()).then(drawMap).catch(() => {
    mapEl.innerHTML = '<p class="map-fallback">No se pudo cargar el mapa. Probá de nuevo más tarde.</p>';
  });
  js.onerror = () => { mapEl.innerHTML = '<p class="map-fallback">No se pudo cargar el mapa.</p>'; };
  document.head.appendChild(js);
}

function drawMap(data) {
  mapEl.innerHTML = '';
  const map = L.map(mapEl, { scrollWheelZoom: false, tap: false }).setView([-34.62, -58.47], 10);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  const pts = [];
  data.estaciones.forEach(e => {
    const dc = e.s.some(x => /CCS|CHAdeMO/.test(x));
    const color = e.s.length ? (dc ? '#1a9f5b' : '#EF9F27') : '#8a8a80';
    const m = L.circleMarker([e.lat, e.lon], { radius: 9, weight: 2, color: '#fff', fillColor: color, fillOpacity: .95 }).addTo(map);
    const rows = [
      e.o && `<span class="pp">Operador: ${esc(e.o)}</span>`,
      e.s.length && `<span class="pp">Conectores: ${esc(e.s.join(', '))}</span>`,
      e.c && `<span class="pp">Puntos de carga: ${esc(e.c)}</span>`,
      e.a && `<span class="pp">${esc(e.a)}</span>`,
      e.h && `<span class="pp">Horario: ${esc(e.h)}</span>`,
      e.f && `<span class="pp">${esc(e.f)}</span>`
    ].filter(Boolean).join('');
    const osm = `https://www.openstreetmap.org/${e.id[0] === 'n' ? 'node' : 'way'}/${e.id.slice(1)}`;
    m.bindPopup(`<b>${esc(e.n)}</b>${rows}<span class="pp"><a href="${osm}" target="_blank" rel="noopener">Ver en OpenStreetMap</a></span>`);
    pts.push([e.lat, e.lon]);
  });
  $('#mapCount').textContent = String(data.total);
  map.on('click', () => map.scrollWheelZoom.enable());
  $$('.map-tools .chip-btn').forEach(b => b.addEventListener('click', () => {
    $$('.map-tools .chip-btn').forEach(x => x.classList.toggle('on', x === b));
    if (b.dataset.view === 'prov') map.fitBounds(pts, { padding: [30, 30] });
    else map.setView([-34.62, -58.47], 10);
    track('map_view', { view: b.dataset.view });
  }));
}
if ('IntersectionObserver' in window) {
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { initMap(); o.disconnect(); } }, { rootMargin: '400px' }).observe(mapEl);
} else initMap();
})();
