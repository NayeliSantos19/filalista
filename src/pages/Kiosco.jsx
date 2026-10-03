import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../lib/supabaseClient";
import { useCatalogo } from "../hooks/useCatalogo";
import { useTurnosHoy } from "../hooks/useTurnosHoy";
import Navegacion from "../components/Navegacion.jsx";

const SEGUNDOS_TICKET = 25;

export default function Kiosco() {
  const { servicios, cargando } = useCatalogo();
  const { turnos } = useTurnosHoy();
  const [ticket, setTicket] = useState(null);
  const [enviando, setEnviando] = useState(null);
  const [error, setError] = useState(null);

  const esperando = (servicioId) =>
    turnos.filter((t) => t.servicio_id === servicioId && t.estado === "esperando").length;

  async function sacarTurno(servicio) {
    setEnviando(servicio.id);
    setError(null);
    const antes = esperando(servicio.id);
    const { data, error } = await supabase.rpc("sacar_turno", { p_servicio_id: servicio.id });
    setEnviando(null);
    if (error) {
      setError("No pudimos generar tu turno. Intenta de nuevo.");
      return;
    }
    setTicket({ ...data, servicio, antes });
  }

  // El kiosco vuelve solo a la pantalla de servicios
  useEffect(() => {
    if (!ticket) return;
    const t = setTimeout(() => setTicket(null), SEGUNDOS_TICKET * 1000);
    return () => clearTimeout(t);
  }, [ticket]);

  if (ticket) {
    const url = `${window.location.origin}/turno/${ticket.id}`;
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm bg-white border border-line rounded-3xl p-8 text-center animate-pop-in">
          <p className="text-sm font-semibold text-muted">{ticket.servicio.nombre}</p>
          <p className="font-display font-bold text-7xl text-ink mt-2 tabular">{ticket.codigo}</p>
          <p className="text-sm text-muted mt-3">
            {ticket.antes === 0
              ? "Eres el siguiente en la fila."
              : `Hay ${ticket.antes} ${ticket.antes === 1 ? "persona" : "personas"} antes que tú.`}
          </p>

          <div className="border-t border-dashed border-line my-6" />

          <div className="inline-block p-3 bg-paper rounded-2xl">
            <QRCodeSVG value={url} size={148} bgColor="transparent" fgColor="#1E1D24" />
          </div>
          <p className="text-[13px] text-muted mt-3 leading-relaxed">
            Escanea para seguir tu turno desde el celular y recibir un aviso cuando te llamen.
          </p>

          <div className="flex gap-2 mt-6">
            <Link to={`/turno/${ticket.id}`} className="flex-1 py-3 rounded-xl border border-line text-sm font-semibold">
              Ver aquí
            </Link>
            <button
              onClick={() => setTicket(null)}
              className="flex-1 py-3 rounded-xl bg-accent text-paper text-sm font-semibold"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-3xl mx-auto flex flex-col">
      <Navegacion />
      <div className="flex-grow flex flex-col justify-center py-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-center">¡Bienvenido! ¿Qué necesitas hoy?</h1>
        <p className="text-muted text-center mt-2">Toca un servicio para obtener tu número.</p>

        <div className="mt-10 flex flex-col gap-4">
          {cargando && <p className="text-center text-sm text-muted">Cargando servicios…</p>}
          {!cargando && servicios.length === 0 && (
            <p className="text-center text-sm text-muted">
              No hay servicios configurados. Revisa que corriste <code>supabase-schema.sql</code>.
            </p>
          )}
          {servicios.map((s, i) => {
            const n = esperando(s.id);
            return (
              <button
                key={s.id}
                onClick={() => sacarTurno(s)}
                disabled={!!enviando}
                style={{ animationDelay: `${i * 70}ms` }}
                className="animate-fade-in-up group flex items-center gap-5 text-left bg-white border-2 border-line rounded-2xl p-5 sm:p-6 hover:border-accent active:scale-[0.99] transition disabled:opacity-60"
              >
                <span className="w-16 h-16 shrink-0 rounded-2xl bg-accent text-paper font-display font-bold text-3xl flex items-center justify-center">
                  {s.prefijo}
                </span>
                <span className="flex-grow">
                  <span className="block font-display font-bold text-xl">{s.nombre}</span>
                  {s.descripcion && <span className="block text-sm text-muted mt-0.5">{s.descripcion}</span>}
                </span>
                <span className="text-right shrink-0">
                  <span className="block font-display font-bold text-2xl tabular">{n}</span>
                  <span className="block text-[11px] text-muted">en espera</span>
                </span>
              </button>
            );
          })}
        </div>

        {enviando && <p className="text-center text-sm text-muted mt-6">Generando tu turno…</p>}
        {error && <p className="text-center text-sm text-red-600 mt-6">{error}</p>}
      </div>
    </div>
  );
}
