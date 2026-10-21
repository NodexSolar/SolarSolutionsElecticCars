/* Nodex E-Mobility — interacciones */
(() => {
'use strict';

/* ======== CONFIGURACIÓN (editar acá) ======== */
const CONFIG = {
  whatsapp: '5491176438672'   // número con código de país, sin + ni espacios (54 9 11 7643-8672)
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

document.documentElement.classList.add('js');

/* aparición al hacer scroll */
const rv = $$('.tiles button, .steps article, .three > div, .feat figure, .checks li, .pack, .contact-photo, .form');
rv.forEach(el => el.classList.add('rv'));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .1, rootMargin: '0px 0px -30px 0px' });
  rv.forEach(el => io.observe(el));
} else rv.forEach(el => el.classList.add('in'));

/* rubro y pack elegidos (se usan en el mensaje de WhatsApp) */
let rubro = '', pack = '';
const fRubro = $('#fRubro'), fPack = $('#fPack');

$$('.tiles button').forEach(b => b.addEventListener('click', () => {
  rubro = b.dataset.rubro;
  if (fRubro) fRubro.value = rubro;
  $('#contacto').scrollIntoView({ behavior: 'smooth' });
}));
if (fRubro) fRubro.addEventListener('change', () => { rubro = fRubro.value; });

$$('[data-pack]').forEach(a => a.addEventListener('click', () => {
  pack = a.dataset.pack;
  if (fPack) fPack.value = pack;
}));

/* WhatsApp: botón flotante y botones "Cotizar" */
function waUrl() {
  const lines = [
    'Hola Nodex E-Mobility! Vi su página de cargadores para autos eléctricos y carport solar.',
    'Tengo un estacionamiento y quiero sumar cargadores para generar ingresos cobrando la energía, ahorrar y consolidar a mis clientes.',
    rubro && `Mi rubro: ${rubro}.`,
    pack && `Me interesa: ${pack}.`,
    '¿Me pueden asesorar y pasar una cotización?'
  ].filter(Boolean);
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join(' '))}`;
}
$$('[data-wa]').forEach(a => {
  a.href = waUrl(); a.target = '_blank'; a.rel = 'noopener';
  a.addEventListener('click', () => { a.href = waUrl(); });
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
  const lines = [
    'Hola Nodex E-Mobility! Quiero cotizar cargadores para autos eléctricos y carport solar.',
    `Nombre: ${v('nombre')}`,
    v('empresa') && `Empresa: ${v('empresa')}`,
    `Rubro: ${v('rubro')}`,
    v('ciudad') && `Ciudad: ${v('ciudad')}`,
    v('pack') && v('pack') !== 'Todavía no sé' && `Pack de interés: ${v('pack')}`
  ].filter(Boolean);
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  msg.textContent = 'Listo: se abrió WhatsApp con tu consulta.';
});
})();
