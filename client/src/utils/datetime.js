// El servidor guarda las marcas de tiempo en UTC (SQLite CURRENT_TIMESTAMP
// "YYYY-MM-DD HH:MM:SS" o ISO sin zona). Estas funciones las interpretan como
// UTC y las muestran en la zona horaria del dispositivo que abre la app, para
// que la hora y la fecha queden sincronizadas con el equipo del usuario.
export function parseServerDate(value) {
  if (!value) return null;
  let s = String(value).trim().replace(' ', 'T');
  // Si no trae zona horaria explícita, se asume UTC (como lo guarda SQLite).
  if (!/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z';
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(value) {
  const d = parseServerDate(value);
  return d ? d.toLocaleString() : '';
}

export function formatDate(value) {
  const d = parseServerDate(value);
  return d ? d.toLocaleDateString() : '';
}
