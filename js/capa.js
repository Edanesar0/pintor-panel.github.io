/* Panel 4 — Capa sobre una base ya pintada (equivalente a match_inventario.py capa).
 * No es una mezcla en paleta: simula alpha compositing (la base se transparenta). */

const TECNICA_ALPHA = {
  wash: 0.18, pinwash: 0.18, glazing: 0.22, layering: 0.40, ink: 0.10, semiseco: 0.12,
};
const TECNICAS_SOMBRA_LUZ = Object.keys(TECNICA_ALPHA);

function alphaAcumulado(alphaPass, pasadas) {
  return 1 - Math.pow(1 - alphaPass, pasadas);
}

function simularCapa(baseHex, capaHex, tecnica, pasadas) {
  const alpha = alphaAcumulado(TECNICA_ALPHA[tecnica], pasadas);
  const baseRgb = hexToRgb(baseHex), capaRgb = hexToRgb(capaHex);
  const resultado = baseRgb.map((b, i) => b * (1 - alpha) + capaRgb[i] * alpha);
  return { hex: rgbToHex(resultado), alpha: Math.round(alpha * 1000) / 1000 };
}

// Modo directo: aplico ESTE codigo con ESTA tecnica sobre la base.
function capaSimular(baseHex, code, tecnicaFiltro, pasadasMax = 4) {
  const entrada = INVENTARIO.find(e => e.code.toUpperCase() === code.toUpperCase());
  if (!entrada) return null;
  const tecnicas = tecnicaFiltro ? [tecnicaFiltro] : TECNICAS_SOMBRA_LUZ;
  const resultados = [];
  tecnicas.forEach(tec => {
    for (let p = 1; p <= pasadasMax; p++) {
      const { hex, alpha } = simularCapa(baseHex, entrada.hex, tec, p);
      resultados.push({ tecnica: tec, pasadas: p, alpha, hex });
    }
  });
  return { code: entrada.code, name: entrada.name, gama: entrada.gama, hexColor: entrada.hex, resultados };
}

// Modo busqueda inversa: que codigo + tecnica + pasadas del inventario ENTERO
// (cruza gamas, aca no aplica la restriccion de "misma gama" de mezcla) llega
// mas cerca del objetivo al aplicarse sobre la base.
function capaBuscar(baseHex, objetivoHex, gamaFiltro, tecnicaFiltro, pasadasMax = 4, top = 8) {
  let pool = INVENTARIO;
  if (gamaFiltro) pool = pool.filter(e => e.gama === gamaFiltro);
  const tecnicas = tecnicaFiltro ? [tecnicaFiltro] : TECNICAS_SOMBRA_LUZ;
  const candidatos = [];
  pool.forEach(e => {
    if (e.hex.toUpperCase() === baseHex.toUpperCase()) return;
    tecnicas.forEach(tec => {
      for (let p = 1; p <= pasadasMax; p++) {
        const { hex, alpha } = simularCapa(baseHex, e.hex, tec, p);
        candidatos.push({
          code: e.code, name: e.name, gama: e.gama, tecnica: tec, pasadas: p,
          alpha, hex, delta_e: Math.round(deltaE(objetivoHex, hex) * 10) / 10,
        });
      }
    });
  });
  candidatos.sort((a, b) => a.delta_e - b.delta_e);
  return candidatos.slice(0, top);
}

vincularColorInput('capaBaseColor', 'capaBaseHex');
vincularColorInput('capaObjetivoColor', 'capaObjetivoHex');

document.getElementById('btnCapa').addEventListener('click', () => {
  const baseHex = valorHex('capaBaseHex');
  const codigo = document.getElementById('capaCodigo').value.trim();
  const tecnica = document.getElementById('capaTecnica').value || null;
  const pasadas = parseInt(document.getElementById('capaPasadas').value, 10) || 1;

  const div = document.getElementById('capaResultado');
  const status = document.getElementById('capaStatus');

  if (codigo) {
    const salida = capaSimular(baseHex, codigo, tecnica, 4);
    if (!salida) { status.textContent = `Código '${codigo}' no encontrado en el inventario.`; div.innerHTML = ''; return; }
    // Con tecnica elegida: progresion 1..4 pasadas de esa tecnica.
    // Sin tecnica elegida: compara todas las tecnicas en la cantidad de pasadas pedida.
    const filtrados = tecnica ? salida.resultados : salida.resultados.filter(r => r.pasadas === pasadas);
    status.textContent = `Modo directo: aplicando ${salida.code} (${salida.name}, ${salida.hexColor}) sobre ${baseHex}.`;
    const filas = filtrados.map(r => `<tr><td>${r.tecnica}</td><td>${r.pasadas}</td><td>${r.alpha}</td><td>${colHex(r.hex, r.hex)}</td></tr>`).join('');
    div.innerHTML = `<table><tr><th>Técnica</th><th>Pasadas</th><th>Alpha acum.</th><th>Resultado</th></tr>${filas}</table>`;
  } else {
    const objetivo = valorHex('capaObjetivoHex');
    status.textContent = `Modo búsqueda: de ${baseHex} a ${objetivo} en todo el inventario...`;
    const resultado = capaBuscar(baseHex, objetivo, null, tecnica);
    status.textContent = `Modo búsqueda: de ${baseHex} a ${objetivo}.`;
    const filas = resultado.map(c =>
      `<tr><td>${c.gama}</td><td>${c.code}</td><td>${c.name}</td><td>${c.tecnica}</td><td>${c.pasadas}</td><td>${colHex(c.hex, c.hex)}</td><td>${c.delta_e}</td></tr>`
    ).join('');
    div.innerHTML = `<table><tr><th>Gama</th><th>Código</th><th>Nombre</th><th>Técnica</th><th>Pasadas</th><th>Resultado</th><th>&Delta;E</th></tr>${filas}</table>`;
  }
});
