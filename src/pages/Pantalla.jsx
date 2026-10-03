import { useEffect, useRef, useState } from "react";
import { useTurnosHoy } from "../hooks/useTurnosHoy";
import { useCatalogo } from "../hooks/useCatalogo";
import { anunciar, campana, desbloquearAudio, textoAnuncio } from "../lib/sonido";
import { ZONA_HORARIA } from "../lib/fechas";
import Navegacion from "../components/Navegacion.jsx";

function useReloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 10000);
    return () => clearInterval(t);
  }, []);
  return ahora;
}

export default function Pantalla() {
  const { turnos, cargando } = useTurnosHoy();
  const { servicios } = useCatalogo();
  const [sonido, setSonido] = useState(false);
  const ultimoAnunciado = useRef(null);
  const ahora = useReloj();

  const llamados = turnos
    .filter((t) => t.llamado_en && ["llamado", "atendido", "no_presento"].includes(t.estado))
    .sort((a, b) => new Date(b.llamado_en) - new Date(a.llamado_en));
  const actual = llamados[0];
  const anteriores = llamados.slice(1, 7);
  const clave = actual ? `${actual.id}-${actual.llamado_en}` : "";

  // Anuncia solo los llamados nuevos (no los que ya estaban al abrir la pantalla)
  useEffect(() => {
    if (cargando) return;
    if (ultimoAnunciado.current === null) {
      ultimoAnunciado.current = clave;
      return;
    }
    if (clave && clave !== ultimoAnunciado.current) {
      ultimoAnunciado.current = clave;
      if (sonido) {
        campana();
        setTimeout(() => anunciar(textoAnuncio(actual)), 1300);
      }
    }
  }, [clave, cargando, sonido, actual]);

  return (
    <div className="min-h-screen bg-night text-paper p-6 lg:p-10 flex flex-col">
      <header className="flex items-center justify-between">
        <Navegacion oscuro ocultarSecciones />
        <div className="text-right">
          <p className="font-display font-bold text-3xl tabular">
            {ahora.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", timeZone: ZONA_HORARIA })}
          </p>
          <p className="text-[13px] text-paper/50 capitalize">
            {ahora.toLocaleDateString("es-SV", { weekday: "long", day: "numeric", month: "long", timeZone: ZONA_HORARIA })}
          </p>
        </div>
      </header>

      <main className="flex-grow grid lg:grid-cols-[1.6fr_1fr] gap-6 mt-8">
        {/* Turno actual */}
        <section className="bg-nightCard rounded-3xl flex flex-col items-center justify-center p-10 text-center">
          {actual ? (
            <div key={clave} className="animate-pop-in">
              <p className="text-xl text-paper/60 font-medium">Turno</p>
              <p className="font-display font-bold text-[8rem] lg:text-[11rem] leading-none text-coral tabular mt-2">
                {actual.codigo}
              </p>
              <div className="mt-8 inline-flex items-center gap-3 bg-coral text-white rounded-2xl px-8 py-4 animate-destello">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                <span className="font-display font-bold text-4xl">{actual.ventanilla?.nombre}</span>
              </div>
              <p className="text-paper/50 mt-5">{actual.servicio?.nombre}</p>
            </div>
          ) : (
            <p className="text-2xl text-paper/50">{cargando ? "Conectando…" : "Aún no se han llamado turnos hoy"}</p>
          )}
        </section>

        {/* Últimos llamados + espera */}
        <aside className="flex flex-col gap-6">
          <section className="bg-nightCard rounded-3xl p-6 flex-grow">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">Últimos llamados</h2>
            <ul className="mt-4 divide-y divide-white/5">
              {anteriores.length === 0 && <li className="py-3 text-paper/40">—</li>}
              {anteriores.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <span className="font-display font-bold text-3xl tabular">{t.codigo}</span>
                  <span className="text-lg text-paper/70">{t.ventanilla?.nombre}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-nightCard rounded-3xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">En espera</h2>
            <ul className="mt-4 grid grid-cols-3 gap-3">
              {servicios.map((s) => (
                <li key={s.id} className="bg-white/5 rounded-2xl p-3 text-center">
                  <p className="font-display font-bold text-3xl tabular">
                    {turnos.filter((t) => t.servicio_id === s.id && t.estado === "esperando").length}
                  </p>
                  <p className="text-[12px] text-paper/60 mt-1 leading-tight">{s.nombre}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </main>

      {!sonido && (
        <button
          onClick={() => {
            desbloquearAudio();
            setSonido(true);
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-paper text-ink rounded-full px-6 py-3 font-semibold shadow-lg"
        >
          🔊 Toca para activar el sonido
        </button>
      )}
    </div>
  );
}
