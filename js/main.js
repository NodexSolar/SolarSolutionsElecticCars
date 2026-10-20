/* Nodex Solar EV — interacciones */
(() => {
'use strict';

/* ======== CONFIGURACIÓN (editar acá) ======== */
const CONFIG = {
  whatsapp: '5491100000000',   // número con código de país, sin + ni espacios
  priceArsPerKwh: 520,         // tarifa de ejemplo en la demo de cobro (ARS por kWh)
  graceMin: 10,                // minutos de gracia en la demo
  overstayArsPerMin: 60,       // tarifa de ocupación de ejemplo
  kmPerKwh: 6                  // autonomía promedio estimada
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const nf = (n, d = 0) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });

document.documentElement.classList.add('js');

/* ======== menú móvil ======== */
const burger = $('#burger'), menu = $('#menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
$$('#menu a').forEach(a => a.addEventListener('click', () => {
  menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
}));

/* ======== aparición al hacer scroll ======== */
const rvEls = $$('.sec-head, .card, .pack, .node, .gallery figure, .qa, .split > *, .coverage, .sim-ctrl, .chart-card, .roi-in, .phone, .photo-tall, .hw figure, .dash, .tariffs, .scan, .stats > div');
rvEls.forEach(el => el.classList.add('rv'));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  rvEls.forEach(el => io.observe(el));
} else rvEls.forEach(el => el.classList.add('in'));

/* ======================================================
   SIMULADOR DE POTENCIA
   ====================================================== */
const PROFILES = {
  super: {
    name: 'Supermercado / shopping',
    base: [.35,.33,.32,.32,.33,.38,.5,.7,.85,.92,.95,.97,1,1,.97,.95,.95,.97,1,.95,.85,.6,.45,.38],
    ev:   [0,0,0,0,0,0,.05,.15,.35,.55,.7,.8,.85,.8,.75,.8,.85,.9,.9,.75,.5,.2,.05,0]
  },
  hotel: {
    name: 'Hotel',
    base: [.45,.42,.4,.4,.42,.5,.65,.8,.85,.7,.6,.58,.6,.6,.58,.6,.65,.75,.9,1,1,.95,.8,.6],
    ev:   [.9,.95,.95,.95,.9,.8,.5,.2,.1,.05,.05,.05,.05,.05,.1,.15,.25,.5,.7,.85,.9,.9,.9,.9]
  },
  resto: {
    name: 'Restaurante / café',
    base: [.2,.15,.15,.15,.15,.15,.2,.3,.35,.4,.5,.75,.95,1,.9,.6,.5,.55,.65,.85,1,1,.9,.5],
    ev:   [.1,.05,0,0,0,0,0,.05,.1,.15,.25,.6,.9,.95,.8,.4,.25,.3,.4,.7,.9,.9,.7,.3]
  },
  industria: {
    name: 'Parque industrial / empresa',
    base: [.3,.28,.28,.28,.3,.45,.8,.95,1,1,1,.95,.85,.95,1,1,.95,.85,.6,.45,.4,.35,.32,.3],
    ev:   [.1,.05,0,0,0,.1,.5,.9,.95,.95,.9,.8,.6,.85,.9,.9,.85,.6,.25,.1,.1,.1,.1,.1]
  },
  cochera: {
    name: 'Cochera / edificio / country',
    base: [.4,.35,.33,.33,.35,.4,.55,.7,.6,.5,.45,.45,.5,.5,.5,.5,.55,.7,.9,1,1,.95,.8,.55],
    ev:   [.9,.95,.95,.95,.9,.8,.5,.25,.1,.05,.05,.05,.05,.05,.05,.1,.25,.6,.85,.95,.95,.95,.9,.9]
  },
  estacion: {
    name: 'Estación de servicio / ruta',
    base: [.3,.3,.3,.3,.3,.35,.5,.7,.8,.8,.8,.85,.9,.9,.85,.8,.8,.85,.9,.85,.7,.55,.4,.3],
    ev:   [.1,.05,.05,.05,.05,.15,.35,.6,.7,.75,.8,.9,.95,.9,.85,.85,.9,.95,.85,.7,.5,.35,.2,.15]
  }
};
const SEASONS = {
  verano:   { rise: 5.8, set: 20.0, k: .85 },
  media:    { rise: 6.7, set: 19.0, k: .75 },
  invierno: { rise: 7.6, set: 17.9, k: .62 }
};
const SAFETY = 0.95; // reserva: la red no supera el 95% de lo contratado
const interp = (arr, t) => {
  const h = Math.floor(t), f = t - h;
  const a = arr[h % 24], b = arr[(h + 1) % 24];
  return a + (b - a) * f;
};

const sim = {
  seg: $('#sSeg'), pc: $('#sPc'), base: $('#sBase'), solar: $('#sSolar'),
  n: $('#sN'), ch: $('#sCh'), season: $('#sSeason'), mgr: $('#sMgr'),
  svg: $('#chart'), tip: $('#tip'), kpis: $('#kpis'), verdict: $('#verdict'), title: $('#simTitle')
};
const W = 900, H = 380, ML = 46, MR = 14, MT = 14, MB = 32;
let last = null;

function simulate() {
  const prof = PROFILES[sim.seg.value];
  const Pc = +sim.pc.value, baseKw = +sim.base.value, kwp = +sim.solar.value;
  const N = +sim.n.value, Pch = +sim.ch.value, mgr = sim.mgr.checked;
  const S = SEASONS[sim.season.value];
  const rows = [];
  let evDel = 0, evReq = 0, solEv = 0, solTot = 0, hrsNo = 0, hrsMgr = 0, peak = 0;
  for (let i = 0; i <= 96; i++) {
    const t = i * .25;
    const base = baseKw * interp(prof.base, t);
    const x = (t - S.rise) / (S.set - S.rise);
    const sol = kwp * S.k * (x > 0 && x < 1 ? Math.pow(Math.sin(Math.PI * x), 1.3) : 0);
    const req = N * Pch * interp(prof.ev, t);
    const avail = Math.max(0, Pc * SAFETY - (base - sol));
    const served = mgr ? Math.min(req, avail) : req;
    const grid = Math.max(0, base + served - sol);
    const gridNo = Math.max(0, base + req - sol);
    rows.push({ t, base, sol, req, served, grid, gridNo });
    if (i < 96) {
      evDel += served * .25; evReq += req * .25; solTot += sol * .25;
      // la energía solar se reparte entre local y cargadores en proporción a lo que consume cada uno
      const used = Math.min(sol, base + served);
      solEv += (base + served > 0 ? used * served / (base + served) : 0) * .25;
      if (gridNo > Pc) hrsNo += .25;
      if (grid > Pc) hrsMgr += .25;
      peak = Math.max(peak, grid);
    }
  }
  return { rows, Pc, baseKw, kwp, N, Pch, mgr, evDel, evReq, solEv, solTot, hrsNo, hrsMgr, peak, name: prof.name };
}

const niceMax = v => {
  const steps = [5, 10, 20, 25, 50, 100, 200];
  const s = steps.find(s => v / s <= 6) || 200;
  return Math.ceil(v / s) * s;
};

function drawChart(d) {
  const { rows, Pc, mgr } = d;
  const top = Math.max(Pc * 1.18, ...rows.map(r => r.base + r.served), ...rows.map(r => r.sol), ...rows.map(r => r.grid));
  const ymax = niceMax(top);
  const x = t => ML + t / 24 * (W - ML - MR);
  const y = v => H - MB - v / ymax * (H - MT - MB);
  const line = (key, f = r => r[key]) => rows.map((r, i) => (i ? 'L' : 'M') + x(r.t).toFixed(1) + ',' + y(f(r)).toFixed(1)).join('');
  const area = (topF, botF) => line('', topF) + rows.slice().reverse().map(r => 'L' + x(r.t).toFixed(1) + ',' + y(botF(r)).toFixed(1)).join('') + 'Z';

  let g = '';
  const ystep = ymax / (ymax > 200 ? 5 : 5);
  for (let v = 0; v <= ymax + .01; v += ystep) {
    g += `<line x1="${ML}" x2="${W - MR}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,.08)"/><text x="${ML - 8}" y="${y(v) + 4}" text-anchor="end">${nf(v)}</text>`;
  }
  for (let h = 0; h <= 24; h += 3) g += `<text x="${x(h)}" y="${H - 10}" text-anchor="middle">${String(h).padStart(2, '0')}h</text>`;
  g += `<text x="${ML - 8}" y="${MT - 2}" text-anchor="end" style="font-size:10px">kW</text>`;

  g += `<path d="${area(r => r.base, () => 0)}" fill="#5F7A62" opacity=".85"/>`;
  g += `<path d="${area(r => r.base + r.served, r => r.base)}" fill="#5BE38A" opacity=".9"/>`;
  g += `<path d="${area(r => r.sol, () => 0)}" fill="#EF9F27" opacity=".22"/>`;
  g += `<path d="${line('sol')}" fill="none" stroke="#EF9F27" stroke-width="2.2"/>`;

  // exceso sobre la contratada
  let over = '';
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i], b = rows[i + 1];
    if (a.grid > Pc || b.grid > Pc) {
      over += `<polygon points="${x(a.t)},${y(Math.max(a.grid, Pc))} ${x(b.t)},${y(Math.max(b.grid, Pc))} ${x(b.t)},${y(Pc)} ${x(a.t)},${y(Pc)}" fill="#FF6B5E" opacity=".75"/>`;
    }
  }
  g += over;
  g += `<path d="${line('grid')}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>`;
  g += `<line x1="${ML}" x2="${W - MR}" y1="${y(Pc)}" y2="${y(Pc)}" stroke="#FF6B5E" stroke-width="1.8" stroke-dasharray="7 5"/>`;
  g += `<text x="${W - MR - 4}" y="${y(Pc) - 7}" text-anchor="end" style="fill:#FF9B91;font-size:11px">Contratada ${nf(Pc)} kW</text>`;
  g += `<line id="cur" x1="0" x2="0" y1="${MT}" y2="${H - MB}" stroke="rgba(255,255,255,.55)" stroke-dasharray="3 3" visibility="hidden"/>`;
  sim.svg.innerHTML = g;
  d.x = x;
}

function drawKpis(d) {
  const share = d.evDel > 0 ? d.solEv / d.evDel * 100 : 0;
  // nafta: 0,23 kg CO2/km; energía de red: ~0,3 kg CO2/kWh; la solar se toma como cero
  const co2 = Math.max(0, (d.evDel * CONFIG.kmPerKwh * 0.23 - (d.evDel - d.solEv) * 0.3) * 365 / 1000);
  const k = [
    { c: 'good', v: nf(d.evDel), u: ' kWh', l: `entregados a autos por día · ≈ ${nf(d.evDel * CONFIG.kmPerKwh)} km de autonomía` },
    { c: share >= 40 ? 'good' : '', v: nf(share), u: ' %', l: 'de esa carga sale de tus paneles solares' },
    { c: d.peak > d.Pc ? 'warn' : '', v: nf(d.peak), u: ' kW', l: `pico de red · límite contratado ${nf(d.Pc)} kW` },
    { c: d.hrsNo > 0 ? 'warn' : 'good', v: nf(d.hrsNo, 1), u: ' h', l: 'por día por encima de lo contratado si NO hubiera gestor' },
    { c: 'good', v: nf(co2, 1), u: ' t', l: 'de CO₂ evitadas por año frente a autos nafteros (estimación)' }
  ];
  sim.kpis.innerHTML = k.map(o => `<div class="kpi ${o.c}"><b>${o.v}<small>${o.u}</small></b><span>${o.l}</span></div>`).join('');
}

function drawVerdict(d) {
  const clip = d.evReq - d.evDel;
  let msg, bad = false;
  if (d.mgr) {
    if (d.hrsMgr > 0) {
      bad = true;
      msg = `Tu local por sí solo supera la potencia contratada durante ${nf(d.hrsMgr, 1)} h al día: el gestor no puede arreglarlo. Conviene sumar paneles, baterías o revisar la contratación.`;
    } else if (d.hrsNo > 0) {
      msg = `Sin gestor superarías el límite ${nf(d.hrsNo, 1)} h por día. Con gestor la red nunca pasa de ${nf(d.peak)} kW (límite ${nf(d.Pc)} kW). Se recortan ${nf(clip)} kWh en las horas pico, que se cargan más lento pero no se pierden.`;
    } else {
      msg = `Con estos números el sistema entra holgado: no hace falta recortar la carga en ningún momento. Hasta podés sumar más cargadores.`;
    }
  } else if (d.hrsNo > 0) {
    bad = true;
    msg = `Sin gestor la red superaría la potencia contratada ${nf(d.hrsNo, 1)} h por día (pico ${nf(d.peak)} kW contra ${nf(d.Pc)} kW). Activá el gestor de carga dinámico para evitar cortes y cargos por exceso.`;
  } else {
    msg = `Con estos números no superás la potencia contratada ni sin gestor. Igual se instala, por seguridad cuando sube el consumo del local.`;
  }
  sim.verdict.textContent = msg;
  sim.verdict.classList.toggle('bad', bad);
}

function runSim() {
  $('#oPc').textContent = nf(+sim.pc.value) + ' kW';
  $('#oBase').textContent = nf(+sim.base.value) + ' kW';
  $('#oSolar').textContent = nf(+sim.solar.value) + ' kWp';
  $('#oN').textContent = `${sim.n.value} (${nf(sim.n.value * sim.ch.value, 0)} kW)`;
  const d = simulate();
  sim.title.textContent = 'Un día típico · ' + d.name;
  drawChart(d); drawKpis(d); drawVerdict(d);
  last = d;
}
$$('#simForm input, #simForm select').forEach(el => el.addEventListener('input', runSim));

function chartPointer(e) {
  if (!last) return;
  const r = sim.svg.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width * W;
  const t = Math.min(24, Math.max(0, (px - ML) / (W - ML - MR) * 24));
  const i = Math.round(t * 4), p = last.rows[i];
  const cur = $('#cur'); if (!cur) return;
  cur.setAttribute('x1', last.x(p.t)); cur.setAttribute('x2', last.x(p.t)); cur.setAttribute('visibility', 'visible');
  const hh = Math.floor(p.t), mm = Math.round((p.t - hh) * 60);
  sim.tip.hidden = false;
  sim.tip.innerHTML = `<b>${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}</b>
    <span>Tu local <i>${nf(p.base, 1)} kW</i></span>
    <span>Carga pedida <i>${nf(p.req, 1)} kW</i></span>
    <span>Carga entregada <i>${nf(p.served, 1)} kW</i></span>
    <span>Solar <i>${nf(p.sol, 1)} kW</i></span>
    <span>Red <i>${nf(p.grid, 1)} kW</i></span>`;
  const tx = last.x(p.t) / W * r.width;
  sim.tip.style.left = (tx > r.width * .6 ? tx - sim.tip.offsetWidth - 12 : tx + 12) + 'px';
  sim.tip.style.top = '10px';
}
sim.svg.addEventListener('pointermove', chartPointer);
sim.svg.addEventListener('pointerdown', chartPointer);
sim.svg.addEventListener('pointerleave', () => { sim.tip.hidden = true; const c = $('#cur'); if (c) c.setAttribute('visibility', 'hidden'); });
runSim();

/* ======================================================
   DEMO DE COBRO POR QR
   ====================================================== */
const screenEl = $('#screen');
const ars = n => '$ ' + nf(Math.round(n));
let step = 0, chosen = 20, prog = 0, chargeTimer = null, autoTimer = null, graceTimer = null;
const OPTS = [10, 20, 50, 80];

function stopTimers() { clearInterval(chargeTimer); clearInterval(graceTimer); }
function stopAuto() { clearTimeout(autoTimer); autoTimer = null; $('#payPlay').textContent = '▶ Ver demo completa'; }

function go(n) {
  stopTimers();
  step = Math.max(0, Math.min(4, n));
  $$('#payAside li').forEach(li => li.classList.toggle('on', +li.dataset.s === step));
  render();
}

function render() {
  const price = CONFIG.priceArsPerKwh;
  let h = '';
  if (step === 0) {
    h = `<span class="s-badge">● Disponible</span>
      <div class="s-h">Cargador 02</div><div class="s-sub">Estacionamiento · Carga solar</div>
      <div style="margin-top:14px">
        <div class="s-row"><span>Conector</span><b>Tipo 2</b></div>
        <div class="s-row"><span>Potencia</span><b>11 kW</b></div>
        <div class="s-row"><span>Tarifa</span><b>${ars(price)} / kWh</b></div>
        <div class="s-row"><span>Energía solar hoy</span><b>62 %</b></div>
        <div class="s-row"><span>Ocupación</span><b>${CONFIG.graceMin} min de gracia</b></div>
      </div>
      <div class="s-total"><button class="s-pay green" data-go="1">Elegir cuánto cargar</button></div>`;
  } else if (step === 1) {
    h = `<div class="s-h">¿Cuánta energía querés?</div><div class="s-sub">Pagás por adelantado. Si cargás menos, te devolvemos la diferencia.</div>
      <div class="s-opts">${OPTS.map(k => `<button class="s-opt ${k === chosen ? 'on' : ''}" data-k="${k}">${k}<small>kWh</small></button>`).join('')}</div>
      <div class="s-row"><span>Autonomía aprox.</span><b>${nf(chosen * CONFIG.kmPerKwh)} km</b></div>
      <div class="s-row"><span>Tiempo aprox. a 11 kW</span><b>${nf(chosen / 10.5 * 60)} min</b></div>
      <div class="s-total"><div class="s-sub">Total a pagar</div><div class="s-big">${ars(chosen * price)}</div>
      <button class="s-pay" data-go="2">Pagar con QR</button></div>`;
  } else if (step === 2) {
    h = `<div class="s-h">Pagá con tu billetera</div><div class="s-sub">Escaneá este QR con Mercado Pago, MODO, Cuenta DNI o tu banco.</div>
      <div class="s-qr" id="qrBox"></div>
      <div class="s-row"><span>Monto</span><b>${ars(chosen * price)}</b></div>
      <div class="s-row"><span>Energía</span><b>${chosen} kWh</b></div>
      <div class="s-total"><button class="s-pay green" data-go="3">Simular pago aprobado</button></div>`;
  } else if (step === 3) {
    h = `<div class="s-ico">⚡</div><div class="s-center"><div class="s-h">Cargando…</div><div class="s-sub">Pago acreditado ${ars(chosen * price)}</div></div>
      <div class="s-bar"><i id="pBar"></i></div>
      <div class="s-row"><span>Energía</span><b id="pKwh">0 / ${chosen} kWh</b></div>
      <div class="s-row"><span>Potencia</span><b id="pKw">0 kW</b></div>
      <div class="s-row"><span>Con energía solar</span><b>62 %</b></div>
      <div class="s-total s-sub s-center">La carga se detiene sola al llegar a los kWh comprados.</div>`;
  } else {
    h = `<div class="s-ico">✅</div><div class="s-center"><div class="s-h">Carga completa</div><div class="s-sub">Cargaste ${chosen} kWh · ≈ ${nf(chosen * CONFIG.kmPerKwh)} km</div></div>
      <div style="margin-top:14px">
        <div class="s-row"><span>Pagado</span><b>${ars(chosen * price)}</b></div>
        <div class="s-row"><span>Consumo real</span><b>${chosen} kWh</b></div>
        <div class="s-row"><span>Saldo devuelto</span><b>$ 0</b></div>
      </div>
      <div class="s-warn">Liberá el lugar en <b id="gTime">${CONFIG.graceMin}:00</b> para no pagar ${ars(CONFIG.overstayArsPerMin)}/min de ocupación.</div>
      <div class="s-total"><button class="s-pay" data-go="0">Volver a empezar</button></div>`;
  }
  screenEl.innerHTML = h;

  if (step === 2) {
    const box = $('#qrBox');
    if (window.QRCode) {
      try { new QRCode(box, { text: location.href.split('#')[0] + '#cobro', width: 150, height: 150, colorDark: '#111111', colorLight: '#ffffff' }); }
      catch (e) { box.textContent = '[ QR ]'; }
    } else box.textContent = '[ QR ]';
  }
  if (step === 3) startCharge();
  if (step === 4) startGrace();
}

function startCharge() {
  prog = 0;
  chargeTimer = setInterval(() => {
    prog = Math.min(chosen, prog + chosen / 60);
    const bar = $('#pBar'); if (!bar) return;
    bar.style.width = (prog / chosen * 100) + '%';
    $('#pKwh').textContent = `${nf(prog, 1)} / ${chosen} kWh`;
    const kw = prog >= chosen ? 0 : 9.4 + Math.sin(prog) * 1.2;
    $('#pKw').textContent = nf(kw, 1) + ' kW';
    if (prog >= chosen) {
      clearInterval(chargeTimer);
      setTimeout(() => { if (step === 3) go(4); }, 1100);
    }
  }, 100);
}

function startGrace() {
  let s = CONFIG.graceMin * 60;
  graceTimer = setInterval(() => {
    s = Math.max(0, s - 1);
    const el = $('#gTime'); if (!el) return;
    el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 1000);
}

screenEl.addEventListener('click', e => {
  const k = e.target.closest('[data-k]');
  if (k) { stopAuto(); chosen = +k.dataset.k; render(); return; }
  const g = e.target.closest('[data-go]');
  if (g) { stopAuto(); go(+g.dataset.go); }
});
$('#payPrev').addEventListener('click', () => { stopAuto(); go(step - 1); });
$('#payNext').addEventListener('click', () => { stopAuto(); go(step + 1); });
$$('#payAside li').forEach(li => li.addEventListener('click', () => { stopAuto(); go(+li.dataset.s); }));
$('#payPlay').addEventListener('click', () => {
  if (autoTimer) { stopAuto(); return; }
  $('#payPlay').textContent = '■ Detener demo';
  const seq = [[0, 2200], [1, 2600], [2, 2600], [3, 0]];
  let i = 0;
  const next = () => {
    if (i >= seq.length) { autoTimer = null; $('#payPlay').textContent = '▶ Ver demo completa'; return; }
    go(seq[i][0]); const wait = seq[i][1]; i++;
    autoTimer = setTimeout(next, wait || 100000);
  };
  chosen = 20; next();
});
go(0);

/* ======================================================
   CALCULADORA DE RENTABILIDAD
   ====================================================== */
const R = id => $('#' + id);
const SOLAR_COST = 0.02; // USD/kWh de energía solar (operación y mantenimiento)

function runRoi() {
  const pack = R('rPack').value;
  R('rCustomWrap').hidden = pack !== 'custom';
  const inv = pack === 'custom' ? +R('rCustom').value || 0 : +pack;
  const ses = +R('rSes').value, kwh = +R('rKwh').value, price = +R('rPrice').value, grid = +R('rGrid').value;
  const solar = +R('rSolar').value / 100, fee = +R('rFee').value / 100, conv = +R('rConv').value / 100, ticket = +R('rTicket').value;
  R('oSes').textContent = ses; R('oKwh').textContent = kwh + ' kWh';
  R('oPrice').textContent = 'USD ' + nf(price, 2); R('oGrid').textContent = 'USD ' + nf(grid, 2);
  R('oSolarPct').textContent = nf(solar * 100) + ' %'; R('oFee').textContent = nf(fee * 100, 1) + ' %';
  R('oConv').textContent = nf(conv * 100) + ' %'; R('oTicket').textContent = 'USD ' + ticket;

  const sesM = ses * 30, kwhM = sesM * kwh;
  const gross = kwhM * price;
  const energy = kwhM * ((1 - solar) * grid + solar * SOLAR_COST);
  const fees = gross * fee;
  const net = gross - energy - fees;
  const pb = net > 0 && inv > 0 ? inv / net : null;
  const extra = sesM * conv * ticket;
  const usd = n => 'USD ' + nf(n);
  const pct = n => Math.max(2, Math.min(100, gross ? n / gross * 100 : 0));

  R('roiOut').innerHTML = `
    <div class="big"><small>Recupero estimado de la inversión</small>
      <b>${pb ? (pb < 120 ? nf(pb, 1) + ' meses' : 'más de 10 años') : '—'}</b>
      <p>${net > 0 ? `Equivale a un retorno de ${nf(inv ? net * 12 / inv * 100 : 0)} % anual sobre ${usd(inv)}.` : 'Con estos valores el margen no es positivo: probá subir el precio o bajar el costo de energía.'}</p></div>
    <div class="rows">
      <div><span>Energía vendida por mes</span><b>${nf(kwhM)} kWh</b></div>
      <div><span>Facturación mensual</span><b>${usd(gross)}</b></div>
      <div class="neg"><span>− Costo de energía (red + solar)</span><b>${usd(energy)}</b></div>
      <div class="neg"><span>− Comisiones de cobro y plataforma</span><b>${usd(fees)}</b></div>
      <div class="pos"><span>= Margen neto por mes</span><b>${usd(net)}</b></div>
      <div class="pos"><span>Margen neto por año</span><b>${usd(net * 12)}</b></div>
      <div><span>Clientes nuevos por mes (sesiones)</span><b>${nf(sesM)}</b></div>
      <div><span>Ventas extra en tu local por mes (no incluidas)</span><b>${usd(extra)}</b></div>
    </div>
    <div class="bars" aria-hidden="true">
      <div class="bar"><span>Facturación</span><i style="width:100%;background:#EF9F27"></i><span>${usd(gross)}</span></div>
      <div class="bar"><span>Energía</span><i style="width:${pct(energy)}%;background:#B8674F"></i><span>${usd(energy)}</span></div>
      <div class="bar"><span>Comisiones</span><i style="width:${pct(fees)}%;background:#8E6A5F"></i><span>${usd(fees)}</span></div>
      <div class="bar"><span>Margen neto</span><i style="width:${net > 0 ? pct(net) : 2}%;background:#5BE38A"></i><span>${usd(net)}</span></div>
    </div>
    <p class="note" style="margin:0">La parte solar se valúa a USD ${nf(SOLAR_COST, 2)} por kWh (operación y mantenimiento).</p>`;
}
$$('.roi-in input, .roi-in select').forEach(el => el.addEventListener('input', runRoi));
runRoi();

/* ======================================================
   SELECTOR DE RUBRO (hero) y CONTADORES
   ====================================================== */
$$('.picker-chips button').forEach(b => b.addEventListener('click', () => {
  sim.seg.value = b.dataset.seg;
  runSim();
  $('#simulador').scrollIntoView({ behavior: 'smooth' });
}));

const counters = $$('[data-count]');
const runCounter = el => {
  const to = +el.dataset.count, t0 = performance.now();
  const tick = now => {
    const p = Math.min(1, (now - t0) / 1100);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
  }), { threshold: .6 });
  counters.forEach(c => co.observe(c));
}

/* ======================================================
   PANEL DEL PROPIETARIO (datos ilustrativos)
   ====================================================== */
const chs = [
  { n: 'Cargador 01', st: 'Cargando', kw: 10.2, pct: 64 },
  { n: 'Cargador 02', st: 'Cargando', kw: 7.1, pct: 38 },
  { n: 'Cargador 03', st: 'Libre', kw: 0, pct: 0, cls: 'free' },
  { n: 'Cargador 04', st: 'Ocupado sin cargar · 14 min', kw: 0, pct: 100, cls: 'warn' }
];
let dKwh = 186, dMoney = 96700;
function drawDash() {
  $('#dCh').innerHTML = chs.map(c => `<div class="ch ${c.cls || ''}"><div><b>${c.n}</b><span class="st">${c.st}</span></div><div class="bar2"><i style="width:${c.pct}%"></i></div><span class="kw">${nf(c.kw, 1)} kW</span></div>`).join('');
  $('#dKwh').textContent = nf(dKwh) + ' kWh';
  $('#dMoney').textContent = '$ ' + nf(dMoney);
}
drawDash();
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setInterval(() => {
    chs.slice(0, 2).forEach(c => {
      c.kw = Math.max(6, Math.min(11, c.kw + (Math.random() - .5) * 1.2));
      c.pct = Math.min(100, c.pct + 1.4);
      if (c.pct >= 100) c.pct = 8;
    });
    const inc = (chs[0].kw + chs[1].kw) / 3600 * 3;
    dKwh += inc; dMoney += inc * CONFIG.priceArsPerKwh;
    drawDash();
  }, 3000);
}

/* ======================================================
   CONTACTO
   ====================================================== */
$$('[data-pack]').forEach(a => a.addEventListener('click', () => {
  const s = $('#fPack'); if (s) s.value = a.dataset.pack;
}));
$('#contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, v = n => f.elements[n].value.trim();
  const msgEl = $('#formMsg');
  if (!v('nombre')) { msgEl.textContent = 'Escribí tu nombre para poder responderte.'; f.elements.nombre.focus(); return; }
  const lines = [
    'Hola, quiero cotizar una instalación de carga de autos eléctricos con energía solar.',
    `Nombre: ${v('nombre')}`,
    v('empresa') && `Empresa o lugar: ${v('empresa')}`,
    `Rubro: ${v('rubro')}`,
    v('ciudad') && `Ubicación: ${v('ciudad')}`,
    `Pack de interés: ${v('pack')}`,
    v('kw') && `Potencia contratada: ${v('kw')} kW`,
    v('msg') && `Comentarios: ${v('msg')}`
  ].filter(Boolean);
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  msgEl.textContent = 'Listo: se abrió WhatsApp con tu consulta. Si no se abrió, revisá el bloqueo de ventanas emergentes.';
});
})();
