import { Link } from "react-router-dom";

export default function Marca({ oscuro = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-accent text-paper font-display font-bold text-[13px] flex items-center justify-center">
        01
      </span>
      <span className={`font-display font-bold text-lg ${oscuro ? "text-paper" : "text-ink"}`}>FilaLista</span>
    </Link>
  );
}
