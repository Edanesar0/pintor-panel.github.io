/* Panel 3 — Mezcla en paleta dentro de una gama (equivalente a match_inventario.py mezcla). */

function cumpleTeoria(componentesHex, mezclaHex, tono, baseHex) {
  if (!tono || !baseHex) return null;
  const Lbase = rgbToLab(hexToRgb(baseHex))[0];
  const Lmezcla = rgbToLab(hexToRgb(mezclaHex))[0];
  const temps = componentesHex.map(temperatura);
  if (tono === 'sombra') return temps.includes('frio') && Lmezcla < Lbase;
  if (tono === 'luz') return temps.includes('calido') && Lmezcla > Lbase;
  return null;
}

function combinaciones(arr, k) {
  const resultado = [];
  const combo = [];
  function recurse(start) {
    if (combo.length === k) { resultado.push([...combo]); return; }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      recurse(i + 1);
      combo.pop();
    }
  }
  recurse(0);
  return resultado;
}

const PROPORCIONES_2 = [0.25, 0.5, 0.75];
const PROPORCIONES_3 = [[0.5, 0.25, 0.25], [0.34, 0.33, 0.33], [0.6, 0.2, 0.2], [0.2, 0.6, 0.2], [0.2, 0.2, 0.6]];

function mezcla(targetHex, gama, tono, baseHex, top = 8) {
  const pool = INVENTARIO.filter(e => e.gama === gama);
  const candidatos = [];

  combinaciones(pool, 2).forEach(([a, b]) => {
    PROPORCIONES_2.forEach(prop => {
      const hex = mezclarN([a.hex, b.hex], [prop, 1 - prop]);
      const componentes = [a.hex, b.hex];
      candidatos.push({
        proporcion: `${Math.round(prop * 100)}% ${a.code} + ${Math.round((1 - prop) * 100)}% ${b.code}`,
        hex, delta_e: Math.round(deltaE(targetHex, hex) * 10) / 10,
        cumple: cumpleTeoria(componentes, hex, tono, baseHex),
      });
    });
  });

  combinaciones(pool, 3).forEach(([a, b, c]) => {
    PROPORCIONES_3.forEach(([p1, p2, p3]) => {
      const hex = mezclarN([a.hex, b.hex, c.hex], [p1, p2, p3]);
      const componentes = [a.hex, b.hex, c.hex];
      candidatos.push({
        proporcion: `${Math.round(p1 * 100)}% ${a.code} + ${Math.round(p2 * 100)}% ${b.code} + ${Math.round(p3 * 100)}% ${c.code}`,
        hex, delta_e: Math.round(deltaE(targetHex, hex) * 10) / 10,
        cumple: cumpleTeoria(componentes, hex, tono, baseHex),
      });
    });
  });

  candidatos.sort((x, y) => {
    const px = x.cumple === false ? 1 : 0, py = y.cumple === false ? 1 : 0;
    if (px !== py) return px - py;
    return x.delta_e - y.delta_e;
  });
  return candidatos.slice(0, top);
}

vincularColorInput('mezclaColor', 'mezclaHex');
vincularColorInput('mezclaBaseColor', 'mezclaBaseHex');

document.getElementById('btnMezcla').addEventListener('click', () => {
  const hex = valorHex('mezclaHex');
  const gama = document.getElementById('mezclaGama').value;
  const tono = document.getElementById('mezclaTono').value;
  const baseHex = tono ? valorHex('mezclaBaseHex') : null;

  document.getElementById('mezclaStatus').textContent =
    `Calculando combinaciones de 2 y 3 colores dentro de ${gama}... (puede tardar unos segundos en gamas grandes)`;
  document.getElementById('mezclaResultado').innerHTML = '';

  setTimeout(() => {
    const t0 = performance.now();
    const resultado = mezcla(hex, gama, tono || null, baseHex);
    const ms = Math.round(performance.now() - t0);
    document.getElementById('mezclaStatus').textContent = `Listo en ${ms} ms.`;

    const filas = resultado.map(c => {
      let tag = '';
      if (c.cumple === true) tag = '<span class="tag ok">cumple teoría</span>';
      else if (c.cumple === false) tag = '<span class="tag no">no sigue temperatura</span>';
      return `<tr><td>${c.proporcion}</td><td>${colHex(c.hex, c.hex)}</td><td>${c.delta_e}</td><td>${tag}</td></tr>`;
    }).join('');
    document.getElementById('mezclaResultado').innerHTML =
      `<table><tr><th>Proporción</th><th>Resultado</th><th>&Delta;E</th><th></th></tr>${filas}</table>`;
  }, 30);
});
