/* Matematica de color compartida — espejo de scripts/match_inventario.py.
 * Si se corrige una formula aca, corregirla tambien alla (y viceversa). */

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

function rgbToHex([r, g, b]) {
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase();
  return '#' + c(r) + c(g) + c(b);
}

function rgbToLab([r, g, b]) {
  const lin = c => { c /= 255; return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92; };
  const rl = lin(r), gl = lin(g), bl = lin(b);
  let x = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
  let y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
  let z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;
  x /= 0.95047; y /= 1.0; z /= 1.08883;
  const f = t => t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t) + (16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [Math.max(0, 116 * fy - 16), 500 * (fx - fy), 200 * (fy - fz)];
}

function deltaE(hex1, hex2) {
  const l1 = rgbToLab(hexToRgb(hex1)), l2 = rgbToLab(hexToRgb(hex2));
  return Math.sqrt(l1.reduce((s, v, i) => s + (v - l2[i]) ** 2, 0));
}

function hueLab(hex) {
  const [, a, b] = rgbToLab(hexToRgb(hex));
  return ((Math.atan2(b, a) * 180 / Math.PI) + 360) % 360;
}

// Regla 1 de teoria-color.md: calido = rojo/naranja/amarillo, frio = verde/azul/violeta.
function temperatura(hex) {
  const h = hueLab(hex);
  return (h <= 135 || h >= 315) ? 'calido' : 'frio';
}

function mezclarN(hexes, pesos) {
  const total = pesos.reduce((s, p) => s + p, 0);
  let r = 0, g = 0, b = 0;
  hexes.forEach((h, i) => {
    const [rr, gg, bb] = hexToRgb(h);
    r += rr * pesos[i] / total; g += gg * pesos[i] / total; b += bb * pesos[i] / total;
  });
  return rgbToHex([r, g, b]);
}

function normalizarHex(valor) {
  if (!valor) return valor;
  valor = valor.trim().toUpperCase();
  return valor.startsWith('#') ? valor : '#' + valor;
}

// Umbrales de match (ver scripts/match_inventario.py): no exige HEX exacto.
const UMBRAL_CERCANO = 15.0;
const UMBRAL_ACEPTABLE = 30.0;

// Swatch de color en una celda de tabla.
function colHex(hex, label) {
  return `<span class="col-hex"><span class="box" style="background:${hex}"></span>${label}</span>`;
}
