/* Panel 1 — Extraccion de color (equivalente a extraer_color.sh + color_extractor.py). */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let imgNatural = null;   // Image object a tamano natural
let dibujoEscala = 1;    // factor: coords de canvas -> coords naturales
let seleccion = null;    // {x1,y1,x2,y2} en coords naturales, o null (equivalente a --bbox)
let arrastrando = false;
let inicioArrastre = null;
let seleccionPrevia = null;  // para restaurar si el gesto resulta ser un pellizco

function cargarImagenDesdeBlob(blob) {
  const img = new Image();
  img.onload = () => {
    imgNatural = img;
    const maxAncho = 700;
    dibujoEscala = Math.min(1, maxAncho / img.width);
    canvas.width = Math.round(img.width * dibujoEscala);
    canvas.height = Math.round(img.height * dibujoEscala);
    seleccion = null;
    document.getElementById('bboxStatus').textContent = 'Sin recorte — se analiza la imagen completa.';
	if (typeof zoomReiniciar === 'function') zoomReiniciar();
    redibujar();
  };
  img.src = URL.createObjectURL(blob);
}

document.getElementById('imgInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) cargarImagenDesdeBlob(file);
});

// Pegar imagen con Ctrl+V / Cmd+V — funciona en toda la pagina, no hace falta
// que el foco este en un campo especifico (clipboardData llega en el evento paste).
window.addEventListener('paste', (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      cargarImagenDesdeBlob(item.getAsFile());
      e.preventDefault();
      break;
    }
  }
});

const pasteZone = document.getElementById('pasteZone');
pasteZone.addEventListener('focus', () => pasteZone.classList.add('paste-zone-active'));
pasteZone.addEventListener('blur', () => pasteZone.classList.remove('paste-zone-active'));
// En mobile no siempre hay "pegar imagen" real — tocar la zona abre el picker
// de archivos (que en el celular ya ofrece camara o galeria).
pasteZone.addEventListener('click', () => document.getElementById('imgInput').click());

function redibujar() {
  if (!imgNatural) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgNatural, 0, 0, canvas.width, canvas.height);
  if (seleccion) {
    ctx.strokeStyle = '#3b6ef0';
    ctx.lineWidth = 2;
    const x1 = seleccion.x1 * dibujoEscala, y1 = seleccion.y1 * dibujoEscala;
    const x2 = seleccion.x2 * dibujoEscala, y2 = seleccion.y2 * dibujoEscala;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  }
}

// Pointer Events unifica mouse, touch (mobile/tablet) y lapiz en un solo set
// de listeners — no hace falta duplicar la logica para touchstart/touchmove.
function coordDesdeEvento(e) {
  const rect = canvas.getBoundingClientRect();
  const escalaVisual = canvas.width / rect.width; // por si el CSS lo escala (mobile)
  return {
    x: (e.clientX - rect.left) * escalaVisual / dibujoEscala,
    y: (e.clientY - rect.top) * escalaVisual / dibujoEscala,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  if (!imgNatural) return;
  // Segundo dedo = pellizco, no es un recorte
  if (e.pointerType === 'touch' && !e.isPrimary) return;
  canvas.setPointerCapture(e.pointerId);
  seleccionPrevia = seleccion;
  inicioArrastre = coordDesdeEvento(e);
  arrastrando = true;
});
// Lo llama zoom.js cuando entra el segundo dedo: descarta el recorte a medias
function cancelarArrastre() {
  if (arrastrando) {
    arrastrando = false;
    seleccion = seleccionPrevia;
    redibujar();
  }
}
canvas.addEventListener('pointermove', (e) => {
  if (!arrastrando || !imgNatural) return;
  const actual = coordDesdeEvento(e);
  seleccion = {
    x1: Math.max(0, Math.min(inicioArrastre.x, actual.x)),
    y1: Math.max(0, Math.min(inicioArrastre.y, actual.y)),
    x2: Math.min(imgNatural.width, Math.max(inicioArrastre.x, actual.x)),
    y2: Math.min(imgNatural.height, Math.max(inicioArrastre.y, actual.y)),
  };
  redibujar();
});
function terminarArrastre() {
  if (arrastrando && seleccion) {
    const w = Math.round(seleccion.x2 - seleccion.x1), h = Math.round(seleccion.y2 - seleccion.y1);
    if (w < 4 || h < 4) { seleccion = null; }
    document.getElementById('bboxStatus').textContent = seleccion
      ? `Recorte activo: ${Math.round(seleccion.x1)},${Math.round(seleccion.y1)} → ${Math.round(seleccion.x2)},${Math.round(seleccion.y2)} (equivalente a --bbox)`
      : 'Sin recorte — se analiza la imagen completa.';
    redibujar();
  }
  arrastrando = false;
}
canvas.addEventListener('pointerup', terminarArrastre);
canvas.addEventListener('pointercancel', terminarArrastre);

document.getElementById('btnLimpiarBbox').addEventListener('click', () => {
  seleccion = null;
  document.getElementById('bboxStatus').textContent = 'Sin recorte — se analiza la imagen completa.';
  redibujar();
});

function extraerPixeles(img, bbox, maxLado = 300) {
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (bbox) { sx = bbox.x1; sy = bbox.y1; sw = bbox.x2 - bbox.x1; sh = bbox.y2 - bbox.y1; }
  const escala = Math.min(1, maxLado / Math.max(sw, sh));
  off.width = Math.max(1, Math.round(sw * escala));
  off.height = Math.max(1, Math.round(sh * escala));
  octx.drawImage(img, sx, sy, sw, sh, 0, 0, off.width, off.height);
  const data = octx.getImageData(0, 0, off.width, off.height).data;
  const pixeles = [];
  for (let i = 0; i < data.length; i += 4) {
    pixeles.push([data[i], data[i + 1], data[i + 2]]);
  }
  return pixeles;
}

function kmeans(pixeles, k, iters = 25, seed = 1) {
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const idxIniciales = new Set();
  while (idxIniciales.size < k) idxIniciales.add(Math.floor(rand() * pixeles.length));
  let centros = [...idxIniciales].map(i => [...pixeles[i]]);
  let etiquetas = new Array(pixeles.length).fill(0);

  for (let iter = 0; iter < iters; iter++) {
    for (let p = 0; p < pixeles.length; p++) {
      let mejor = 0, mejorD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = (pixeles[p][0] - centros[c][0]) ** 2 + (pixeles[p][1] - centros[c][1]) ** 2 + (pixeles[p][2] - centros[c][2]) ** 2;
        if (d < mejorD) { mejorD = d; mejor = c; }
      }
      etiquetas[p] = mejor;
    }
    const sumas = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let p = 0; p < pixeles.length; p++) {
      const c = etiquetas[p];
      sumas[c][0] += pixeles[p][0]; sumas[c][1] += pixeles[p][1]; sumas[c][2] += pixeles[p][2]; sumas[c][3]++;
    }
    let cambio = false;
    const nuevos = sumas.map((s, i) => s[3] > 0 ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centros[i]);
    for (let c = 0; c < k; c++) {
      if (Math.abs(nuevos[c][0] - centros[c][0]) > 0.5 || Math.abs(nuevos[c][1] - centros[c][1]) > 0.5 || Math.abs(nuevos[c][2] - centros[c][2]) > 0.5) cambio = true;
    }
    centros = nuevos;
    if (!cambio) break;
  }
  const pesos = Array.from({ length: k }, (_, c) => etiquetas.filter(e => e === c).length / pixeles.length);
  return { centros, pesos };
}

function luminancia([r, g, b]) { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }

const ETIQUETAS = {
  3: ['Sombra', 'Base', 'Luz'],
  5: ['Sombra profunda', 'Transición sombra', 'Base', 'Transición luz', 'Luz'],
};

document.getElementById('btnExtraer').addEventListener('click', () => {
  if (!imgNatural) { alert('Subí o pegá una imagen primero.'); return; }
  const tonos = parseInt(document.getElementById('tonosSelect').value, 10);
  const pixeles = extraerPixeles(imgNatural, seleccion, 300);
  const { centros, pesos } = kmeans(pixeles, tonos);

  const orden = centros.map((c, i) => i).sort((a, b) => luminancia(centros[a]) - luminancia(centros[b]));
  const etiquetas = ETIQUETAS[tonos];

  let html = '<div style="margin-top:12px;">';
  orden.forEach((idx, pos) => {
    const hex = rgbToHex(centros[idx]);
    html += `<div class="swatch swatch-clickable" onclick="usarColor('${hex}')" title="Click para copiar a Buscar, Mezcla y Capa">
      <span class="box" style="background:${hex}"></span>
      <b>${etiquetas[pos]}</b> — ${hex} — rgb(${centros[idx].map(v => Math.round(v)).join(', ')}) — ${(pesos[idx] * 100).toFixed(1)}% <span style="color:#5a8bff;">usar →</span></div><br>`;
  });
  html += '</div>';
  document.getElementById('extraccionResultado').innerHTML = html;
});
