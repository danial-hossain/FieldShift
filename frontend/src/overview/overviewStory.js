/*
 * FieldShift Overview story (no WebGL needed).
 * mountOverviewStory(rootEl, data, opts) -> { update(data), destroy() }
 *  - rootEl: an empty element placed in the Overview page (full width).
 *  - data:   see demoData.js for the shape. Every number must come from the app's APIs.
 *  - opts:   { assetBase: '/', onNavigate(page), lang: 'en'|'bn' }
 * Sections: 0 orbit · 1 dive · 2 regions · 3 water · 4 climate · 5 soil · 6 rotation ·
 *           7 stress · 8 learning · 9 start (Open My Fields).
 */
const N = 10;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const win = (p, a, b, f = 0.2) => sm(a - f, a, p) * (1 - sm(b, b + f, p));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- crops ---------- */
function cropKey(name) {
  const n = String(name || '').toLowerCase();
  if (!n || n.includes('fallow')) return 'fallow';
  if (n.includes('boro')) return 'boro';
  if (n.includes('aman') || n.includes('aus') || n === 'rice') return 'aman';
  if (n.includes('mustard')) return 'mustard';
  if (n.includes('sunflower')) return 'sunflower';
  if (n.includes('tomato')) return 'tomato';
  if (n.includes('potato')) return 'potato';
  if (n.includes('maize') || n.includes('corn')) return 'maize';
  if (n.includes('wheat')) return 'wheat';
  if (n.includes('jute')) return 'jute';
  if (n.includes('sesame')) return 'sesame';
  if (/(mung|chickpea|lentil|gram|soy|pea|bean|legume)/.test(n)) return 'legume';
  return 'generic';
}
const LEGUME = new Set(['legume']);

function plant(key, x, y, s, g, seed) {
  if (key === 'fallow' || g <= 0.02) return '';
  const h = 26 * s * g, r = (k) => ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
  const blade = (dx, hh, bend, col, w = 1.6) =>
    `<path d="M${x + dx} ${y} Q${x + dx + bend * 0.4} ${y - hh * 0.6} ${x + dx + bend} ${y - hh}" stroke="${col}" stroke-width="${w * s}" fill="none" stroke-linecap="round"/>`;
  switch (key) {
    case 'boro':
    case 'aman': {
      const ripe = key === 'boro' && g > 0.85;
      const col = ripe ? '#d8b24a' : '#7fcf4f';
      let o = '';
      for (let i = 0; i < 5; i++) o += blade((i - 2) * 1.6 * s, h * (0.8 + r(i) * 0.3), (i - 2) * 3 * s, col);
      if (ripe) o += `<path d="M${x} ${y - h} q${4 * s} ${2 * s} ${6 * s} ${7 * s}" stroke="#f0c75a" stroke-width="${2.4 * s}" fill="none"/>`;
      return o;
    }
    case 'wheat': {
      let o = '';
      for (let i = 0; i < 3; i++) o += blade((i - 1) * 2 * s, h, (i - 1) * 2 * s, '#cdb35a') + `<ellipse cx="${x + (i - 1) * 2 * s + (i - 1) * 2 * s}" cy="${y - h}" rx="${1.6 * s}" ry="${4 * s}" fill="#e6c766"/>`;
      return o;
    }
    case 'maize':
    case 'jute': {
      const col = key === 'jute' ? '#5fa83a' : '#6cbf45';
      return blade(0, h * 1.5, 1 * s, col, 2.2) + blade(0, h * 0.9, 6 * s, col) + blade(0, h * 1.1, -6 * s, col);
    }
    case 'mustard': {
      let o = blade(0, h, 1 * s, '#7cb84a', 1.4) + blade(2 * s, h * 0.8, 4 * s, '#7cb84a', 1.2);
      if (g > 0.45) for (let i = 0; i < 4; i++) o += `<circle cx="${x + (r(i) - 0.5) * 7 * s}" cy="${y - h - r(i + 3) * 4 * s}" r="${2.1 * s}" fill="#f6d63a"/>`;
      return o;
    }
    case 'sunflower': {
      let o = blade(0, h * 1.3, 0, '#6aa93f', 2);
      if (g > 0.5) o += `<circle cx="${x}" cy="${y - h * 1.3}" r="${4.6 * s}" fill="#f5c22e"/><circle cx="${x}" cy="${y - h * 1.3}" r="${2.2 * s}" fill="#6b3f1d"/>`;
      return o;
    }
    case 'sesame': {
      let o = blade(0, h * 1.1, 1 * s, '#86c15a', 1.4);
      if (g > 0.5) for (let i = 0; i < 3; i++) o += `<circle cx="${x + (i - 1) * 2 * s}" cy="${y - h * (0.5 + i * 0.2)}" r="${1.4 * s}" fill="#f4efe0"/>`;
      return o;
    }
    case 'tomato': {
      let o = `<ellipse cx="${x}" cy="${y - h * 0.45}" rx="${6 * s * g}" ry="${h * 0.5}" fill="#3f8f36"/>`;
      if (g > 0.6) for (let i = 0; i < 3; i++) o += `<circle cx="${x + (r(i) - 0.5) * 8 * s}" cy="${y - h * (0.2 + r(i + 5) * 0.5)}" r="${1.8 * s}" fill="#e2453a"/>`;
      return o;
    }
    case 'potato':
      return `<ellipse cx="${x}" cy="${y - 3 * s * g}" rx="${7 * s * g}" ry="${4.5 * s * g}" fill="#3e7d34"/><ellipse cx="${x - 2 * s}" cy="${y - 5 * s * g}" rx="${3 * s * g}" ry="${2 * s * g}" fill="#5aa04a"/>`;
    case 'legume': {
      const c1 = '#2f7a35', c2 = '#4c9b42';
      return `<circle cx="${x - 3 * s}" cy="${y - 4 * s * g}" r="${4.2 * s * g}" fill="${c1}"/><circle cx="${x + 3 * s}" cy="${y - 4.5 * s * g}" r="${4 * s * g}" fill="${c2}"/><circle cx="${x}" cy="${y - 8 * s * g}" r="${3.8 * s * g}" fill="${c2}"/>`;
    }
    default:
      return blade(0, h, 3 * s, '#78c050') + blade(2 * s, h * 0.8, -3 * s, '#78c050');
  }
}

/* beds: 2 rows x 3 (row 0 = Year 1, row 1 = Year 2), in the 1600x1000 village frame */
const ROWS = [
  { y0: 732, y1: 818, xl0: 492, xr0: 1060, xl1: 470, xr1: 1082, rows: 4, s: 0.78 },
  { y0: 838, y1: 966, xl0: 440, xr0: 1112, xl1: 404, xr1: 1148, rows: 5, s: 1.0 },
];
function bedQuad(i) {
  const R = ROWS[Math.floor(i / 3)], j = i % 3, gap = 0.018;
  const f0 = j / 3 + (j ? gap : 0), f1 = (j + 1) / 3 - (j < 2 ? gap : 0);
  const tl = [lerp(R.xl0, R.xr0, f0), R.y0], tr = [lerp(R.xl0, R.xr0, f1), R.y0];
  const bl = [lerp(R.xl1, R.xr1, f0), R.y1], br = [lerp(R.xl1, R.xr1, f1), R.y1];
  return { tl, tr, bl, br, R };
}
const bil = (q, u, v) => [
  lerp(lerp(q.tl[0], q.tr[0], u), lerp(q.bl[0], q.br[0], u), v),
  lerp(lerp(q.tl[1], q.tr[1], u), lerp(q.bl[1], q.br[1], u), v),
];
function bedPlants(i, key, g) {
  const q = bedQuad(i);
  let o = '';
  const rows = q.R.rows, cols = 8;
  for (let a = 0; a < rows; a++)
    for (let b = 0; b < cols; b++) {
      const u = (b + 0.5 + ((a % 2) ? 0.25 : -0.15)) / cols, v = (a + 0.75) / (rows + 0.2);
      const [x, y] = bil(q, u, v);
      o += plant(key, Math.round(x * 10) / 10, Math.round(y * 10) / 10, q.R.s * (0.85 + v * 0.25), g, i * 100 + a * 10 + b);
    }
  return o;
}
const quadPath = (q) => `M${q.tl[0]},${q.tl[1]}L${q.tr[0]},${q.tr[1]}L${q.br[0]},${q.br[1]}L${q.bl[0]},${q.bl[1]}Z`;

/* ---------- copy ---------- */
function copy(d, lang) {
  const bn = lang === 'bn';
  const F = d.field || {};
  const num = (v, dec = 0) => (v == null || Number.isNaN(v) ? null : Number(v).toLocaleString(bn ? 'bn-BD' : 'en-US', { maximumFractionDigits: dec, minimumFractionDigits: dec, useGrouping: true }));
  const sign = (v, dec) => (v == null ? null : (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), dec));
  const best = d.strategies?.[d.best] || null;
  const cur = d.current || {};
  const stat = (v, label, cls = '') => (v == null ? '' : `<div class="fsx-stat"><b class="${cls}">${v}</b><small>${esc(label)}</small></div>`);
  const L = (en, b) => (bn ? b : en);
  return [
    { side: 'l', kick: 'FieldShift', g: true,
      h: L('Every field, seen from <em>orbit.</em>', 'প্রতিটি জমি, <em>কক্ষপথ</em> থেকে দেখা।'),
      p: L(`NASA satellites measure rain, heat and water over all of Bangladesh. FieldShift turns them into a plan for one field: <b>${esc(F.name)}</b>, ${esc(F.district)}.`,
           `NASA-র স্যাটেলাইট পুরো বাংলাদেশের বৃষ্টি, তাপ আর পানি মাপে। FieldShift সেগুলোকে একটি জমির পরিকল্পনায় বদলায়: <b>${esc(F.name)}</b>, ${esc(F.district)}।`),
      src: 'GPM IMERG · NASA POWER · GRACE-FO' },
    { side: 'r', kick: L('Problem: farms plan by habit while the climate shifts', 'সমস্যা: জলবায়ু বদলাচ্ছে, চাষ চলছে অভ্যাসে'),
      h: L('Decades of NASA data, <em>for one field.</em>', 'এক জমির জন্য <em>কয়েক দশকের</em> NASA ডেটা।'),
      stats: stat(d.years?.power != null ? num(d.years.power) : null, L(`years of NASA POWER (${d.years?.powerRange || ''})`, `বছরের NASA POWER (${d.years?.powerRange || ''})`))
           + stat(d.years?.imerg != null ? num(d.years.imerg) : null, L(`years of GPM IMERG (${d.years?.imergRange || ''})`, `বছরের GPM IMERG (${d.years?.imergRange || ''})`), 'c'),
      src: 'NASA POWER · GPM IMERG' },
    { side: 'l', kick: L('Problem: one advice for the whole country does not fit', 'সমস্যা: সারা দেশের জন্য এক পরামর্শ খাটে না'),
      h: L('Every region farms <em>differently.</em>', 'প্রতিটি অঞ্চলের চাষ <em>আলাদা।</em>'),
      rows: (d.regions || []).map((r) => `<div><b style="color:${r.color}">${esc(r.name)}</b> · ${esc(r.rotation)}</div>`).join(''),
      btn: [['myfields', L('Open My Fields →', 'আমার জমি খুলুন →')]], src: 'NASA POWER · ISRIC SoilGrids' },
    { side: 'r', kick: L('Problem: water storage under Barind is falling', 'সমস্যা: বরেন্দ্রে পানির সঞ্চয় কমছে'),
      h: L('A water plan for <em>every season.</em>', '<em>প্রতি মৌসুমের</em> পানির পরিকল্পনা।'),
      stats: stat(sign(d.grace?.barind, 2), L('cm/yr · Barind region water storage', 'সেমি/বছর · বরেন্দ্র অঞ্চলের পানির সঞ্চয়'), 'a')
           + stat(cur.irrigationMm != null && best ? `${num(cur.irrigationMm)}→${num(best.irrigationMm)}` : null, L(`mm/yr irrigation · now → ${best?.label || ''} plan`, `মিমি/বছর সেচ · এখন → ${best?.label || ''}`), 'c'),
      btn: [['water', L('Open Water →', 'পানি দেখুন →')]], src: 'GRACE-FO · FAO-56' },
    { side: 'l', kick: L('Problem: heat and dry spells hit at the wrong time', 'সমস্যা: ভুল সময়ে তাপ আর খরা'),
      h: L('Risk by month, <em>not by guess.</em>', 'অনুমান নয়, <em>মাস ধরে</em> ঝুঁকি।'),
      p: L('The two NASA rain records disagree on monsoon onset, so FieldShift shows how often each risk hit your field in each month instead of guessing a date.',
           'বর্ষা শুরুর তারিখ নিয়ে NASA-র দুই রেকর্ড একমত নয়, তাই FieldShift তারিখ না ধরে দেখায় প্রতি মাসে আপনার জমিতে কোন ঝুঁকি কতবার এসেছে।'),
      btn: [['climate', L('Open Climate & Risk →', 'জলবায়ু ও ঝুঁকি →')]], src: 'NASA POWER · GPM IMERG' },
    { side: 'r', kick: L('Problem: fields lie bare and the soil gets tired', 'সমস্যা: জমি ফাঁকা থাকে, মাটি দুর্বল হয়'),
      h: L('Legumes put nitrogen <em>back.</em>', 'ডাল ফসল মাটিতে <em>নাইট্রোজেন</em> ফেরায়।'),
      stats: stat(cur.bareDays != null && best ? `${num(cur.bareDays)}→${num(best.bareDays)}` : null, L('bare days per year', 'বছরে ফাঁকা দিন'))
           + stat(best?.nitrogenKgHa != null ? sign(best.nitrogenKgHa) : null, L('kg N/ha from legumes', 'কেজি N/হেক্টর ডাল থেকে')),
      btn: [['planner', L('Open Planner →', 'প্ল্যানার খুলুন →')]], src: 'ISRIC SoilGrids · FAO' },
    { side: 'l', kick: L('Problem: which crop, which season?', 'সমস্যা: কোন মৌসুমে কোন ফসল?'),
      h: L('MILP picks the best <em>6-season</em> plan.', 'MILP বেছে নেয় সেরা <em>৬ মৌসুমের</em> পরিকল্পনা।'),
      stats: stat(cur.profit != null && best ? `${num(cur.profit / 1000, 1)}k→${num(best.profit / 1000, 1)}k` : null, L(`BDT/yr for ${F.areaLabel || 'your field'} · now → ${best?.label || ''} ⭐`, `টাকা/বছর · এখন → ${best?.label || ''} ⭐`)),
      btn: [['planner', L('Open Planner →', 'প্ল্যানার খুলুন →')]], src: 'PuLP MILP · NASA POWER · GPM IMERG' },
    { side: 'r', kick: L('Problem: one bad season can ruin a year', 'সমস্যা: এক খারাপ মৌসুমে বছর নষ্ট'),
      h: L('Stress-test the plan <em>before</em> planting.', 'লাগানোর <em>আগেই</em> পরিকল্পনা যাচাই।'),
      p: d.stress?.label ? esc(d.stress.label) : L('Heatwave, drought, flood, cold and salinity — season by season.', 'তাপপ্রবাহ, খরা, বন্যা, শীত, লবণাক্ততা — মৌসুম ধরে।'),
      btn: [['stress', L('Open Stress test →', 'স্ট্রেস টেস্ট →')]], src: 'FAO-33 Ky · FAO-29 · NASA POWER' },
    { side: 'l', kick: L('Problem: real harvests never match the plan', 'সমস্যা: আসল ফলন কখনো পরিকল্পনার মতো হয় না'),
      h: L('It learns from <em>your harvest.</em>', 'এটি শেখে <em>আপনার ফসল</em> থেকে।'),
      p: L('Log the real yield and price. FieldShift recalibrates what each crop earns on your field and re-optimises the remaining seasons (RL-inspired feedback learning + MILP).',
           'আসল ফলন আর দাম দিন। FieldShift আপনার জমিতে প্রতিটি ফসলের হিসাব নতুন করে ঠিক করে আর বাকি মৌসুমগুলো আবার সাজায় (RL-অনুপ্রাণিত শেখা + MILP)।'),
      btn: [['adaptive', L('Open Adaptive replan →', 'অভিযোজিত পুনঃপরিকল্পনা →')]], src: 'Feedback calibration · MILP' },
    { side: 'r', kick: L('Start', 'শুরু'), g: true,
      h: L('Start with <em>your field.</em>', 'শুরু করুন <em>আপনার জমি</em> দিয়ে।'),
      p: L(`Now farming: <b>${esc((cur.rotation || []).join(' · '))}</b> on ${esc(F.areaLabel || '')} in ${esc(F.district || '')}.`,
           `এখনকার চাষ: <b>${esc((cur.rotation || []).join(' · '))}</b>, ${esc(F.areaLabel || '')}, ${esc(F.district || '')}।`),
      team: d.team, btn: [['myfields', L('Open My Fields →', 'আমার জমি খুলুন →'), true], ['planner', L('Open Planner', 'প্ল্যানার')]],
      src: (d.datasetsUsed || []).join(' · ') },
  ];
}

/* ---------- mount ---------- */
export function mountOverviewStory(root, data, opts = {}) {
  const base = (opts.assetBase || '/').replace(/\/?$/, '/');
  const lang = opts.lang || data.lang || 'en';
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('fsx');
  root.innerHTML = `
  <div class="fsx-track" style="height:${(N + 0.7) * 100}vh">
    <div class="fsx-stage">
      <canvas class="fsx-layer fsx-stars"></canvas>
      <div class="fsx-layer fsx-globe-layer"><div class="fsx-globe-wrap"><div class="fsx-atmo"></div><canvas width="640" height="640"></canvas></div></div>
      <div class="fsx-layer fsx-cloudfly" style="background-image:url(${base}textures/earth_clouds_1024.png)"></div>
      <div class="fsx-layer fsx-map-under"></div>
      <div class="fsx-layer fsx-map"><div class="fsx-mapbox"></div></div>
      <div class="fsx-layer fsx-scene">
        <div class="fsx-layer fsx-village"></div>
        <div class="fsx-layer fsx-beds"></div>
        <canvas class="fsx-layer fsx-rain"></canvas>
        <div class="fsx-layer fsx-shimmer"></div>
        <div class="fsx-layer fsx-tint"></div>
        <div class="fsx-layer fsx-dawn"></div>
        <div class="fsx-layer fsx-tags"></div>
      </div>
      <div class="fsx-layer fsx-under"></div>
      <div class="fsx-layer fsx-overlay"></div>
      <div class="fsx-layer fsx-flash"></div>
      <div class="fsx-layer fsx-cards"></div>
      <nav class="fsx-rail" aria-label="Story sections"></nav>
      <div class="fsx-hint">${lang === 'bn' ? 'নিচে স্ক্রল করুন' : 'Scroll'}</div>
    </div>
  </div>`;
  const $ = (s) => root.querySelector(s);
  const stage = $('.fsx-stage'), track = $('.fsx-track');
  const L = {
    stars: $('.fsx-stars'), globeL: $('.fsx-globe-layer'), globe: $('.fsx-globe-wrap'), gcv: $('.fsx-globe-wrap canvas'),
    cloud: $('.fsx-cloudfly'), mapU: $('.fsx-map-under'), map: $('.fsx-map'), mapbox: $('.fsx-mapbox'),
    scene: $('.fsx-scene'), village: $('.fsx-village'), beds: $('.fsx-beds'), rain: $('.fsx-rain'), shimmer: $('.fsx-shimmer'),
    tint: $('.fsx-tint'), dawn: $('.fsx-dawn'), tags: $('.fsx-tags'), under: $('.fsx-under'), overlay: $('.fsx-overlay'), flash: $('.fsx-flash'),
    cards: $('.fsx-cards'), rail: $('.fsx-rail'), hint: $('.fsx-hint'),
  };
  let D = data, alive = true, raf = 0;

  /* stars */
  function drawStars() {
    const c = L.stars, w = (c.width = stage.clientWidth), h = (c.height = stage.clientHeight), x = c.getContext('2d');
    x.clearRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) {
      x.globalAlpha = 0.25 + Math.random() * 0.75;
      x.fillStyle = '#fff';
      x.beginPath(); x.arc(Math.random() * w, Math.random() * h, Math.random() < 0.08 ? 1.4 : 0.7, 0, 7); x.fill();
    }
  }

  /* globe: orthographic projection of the NASA Blue Marble texture on a 2D canvas */
  const G = { ready: false, R: 320 };
  function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
  Promise.all([loadImg(base + 'textures/earth_day_2048.jpg'), loadImg(base + 'textures/earth_clouds_1024.png').catch(() => null)]).then(([day, cl]) => {
    const t = document.createElement('canvas'); t.width = day.width; t.height = day.height;
    const tx = t.getContext('2d'); tx.drawImage(day, 0, 0); G.tex = tx.getImageData(0, 0, t.width, t.height).data; G.tw = t.width; G.th = t.height;
    if (cl) { const c2 = document.createElement('canvas'); c2.width = cl.width; c2.height = cl.height; const cx = c2.getContext('2d'); cx.filter = 'blur(1.5px)'; cx.drawImage(cl, 0, 0); G.cl = cx.getImageData(0, 0, c2.width, c2.height).data; G.cw = c2.width; G.ch = c2.height; }
    const S = 640, R = G.R, phi0 = (23.7 * Math.PI) / 180, lut = [], sphi = Math.sin(phi0), cphi = Math.cos(phi0);
    const Lx = -0.55, Ly = 0.45, Lz = 0.70, ln = Math.hypot(Lx, Ly, Lz);
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
      const x = (px - S / 2 + 0.5) / R, y = -(py - S / 2 + 0.5) / R, r2 = x * x + y * y;
      if (r2 > 1) continue;
      const z = Math.sqrt(1 - r2);
      const lat = Math.asin(y * cphi + z * sphi), dlon = Math.atan2(x, z * cphi - y * sphi);
      const sh = Math.max(0, (x * Lx + y * Ly + z * Lz) / ln);
      const edge = Math.min(1, (1 - Math.sqrt(r2)) * 18);
      lut.push(py * S + px, lat, dlon, 0.18 + 0.95 * sh, edge);
    }
    G.lut = new Float32Array(lut); G.ctx = L.gcv.getContext('2d'); G.img = G.ctx.createImageData(S, S); G.ready = true; G.last = null;
  }).catch(() => { L.globe.style.background = 'radial-gradient(circle at 35% 35%,#3a7bd5,#0b2a4a 70%)'; L.globe.style.borderRadius = '50%'; });
  function renderGlobe(lon0, cloudLon) {
    if (!G.ready) return;
    const key = lon0.toFixed(2) + '|' + cloudLon.toFixed(2);
    if (key === G.last) return; G.last = key;
    const { lut, tex, tw, th, cl, cw, ch, img } = G, out = img.data, TAU = Math.PI * 2;
    out.fill(0);
    for (let i = 0; i < lut.length; i += 5) {
      const idx = lut[i] * 4, lat = lut[i + 1], dl = lut[i + 2], sh = lut[i + 3], e = lut[i + 4];
      let u = ((lon0 + dl) / TAU + 0.5) % 1; if (u < 0) u += 1;
      const v = 0.5 - lat / Math.PI;
      const ti = ((Math.min(th - 1, (v * th) | 0) * tw + ((u * tw) | 0)) * 4);
      let r = tex[ti], g = tex[ti + 1], b = tex[ti + 2];
      if (cl) {
        let cu = ((cloudLon + dl) / TAU + 0.5) % 1; if (cu < 0) cu += 1;
        const ci = ((Math.min(ch - 1, (v * ch) | 0) * cw + ((cu * cw) | 0)) * 4);
        const a0 = cl[ci] / 255, a = a0 < 0.18 ? 0 : (a0 - 0.18) * 0.7; r += (255 - r) * a; g += (255 - g) * a; b += (255 - b) * a;
      }
      out[idx] = r * sh; out[idx + 1] = g * sh; out[idx + 2] = b * sh * 1.04; out[idx + 3] = 255 * e;
    }
    G.ctx.putImageData(img, 0, 0);
  }

  /* map */
  let MAP = null;
  fetch(base + 'overview/bd_map.json').then((r) => r.json()).then((m) => { MAP = m; buildMap(); }).catch(() => {});
  const REG = { barind: '#C8F169', haor: '#5BE3FF', coast: '#F5B04C' };
  function proj(lon, lat) { const p = MAP.proj; return [(lon - p.lon0) * p.k * p.S + p.pad, (p.lat1 - lat) * p.S + p.pad]; }
  function buildMap() {
    if (!MAP) return;
    const paths = MAP.districts.map((d) => {
      const c = REG[d.region];
      return `<path d="${d.d}" fill="${c ? c : '#2f6b3f'}" fill-opacity="${c ? 0.85 : 1}" stroke="${c ? c : '#5f9b6c'}" stroke-opacity="${c ? 0.9 : 0.35}" stroke-width="0.6"/>`;
    }).join('');
    const ext = [6, 5, 4, 3, 2, 1].map((k) => `<g transform="translate(0 ${k * 2.2})" opacity="${0.9}"><use href="#fsxBD" fill="#06140c"/></g>`).join('');
    L.mapbox.innerHTML = `<svg viewBox="0 0 ${MAP.w} ${MAP.h}">
      <defs><filter id="fsxGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <g id="fsxBD">${MAP.districts.map((d) => `<path d="${d.d}"/>`).join('')}</g></defs>
      <ellipse cx="${MAP.w / 2}" cy="${MAP.h * 0.62}" rx="${MAP.w * 0.62}" ry="${MAP.h * 0.42}" fill="#000" opacity=".35" filter="url(#fsxGlow)"/>
      ${ext}
      <g class="fsx-mapfill">${paths}</g>
      <g filter="url(#fsxGlow)" opacity=".75">${MAP.districts.filter((d) => REG[d.region]).map((d) => `<path d="${d.d}" fill="${REG[d.region]}" fill-opacity=".35"/>`).join('')}</g>
    </svg>`;
    const lbl = (txt, lon, lat, col) => { const [x, y] = proj(lon, lat); return `<div class="fsx-pill" style="left:${(x / MAP.w) * 100}%;top:${(y / MAP.h) * 100}%;color:${col}">${txt}</div>`; };
    const bn = lang === 'bn', F = D.field || {};
    let html = lbl(bn ? 'বরেন্দ্র' : 'Barind', 88.55, 25.45, REG.barind) + lbl(bn ? 'হাওর' : 'Haor', 91.15, 24.95, REG.haor) + lbl(bn ? 'উপকূল' : 'Coast', 89.55, 22.05, REG.coast);
    if (F.lat != null && F.lon != null) {
      const [x, y] = proj(F.lon, F.lat);
      html += `<div class="fsx-pin" style="left:${(x / MAP.w) * 100}%;top:${(y / MAP.h) * 100}%"><s></s><i></i></div>`;
      html += `<div class="fsx-pill" style="left:${(x / MAP.w) * 100 + 4}%;top:${(y / MAP.h) * 100 + 7}%;transform:none;color:#fff"><b>${esc(F.name)}</b></div>`;
      MAP.pin = [x / MAP.w, y / MAP.h];
    }
    L.mapbox.insertAdjacentHTML('beforeend', html);
  }

  /* village layers */
  const VL = ['0_sky', '1_far', '2_land', '3_mid', '4_fore'], PAR = [0, 4, 8, 14, 24];
  L.village.innerHTML = VL.map((n) => `<div class="fsx-vl" data-l="${n}"></div>`).join('');
  const vls = [...L.village.querySelectorAll('.fsx-vl')];
  VL.forEach((n, i) => fetch(`${base}bg/layers/${n}.svg`).then((r) => r.text()).then((t) => {
    vls[i].innerHTML = t;
    if (n === '4_fore') vls[i].querySelectorAll('circle[fill="#ffe58a"]').forEach((c, k) => { c.classList.add('fsx-firefly'); c.style.animationDelay = `${(k % 9) * 0.37}s`; });
  }).catch(() => {}));

  /* beds */
  L.beds.innerHTML = `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="fsxSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a2c"/><stop offset="1" stop-color="#4a3220"/></linearGradient>
    <linearGradient id="fsxWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd0e6" stop-opacity=".75"/><stop offset="1" stop-color="#3f7fa6" stop-opacity=".75"/></linearGradient>
    <filter id="fsxBedGlow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="9"/></filter></defs>
    <path d="M${ROWS[0].xl0 - 18},${ROWS[0].y0 - 10}L${ROWS[0].xr0 + 18},${ROWS[0].y0 - 10}L${ROWS[1].xr1 + 26},${ROWS[1].y1 + 12}L${ROWS[1].xl1 - 26},${ROWS[1].y1 + 12}Z" fill="#7a5d3b" opacity=".9"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => {
      const q = bedQuad(i);
      return `<g data-bed="${i}"><path class="glow" d="${quadPath(q)}" fill="#C8F169" opacity="0" filter="url(#fsxBedGlow)"/>
        <path d="${quadPath(q)}" fill="url(#fsxSoil)" stroke="#8a6a44" stroke-width="5" stroke-linejoin="round"/>
        <g class="crack" opacity="0">${crackPath(q)}</g>
        <path class="water" d="${quadPath(q)}" fill="url(#fsxWater)" opacity="0"/>
        <g class="plants"></g>
        <path class="flood" d="${quadPath(q)}" fill="#5f9fc4" opacity="0"/></g>`;
    }).join('')}
  </svg>`;
  function crackPath(q) {
    let o = '';
    for (let k = 0; k < 7; k++) {
      const [x, y] = bil(q, 0.15 + Math.random() * 0.7, 0.2 + Math.random() * 0.6);
      o += `<path d="M${x} ${y} l${8 + Math.random() * 10} ${3 + Math.random() * 5} l${-4 + Math.random() * 8} ${6 + Math.random() * 6} M${x} ${y} l${-10 - Math.random() * 8} ${2 + Math.random() * 4}" stroke="#1a0f07" stroke-width="2.6" fill="none"/>`;
    }
    return o;
  }
  const bedG = [...L.beds.querySelectorAll('[data-bed]')];
  const bedState = bedG.map(() => ({ key: null, g: -1 }));
  function setBed(i, cropName, g) {
    const key = cropKey(cropName), st = bedState[i], gq = Math.round(g * 12) / 12;
    if (st.key === key && st.g === gq) return;
    st.key = key; st.g = gq;
    bedG[i].querySelector('.plants').innerHTML = bedPlants(i, key, gq);
    bedG[i].querySelector('.water').setAttribute('opacity', key === 'aman' || key === 'boro' ? 0.55 * Math.min(1, gq + 0.3) : 0);
  }

  /* underground cut-away */
  L.under.innerHTML = `<svg viewBox="0 0 1600 420" preserveAspectRatio="none">
    <rect y="0" width="1600" height="60" fill="#5b3d22"/><rect y="60" width="1600" height="90" fill="#7a5532"/>
    <rect y="150" width="1600" height="90" fill="#9a7a4f"/><rect class="aq" y="240" width="1600" height="180" fill="#1f6f95"/>
    <rect class="aqtop" y="240" width="1600" height="6" fill="#5BE3FF"/>
    <path d="M0 60 Q400 50 800 64 T1600 58" stroke="#3a2614" stroke-width="3" fill="none"/>
    <rect x="1010" y="-10" width="10" height="330" fill="#9aa4a8"/><rect x="1004" y="-14" width="22" height="10" fill="#c3cbcf"/>
  </svg>
  <div class="fsx-pill fsx-aqlabel" style="left:70%;top:72%;transform:none;color:#5BE3FF"></div>`;
  const aq = L.under.querySelector('.aq'), aqtop = L.under.querySelector('.aqtop'), aqlabel = L.under.querySelector('.fsx-aqlabel');

  /* risk ribbon + chips + sparks */
  function buildOverlay() {
    const r = D.risk || {}, months = D.monthLabels || ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const cells = months.map((m, i) => {
      const parts = [['heat', '#FF7A6B'], ['dry', '#F5B04C'], ['rain', '#5BE3FF'], ['cold', '#A78BFA']].map(([k, c]) => [r[k]?.[i] ?? 0, c]).sort((a, b) => b[0] - a[0]);
      const [v, c] = parts[0];
      return `<div><span style="background:${c};opacity:${0.15 + 0.85 * (v / 100)}"></span>${esc(m)}</div>`;
    }).join('');
    const strat = (D.strategyOrder || Object.keys(D.strategies || {})).map((k) => `<span class="fsx-chip" data-s="${k}">${esc(D.strategies[k].label)}${k === D.best ? ' ⭐' : ''}</span>`).join('');
    const sparks = Array.from({ length: 18 }, (_, k) => {
      const q = bedQuad([1, 4][k % 2]), [x, y] = bil(q, Math.random(), Math.random());
      return `<i class="fsx-spark" style="left:${(x / 1600) * 100}%;top:${(y / 1000) * 100}%;animation-delay:${(k * 0.17) % 2.4}s"></i>`;
    }).join('');
    L.overlay.innerHTML = `<div class="fsx-ribbon">${cells}</div><div class="fsx-chips">${strat}</div><div class="fsx-sparks" style="position:absolute;inset:-3%;">${sparks}</div>`;
  }

  /* cards + rail */
  function buildCards() {
    const C = copy(D, lang);
    L.cards.innerHTML = C.map((c, i) => `<section class="fsx-card ${c.side}" data-i="${i}" style="opacity:0">
      <div class="fsx-kick ${c.g ? 'g' : ''}">${c.g ? '' : '▲ '}${esc(c.kick)}</div>
      <h2 class="fsx-h">${c.h}</h2>
      ${c.p ? `<p class="fsx-p">${c.p}</p>` : ''}
      ${c.stats ? `<div class="fsx-stats">${c.stats}</div>` : ''}
      ${c.rows ? `<div class="fsx-rows">${c.rows}</div>` : ''}
      ${c.team?.length ? `<div class="fsx-team"><b>Team Azoic · Dhaka</b><br>${c.team.map(esc).join(' · ')}</div>` : ''}
      ${c.src ? `<div class="fsx-src">◆ ${esc(c.src)}</div>` : ''}
      ${c.btn ? `<div class="fsx-btns">${c.btn.map(([pg, t, pri]) => `<button class="fsx-btn ${pri ? 'p' : ''}" data-go="${pg}">${t}</button>`).join('')}</div>` : ''}
    </section>`).join('');
    const names = lang === 'bn' ? ['কক্ষপথ', 'ডেটা', 'অঞ্চল', 'পানি', 'জলবায়ু', 'মাটি', 'রোটেশন', 'স্ট্রেস', 'শেখা', 'শুরু'] : ['Orbit', 'Data', 'Regions', 'Water', 'Climate', 'Soil', 'Rotation', 'Stress', 'Learning', 'Start'];
    L.rail.innerHTML = names.map((n, i) => `<button data-sec="${i}" aria-label="${n}"><span>${n}</span></button>`).join('');
  }
  root.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) { opts.onNavigate?.(go.dataset.go); return; }
    const sec = e.target.closest('[data-sec]');
    if (sec) scrollToSection(+sec.dataset.sec);
  });
  function scrollParent(el) { let p = el.parentElement; while (p && p !== document.body) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight) return p; p = p.parentElement; } return null; }
  function scrollToSection(i) {
    const sp = scrollParent(root), vh = stage.clientHeight, top = root.getBoundingClientRect().top;
    const target = i * vh + vh * 0.5;
    if (sp) sp.scrollTo({ top: sp.scrollTop + top + target, behavior: 'smooth' }); else window.scrollTo({ top: window.scrollY + top + target, behavior: 'smooth' });
  }

  /* rain */
  const drops = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), v: 0.6 + Math.random() * 0.8, l: 10 + Math.random() * 16 }));
  function drawRain(alpha, dt) {
    const c = L.rain, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const x = c.getContext('2d'); x.clearRect(0, 0, w, h);
    if (alpha <= 0.01) return;
    x.strokeStyle = `rgba(200,225,255,${0.55 * alpha})`; x.lineWidth = 1.2; x.beginPath();
    for (const d of drops) { d.y += d.v * dt * 0.9; if (d.y > 1) { d.y -= 1; d.x = Math.random(); } const px = d.x * w, py = d.y * h; x.moveTo(px, py); x.lineTo(px - 3, py + d.l); }
    x.stroke();
  }

  /* main loop */
  let pS = 0, mx = 0, my = 0, smx = 0, smy = 0, tPrev = performance.now();
  const onMouse = (e) => { const r = stage.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; };
  window.addEventListener('mousemove', onMouse, { passive: true });
  const onResize = () => drawStars(); window.addEventListener('resize', onResize);
  const cards = () => [...L.cards.children];
  const op = (el, v) => { el.style.opacity = v.toFixed(3); el.style.visibility = v < 0.005 ? 'hidden' : 'visible'; };

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - tPrev) / 1000); tPrev = now;
    const vh = stage.clientHeight, top = root.getBoundingClientRect().top;
    const pT = clamp(-top / vh, 0, N - 0.001);
    pS = reduce ? pT : lerp(pS, pT, 1 - Math.pow(0.0009, dt));
    if (Math.abs(pS - pT) < 0.0005) pS = pT;
    const p = pS;
    smx = lerp(smx, reduce ? 0 : mx, 0.06); smy = lerp(smy, reduce ? 0 : my, 0.06);

    // space + globe (0-1.7)
    const space = 1 - sm(1.55, 1.75, p);
    op(L.stars, space);
    op(L.globeL, 1 - sm(1.5, 1.68, p));
    const zt = sm(0.7, 1.55, p), zoom = lerp(1, 4.2, Math.pow(zt, 1.8));
    L.globe.style.transform = `translate(-50%,-50%) translate(${smx * -10}px,${smy * -10}px) scale(${zoom})`;
    L.gcv.style.filter = `blur(${(Math.max(0, zt - 0.45) * 9).toFixed(2)}px)`;
    const idle = reduce ? 0 : (now / 1000) * 4 * (1 - sm(0.15, 0.7, p));
    const lon0 = ((lerp(25, 90.4, sm(0, 0.85, p)) + idle) * Math.PI) / 180;
    if (p < 1.7) renderGlobe(lon0, lon0 * 0.97 + now / 90000);
    // clouds + flash (1.3-1.9)
    const cl = win(p, 1.3, 1.6, 0.14);
    op(L.cloud, cl * 0.9); L.cloud.style.transform = `scale(${1 + sm(1.3, 1.8, p) * 1.8})`;
        // map (1.6-3.35)
    const mapV = win(p, 1.75, 3.1, 0.18);
    op(L.mapU, Math.max(mapV, sm(1.6, 1.8, p) * (1 - sm(3.2, 3.4, p))));
    op(L.map, mapV);
    const tilt = lerp(0, 38, sm(1.7, 2.35, p));
    const dive = sm(2.85, 3.3, p), pin = MAP?.pin || [0.25, 0.35];
    const mz = lerp(1, 4.2, dive);
    const tx = -(pin[0] - 0.5) * 100 * dive, ty = -(pin[1] - 0.6) * 100 * dive;
    L.mapbox.style.transform = `translate(-50%,-50%) translate(${smx * -14}px,${smy * -10}px) perspective(1400px) rotateX(${tilt}deg) scale(${mz}) translate(${tx}%,${ty}%) scale(${lerp(0.92, 1, sm(1.7, 2.1, p))})`;
    // village scene (from 3.05)
    const vill = sm(3.0, 3.3, p);
    op(L.scene, vill);
    const lift = win(p, 3.35, 3.95, 0.25);                // water: lift the land to show the underground
    const close = sm(4.7, 5.15, p) * (1 - sm(8.95, 9.45, p));
    L.scene.style.transformOrigin = '50% 88%';
    L.scene.style.transform = `translateY(${-30 * lift}%) scale(${1 + 0.24 * close})`;
    vls.forEach((el, i) => { el.style.transform = `translate(${-smx * PAR[i]}px,${-smy * PAR[i] * 0.6}px)`; });
    L.beds.style.transform = `translate(${-smx * 18}px,${-smy * 10}px)`;
    op(L.under, lift);
    L.under.style.transform = `translateY(${(1 - lift) * 100}%)`;
    L.under.style.top = '58%'; L.under.style.height = '42%';
    const fall = sm(3.4, 3.95, p), gb = D.grace?.barind ?? -1;
    const level = 240 + (gb < 0 ? 1 : -1) * 70 * fall;
    aq.setAttribute('y', level); aq.setAttribute('height', 420 - level); aqtop.setAttribute('y', level);
    aqlabel.textContent = D.grace?.barind != null ? `GRACE-FO · ${lang === 'bn' ? 'বরেন্দ্র' : 'Barind'} ${D.grace.barind > 0 ? '+' : '−'}${Math.abs(D.grace.barind).toFixed(2)} cm/yr` : '';
    // climate (3.9-5.0)
    const clim = win(p, 4.05, 4.85, 0.2);
    drawRain(clim * 0.9 + win(p, 7.1, 7.85, 0.15) * 1.0, dt);
    op(L.shimmer, clim * 0.8);
    // beds (from 4.8)
    const bedsV = sm(4.75, 5.05, p);
    op(L.beds, bedsV);
    const cur = D.current?.rotation || [], curSeq = [cur[0], cur[1], cur[2], cur[0], cur[1], cur[2]];
    const order = D.strategyOrder || Object.keys(D.strategies || {}), best = D.strategies?.[D.best];
    const bestSeq = best?.sequence || curSeq;
    let seq = curSeq, g = 1, chipOn = null, glowBed = -1;
    if (p < 5.25) { seq = curSeq; }
    else if (p < 6.0) {                                   // soil: fallow -> legumes
      const t = sm(5.3, 5.7, p);
      seq = curSeq.map((c, i) => (cropKey(c) === 'fallow' ? (t > 0.02 ? (bestSeq[i] || 'Mungbean') : c) : c));
      g = 1;
      seq.forEach((c, i) => setBed(i, c, cropKey(curSeq[i]) === 'fallow' ? t : 1));
    } else if (p < 7.0) {                                 // rotation: cycle strategies
      const k = Math.min(order.length - 1, Math.floor(((p - 6.0) / 0.92) * order.length));
      chipOn = order[Math.max(0, k)];
      seq = D.strategies?.[chipOn]?.sequence || bestSeq;
      if (chipOn === D.best) glowBed = 9;
    } else { seq = bestSeq; }
    if (!(p >= 5.25 && p < 6.0)) seq.forEach((c, i) => setBed(i, c, g));
    bedG.forEach((b, i) => {
      b.querySelector('.glow').setAttribute('opacity', glowBed === 9 ? 0.55 + 0.25 * Math.sin(now / 300) : (p > 8.15 && p < 9 && i === (D.learning?.changedBed ?? -1) ? 0.4 + 0.3 * Math.sin(now / 200) : 0));
    });
    L.overlay.querySelectorAll('.fsx-chip').forEach((c) => c.classList.toggle('on', c.dataset.s === chipOn));
    op(L.overlay.querySelector('.fsx-ribbon'), win(p, 4.15, 4.85, 0.15));
    op(L.overlay.querySelector('.fsx-chips'), win(p, 6.05, 6.9, 0.12));
    op(L.overlay.querySelector('.fsx-sparks'), win(p, 5.45, 5.9, 0.12));
    // stress (7-8)
    const st = win(p, 7.15, 7.85, 0.15), S = D.stress || {};
    bedG.forEach((b, i) => {
      b.querySelector('.flood').setAttribute('opacity', (S.floodBeds || []).includes(i) ? 0.75 * st : 0);
      b.querySelector('.crack').setAttribute('opacity', (S.droughtBeds || []).includes(i) ? st : 0);
      b.querySelector('.plants').style.filter = (S.droughtBeds || []).includes(i) && st > 0.05 ? `sepia(${st * 0.9}) saturate(${1 - st * 0.5}) brightness(${1 - st * 0.15})` : '';
    });
    // tint: dusk -> storm -> dawn
    const storm = st, dawn = sm(9.1, 9.6, p), cool = clim * 0.6;
    const tTop = [lerp(lerp(255, 150, cool), 85, storm), lerp(lerp(255, 165, cool), 95, storm), lerp(lerp(255, 200, cool), 125, storm)];
    const bot = [lerp(255, 150, storm), lerp(255, 160, storm), lerp(255, 175, storm)];
    const dt2 = [lerp(tTop[0], 255, dawn), lerp(tTop[1], 214, dawn), lerp(tTop[2], 205, dawn)];
    L.tint.style.background = `linear-gradient(180deg, rgb(${dt2.map(Math.round)}) 0%, rgb(${bot.map(Math.round)}) 70%)`;
    op(L.dawn, dawn * 0.75);
    const bolt = storm > 0.6 && !reduce ? Math.max(0, Math.sin(now / 137) * Math.sin(now / 911)) ** 18 : 0;
    op(L.flash, Math.max(Math.max(0, win(p, 1.56, 1.6, 0.07) * 0.9), bolt * 0.35));
    // tags (stress + learning)
    const tagHTML = [];
    if (st > 0.3) (S.tags || []).forEach((t) => { const q = bedQuad(t.bed); const [x, y] = bil(q, 0.5, 0.05); tagHTML.push(`<div class="fsx-tag" style="left:${(x / 1600) * 100}%;top:${(y / 1000) * 100}%;color:#FF7A6B;opacity:${st}">${esc(t.text)}</div>`); });
    const lr = win(p, 8.15, 8.85, 0.15), LR = D.learning || {};
    if (lr > 0.2 && LR.harvestBed != null) { const q = bedQuad(LR.harvestBed); const [x, y] = bil(q, 0.5, 0.05); tagHTML.push(`<div class="fsx-tag" style="left:${(x / 1600) * 100}%;top:${(y / 1000) * 100}%;color:#C8F169;opacity:${lr}">✓ ${esc(LR.harvestText)}</div>`); }
    const tagStr = tagHTML.join(''); if (L.tags._s !== tagStr) { L.tags.innerHTML = tagStr; L.tags._s = tagStr; }
    // cards
    cards().forEach((c, i) => {
      const a = win(p, i + 0.12, i + 0.82, 0.16) * (i === 0 ? 1 : 1);
      const v = i === 0 ? Math.max(a, 1 - sm(0.82, 0.98, p)) : (i === N - 1 ? sm(i - 0.04, i + 0.16, p) : a);
      op(c, v);
      c.style.transform = `translateY(calc(-50% + ${(1 - v) * 24}px))`;
    });
    L.rail.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', Math.round(p - 0.3) === i || (i === 0 && p < 0.7)));
    op(L.hint, 1 - sm(0.05, 0.3, p));
    raf = requestAnimationFrame(frame);
  }

  drawStars(); buildOverlay(); buildCards(); buildMap();
  raf = requestAnimationFrame(frame);
  return {
    update(nd) { D = nd; bedState.forEach((s) => { s.key = null; }); buildOverlay(); buildCards(); if (MAP) buildMap(); },
    destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', onResize); root.innerHTML = ''; root.classList.remove('fsx'); },
  };
}
export default mountOverviewStory;
