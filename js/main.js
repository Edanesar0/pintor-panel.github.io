/* Punto de entrada — solo lo que es realmente compartido entre paneles. */

// Copia un HEX extraido (panel 1) a todos los campos de color de Buscar (2),
// Mezcla (3) y Capa (4), para encadenar extraccion -> matching sin retipear.
// Los campos quedan editables despues por si se quiere ajustar uno solo (ej.
// el objetivo de la capa, si se clickeo la Base pero se quiere buscar hacia
// otro tono).
function usarColor(hex) {
  hex = hex.toUpperCase();
  ['buscarColor', 'mezclaColor', 'mezclaBaseColor', 'capaBaseColor', 'capaObjetivoColor']
    .forEach(id => document.getElementById(id).value = hex);
  ['buscarHex', 'mezclaHex', 'mezclaBaseHex', 'capaBaseHex', 'capaObjetivoHex']
    .forEach(id => document.getElementById(id).value = hex);
}
