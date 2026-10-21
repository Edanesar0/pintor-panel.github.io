/* Utilidades de UI compartidas entre paneles. */

// Sincroniza un <input type="color"> con su <input type="text"> hermano
// (todos los paneles repiten este par: elegir con el picker o escribir el HEX a mano).
function vincularColorInput(colorId, hexId) {
  document.getElementById(colorId).addEventListener('input', (e) => {
    document.getElementById(hexId).value = e.target.value.toUpperCase();
  });
}

function valorHex(id) {
  return normalizarHex(document.getElementById(id).value);
}
