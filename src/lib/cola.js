// Reglas de la fila. Deben coincidir con llamar_siguiente() en la base de datos.

export const MOTIVOS = [
  { id: "adulto_mayor", nombre: "Adulto mayor (60+)" },
  { id: "embarazo", nombre: "Embarazada" },
  { id: "discapacidad", nombre: "Persona con discapacidad" },
];

export function nombreMotivo(id) {
  return MOTIVOS.find((m) => m.id === id)?.nombre ?? "Atención preferencial";
}

// ¿Fueron preferenciales los 2 últimos llamados del día? (el más reciente primero)
export function historialLlamados(turnos) {
  return turnos
    .filter((t) => t.llamado_en)
    .sort((a, b) => new Date(b.llamado_en) - new Date(a.llamado_en))
    .slice(0, 2)
    .map((t) => t.prioridad);
}

// Orden en que se llamará a las personas que esperan:
// 1 preferencial por cada 2 normales, respetando la hora de llegada dentro de cada grupo.
export function ordenDeLlamado(esperando, historial = []) {
  const pref = esperando.filter((t) => t.prioridad);
  const normal = esperando.filter((t) => !t.prioridad);
  const recientes = [...historial];
  const orden = [];

  while (pref.length || normal.length) {
    const tocaPreferencial = !recientes.slice(0, 2).some(Boolean);
    const siguiente = tocaPreferencial && pref.length ? pref.shift() : normal.length ? normal.shift() : pref.shift();
    orden.push(siguiente);
    recientes.unshift(siguiente.prioridad);
  }
  return orden;
}
