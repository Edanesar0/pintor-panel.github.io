/* Zoom del visor del panel 1: botones (+ / − / restablecer) y pellizco en móvil.
 * Sin zoom con la rueda del mouse a propósito.
 * Solo cambia el tamaño VISUAL del canvas; coordDesdeEvento() en extraccion.js
 * ya compensa la escala con getBoundingClientRect(), así que el recorte sigue exacto. */

const visor = document.getElementById('visor');
let zoom = 1;
const ZOOM_STEP = 0.5, ZOOM_MIN = 1, ZOOM_MAX = 8;
const limitarZoom = (v) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));

function aplicarZoom() {
  if (!imgNatural) return;
  // Tamaño base = la imagen ajustada al ancho disponible (zoom 100%)
  const base = Math.min(canvas.width, visor.clientWidth);
  canvas.style.width = (base * zoom) + 'px';
  canvas.style.height = (base * zoom * canvas.height / canvas.width) + 'px';
  document.getElementById('zoomLevel').textContent = Math.round(zoom * 100) + '%';
}

function zoomReiniciar() {
  zoom = 1;
  aplicarZoom();
  visor.scrollLeft = 0;
  visor.scrollTop = 0;
}

// Cambia el zoom dejando el punto de contenido (cx, cy, medido a zoom 1)
// en la posición (offX, offY) relativa al visor.
function zoomAnclado(nuevoZoom, cx, cy, offX, offY) {
  zoom = limitarZoom(nuevoZoom);
  aplicarZoom();
  visor.scrollLeft = cx * zoom - offX;
  visor.scrollTop = cy * zoom - offY;
}

// ---------- Botones: zoom hacia el centro de lo que se ve ----------
function zoomCentrado(nuevoZoom) {
  if (!imgNatural) return;
  const offX = visor.clientWidth / 2, offY = visor.clientHeight / 2;
  const cx = (visor.scrollLeft + offX) / zoom;
  const cy = (visor.scrollTop + offY) / zoom;
  zoomAnclado(nuevoZoom, cx, cy, offX, offY);
}

document.getElementById('zoomIn').addEventListener('click', () => zoomCentrado(zoom + ZOOM_STEP));
document.getElementById('zoomOut').addEventListener('click', () => zoomCentrado(zoom - ZOOM_STEP));
document.getElementById('zoomReset').addEventListener('click', zoomReiniciar);

// ---------- Pellizco (2 dedos): zoom + desplazamiento ----------
let pinch = null;

function datosDedos(touches) {
  const rect = visor.getBoundingClientRect();
  const a = touches[0], b = touches[1];
  return {
    dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    offX: (a.clientX + b.clientX) / 2 - rect.left - visor.clientLeft,
    offY: (a.clientY + b.clientY) / 2 - rect.top - visor.clientTop,
  };
}

visor.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2 && imgNatural) {
    if (typeof cancelarArrastre === 'function') cancelarArrastre();
    const d = datosDedos(e.touches);
    pinch = {
      distInicial: d.dist,
      zoomInicial: zoom,
      cx: (visor.scrollLeft + d.offX) / zoom,
      cy: (visor.scrollTop + d.offY) / zoom,
    };
  }
}, { passive: true });

visor.addEventListener('touchmove', (e) => {
  if (pinch && e.touches.length === 2) {
    e.preventDefault();
    const d = datosDedos(e.touches);
    zoomAnclado(pinch.zoomInicial * d.dist / pinch.distInicial, pinch.cx, pinch.cy, d.offX, d.offY);
  }
}, { passive: false });

visor.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) pinch = null;
});
visor.addEventListener('touchcancel', () => { pinch = null; });

// Si cambia el ancho de la ventana (o se rota el celular), reajusta el tamaño base
window.addEventListener('resize', aplicarZoom);