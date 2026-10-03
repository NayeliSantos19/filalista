const ESTILOS = {
  esperando: ["En espera", "bg-sunLight text-sun"],
  llamado: ["Llamado", "bg-coralLight text-coral"],
  atendido: ["Atendido", "bg-mintLight text-mint"],
  no_presento: ["No se presentó", "bg-neutral-100 text-muted"],
  cancelado: ["Cancelado", "bg-neutral-100 text-muted"],
};

export default function Estado({ estado }) {
  const [texto, clases] = ESTILOS[estado] ?? [estado, "bg-neutral-100 text-muted"];
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${clases}`}>{texto}</span>;
}
