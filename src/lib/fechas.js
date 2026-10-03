// Zona horaria del negocio. Debe coincidir con hoy_local() en supabase-schema.sql
export const ZONA_HORARIA = "America/El_Salvador";

// "2026-09-30" según la hora local del negocio
export function hoyLocal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function hora(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("es-SV", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA_HORARIA,
  });
}

export function minutosEntre(desde, hasta) {
  return (new Date(hasta) - new Date(desde)) / 60000;
}

export function promedio(valores) {
  const v = valores.filter((x) => x != null && !Number.isNaN(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function formatoMin(m) {
  if (m == null || Number.isNaN(m)) return "—";
  if (m < 1) return "< 1 min";
  return `${Math.round(m)} min`;
}
