import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { HAY_DEMO } from "../lib/demo";
import BotonDemo from "../components/BotonDemo.jsx";
import { useCatalogo } from "../hooks/useCatalogo";
import { useTurnosHoy } from "../hooks/useTurnosHoy";
import { formatoMin, hora, minutosEntre, promedio } from "../lib/fechas";
import Navegacion from "../components/Navegacion.jsx";
import Preferencial from "../components/Preferencial.jsx";
import Estado from "../components/Estado.jsx";

function metricas(lista) {
  const atendidos = lista.filter((t) => t.estado === "atendido");
  return {
    emitidos: lista.length,
    esperando: lista.filter((t) => t.estado === "esperando").length,
    atendidos: atendidos.length,
    ausentes: lista.filter((t) => t.estado === "no_presento").length,
    preferenciales: lista.filter((t) => t.prioridad).length,
    cancelados: lista.filter((t) => t.estado === "cancelado").length,
    espera: promedio(lista.filter((t) => t.llamado_en).map((t) => minutosEntre(t.creado_en, t.llamado_en))),
    atencion: promedio(
      atendidos.filter((t) => t.llamado_en && t.finalizado_en).map((t) => minutosEntre(t.llamado_en, t.finalizado_en))
    ),
  };
}

export default function Resumen() {
  const { servicios, ventanillas } = useCatalogo();
  const { turnos, cargando, recargar } = useTurnosHoy();
  const total = metricas(turnos);
  const recientes = [...turnos].reverse().slice(0, 15);

  return (
    <div className="min-h-screen px-5 py-6 max-w-5xl mx-auto">
      <Navegacion
        extra={
          <Link to="/operador" className="md:hidden px-3 py-2 rounded-xl border border-line bg-white text-sm font-medium">
            Ir al panel
          </Link>
        }
      />

      <div className="flex flex-wrap items-end justify-between gap-4 mt-10">
        <div>
          <h1 className="font-display text-3xl font-bold">Resumen de hoy</h1>
          <p className="text-sm text-muted mt-1">{cargando ? "Cargando…" : "Se actualiza en tiempo real."}</p>
        </div>
        {HAY_DEMO && <ControlesDemo alTerminar={recargar} />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <Tile valor={total.emitidos} etiqueta="Turnos emitidos" />
        <Tile valor={total.atendidos} etiqueta="Atendidos" color="text-mint" />
        <Tile valor={formatoMin(total.espera)} etiqueta="Espera promedio" color="text-sun" />
        <Tile valor={formatoMin(total.atencion)} etiqueta="Atención promedio" color="text-accent" />
      </div>

      <section className="bg-white border border-line rounded-3xl p-6 mt-5 overflow-x-auto">
        <h2 className="font-display font-bold text-lg">Por servicio</h2>
        <table className="w-full text-sm mt-3 min-w-[620px]">
          <thead>
            <tr className="text-left text-[12px] text-muted">
              <th className="py-2 font-medium">Servicio</th>
              <th className="py-2 font-medium text-right">Emitidos</th>
              <th className="py-2 font-medium text-right">En espera</th>
              <th className="py-2 font-medium text-right">Atendidos</th>
              <th className="py-2 font-medium text-right">No llegaron</th>
              <th className="py-2 font-medium text-right">★ Pref.</th>
              <th className="py-2 font-medium text-right">Espera prom.</th>
              <th className="py-2 font-medium text-right">Atención prom.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular">
            {servicios.map((s) => {
              const m = metricas(turnos.filter((t) => t.servicio_id === s.id));
              return (
                <tr key={s.id}>
                  <td className="py-3 font-semibold">
                    {s.prefijo} · {s.nombre}
                  </td>
                  <td className="py-3 text-right">{m.emitidos}</td>
                  <td className="py-3 text-right">{m.esperando}</td>
                  <td className="py-3 text-right">{m.atendidos}</td>
                  <td className="py-3 text-right">{m.ausentes}</td>
                  <td className="py-3 text-right">{m.preferenciales}</td>
                  <td className="py-3 text-right">{formatoMin(m.espera)}</td>
                  <td className="py-3 text-right">{formatoMin(m.atencion)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <section className="bg-white border border-line rounded-3xl p-6">
          <h2 className="font-display font-bold text-lg">Por ventanilla</h2>
          <ul className="mt-3 divide-y divide-line">
            {ventanillas.map((v) => {
              const m = metricas(turnos.filter((t) => t.ventanilla_id === v.id));
              const maxAtendidos = Math.max(1, ...ventanillas.map((x) => turnos.filter((t) => t.ventanilla_id === x.id && t.estado === "atendido").length));
              return (
                <li key={v.id} className="py-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{v.nombre}</span>
                    <span className="text-muted tabular">
                      {m.atendidos} atendidos · {formatoMin(m.atencion)}
                    </span>
                  </div>
                  <div className="h-2 bg-paper rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(m.atendidos / maxAtendidos) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-white border border-line rounded-3xl p-6">
          <h2 className="font-display font-bold text-lg">Actividad reciente</h2>
          <ul className="mt-3 divide-y divide-line">
            {recientes.length === 0 && <li className="py-3 text-sm text-muted">Aún no hay turnos hoy.</li>}
            {recientes.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-3">
                  <span className="font-display font-bold tabular w-16">
                    {t.codigo} <Preferencial turno={t} />
                  </span>
                  <Estado estado={t.estado} />
                </span>
                <span className="text-[12px] text-muted">
                  {t.ventanilla?.nombre ? `${t.ventanilla.nombre} · ` : ""}
                  {hora(t.creado_en)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Tile({ valor, etiqueta, color = "text-ink" }) {
  return (
    <div className="bg-white border border-line rounded-2xl p-5">
      <p className={`font-display font-bold text-3xl tabular ${color}`}>{valor}</p>
      <p className="text-[12px] text-muted mt-1">{etiqueta}</p>
    </div>
  );
}

function ControlesDemo({ alTerminar }) {
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState(null);

  async function reiniciar() {
    const { error } = await supabase.rpc("reiniciar_demo");
    setConfirmar(false);
    if (error) setError("No se pudo reiniciar. ¿Corriste supabase-demo.sql?");
    else alTerminar?.();
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <BotonDemo variante="secundario" alTerminar={alTerminar} />
      {!confirmar ? (
        <button
          type="button"
          onClick={() => setConfirmar(true)}
          className="rounded-xl px-4 py-3 text-sm font-semibold border border-line bg-white text-muted hover:text-red-600 transition"
        >
          Reiniciar el día
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-white border border-red-200 rounded-xl px-3 py-2 text-[13px]">
          <span>¿Borrar todos los turnos de hoy?</span>
          <button onClick={reiniciar} className="font-semibold text-red-600">Sí</button>
          <button onClick={() => setConfirmar(false)} className="text-muted">No</button>
        </div>
      )}
      {error && <p className="w-full text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
