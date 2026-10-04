import { nombreMotivo } from "../lib/cola";

// Estrella que marca un turno preferencial. Con `conTexto` muestra también el motivo.
export default function Preferencial({ turno, conTexto = false, className = "" }) {
  if (!turno?.prioridad) return null;
  const titulo = nombreMotivo(turno.motivo_prioridad);
  if (!conTexto) {
    return (
      <span title={titulo} aria-label={titulo} className={`text-sun ${className}`}>
        ★
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold bg-sunLight text-sun rounded-full px-2.5 py-1 ${className}`}>
      ★ Preferencial · {titulo}
    </span>
  );
}
