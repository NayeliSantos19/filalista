import { useState } from "react";
import { generarDemo } from "../lib/demo";

// Botón que llena la fila con turnos de prueba (modo demo)
export default function BotonDemo({ variante = "principal", etiqueta = "Llenar la fila con turnos de prueba", alTerminar, className = "" }) {
  const [estado, setEstado] = useState("listo"); // listo | cargando | hecho | error
  const [texto, setTexto] = useState("");

  async function generar() {
    setEstado("cargando");
    try {
      const n = await generarDemo();
      setEstado("hecho");
      setTexto(`Se crearon ${n} turnos de prueba.`);
      alTerminar?.(n);
    } catch (e) {
      setEstado("error");
      setTexto(e.message);
    }
  }

  const estilos =
    variante === "principal"
      ? "bg-accent text-paper hover:opacity-90"
      : "bg-white border border-line text-ink hover:border-accent";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={generar}
        disabled={estado === "cargando"}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${estilos}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </svg>
        {estado === "cargando" ? "Creando turnos…" : etiqueta}
      </button>
      {texto && (
        <p className={`text-[12px] mt-2 ${estado === "error" ? "text-red-600" : "text-mint font-semibold"}`}>{texto}</p>
      )}
    </div>
  );
}
