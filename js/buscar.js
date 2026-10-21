/* Panel 2 — Buscar en inventario (equivalente a match_inventario.py buscar). */

function buscar(targetHex, gamaFiltro) {
  let pool = INVENTARIO;
  if (gamaFiltro) pool = pool.filter(e => e.gama === gamaFiltro);
  const resultados = pool.map(e => ({ ...e, delta_e: Math.round(deltaE(targetHex, e.hex) * 10) / 10 }));
  resultados.sort((a, b) => a.delta_e - b.delta_e);
  const cercanos = resultados.filter(r => r.delta_e <= UMBRAL_CERCANO);
  const aceptables = resultados.filter(r => r.delta_e > UMBRAL_CERCANO && r.delta_e <= UMBRAL_ACEPTABLE);
  return { cercanos, aceptables, top: resultados.slice(0, 5), hayMatch: cercanos.length > 0 || aceptables.length > 0 };
}

function renderBuscarResultado(salida, targetHex) {
  const div = document.getElementById('buscarResultado');
  const filaHTML = r => `<tr><td>${r.gama}</td><td>${r.code}</td><td>${r.name}</td><td>${colHex(r.hex, r.hex)}</td><td>${r.delta_e}</td></tr>`;
  let html = '';
  if (salida.cercanos.length) {
    html += `<h3 style="font-size:13px;margin:14px 0 4px;color:#8ee6a8;">Cercanos (uso directo)</h3>
      <table><tr><th>Gama</th><th>Código</th><th>Nombre</th><th>Hex</th><th>&Delta;E</th></tr>${salida.cercanos.map(filaHTML).join('')}</table>`;
  }
  if (salida.aceptables.length) {
    html += `<h3 style="font-size:13px;margin:14px 0 4px;color:#e6c98e;">Aceptables (tono cercano)</h3>
      <table><tr><th>Gama</th><th>Código</th><th>Nombre</th><th>Hex</th><th>&Delta;E</th></tr>${salida.aceptables.map(filaHTML).join('')}</table>`;
  }
  if (!salida.hayMatch) {
    html += `<p class="status">Ningún color del inventario está suficientemente cerca de ${targetHex}. Usá la sección de mezcla. Top 5 más cercanos de referencia:</p>
      <table><tr><th>Gama</th><th>Código</th><th>Nombre</th><th>Hex</th><th>&Delta;E</th></tr>${salida.top.map(filaHTML).join('')}</table>`;
  }
  div.innerHTML = html;
}

vincularColorInput('buscarColor', 'buscarHex');
document.getElementById('btnBuscar').addEventListener('click', () => {
  const hex = valorHex('buscarHex');
  const gama = document.getElementById('buscarGama').value;
  renderBuscarResultado(buscar(hex, gama), hex);
});
