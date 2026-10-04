import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useTurnosHoy } from "../hooks/useTurnosHoy";
import { campana, desbloquearAudio, audioListo } from "../lib/sonido";
import { hora } from "../lib/fechas";
import Navegacion from "../components/Navegacion.jsx";
import Preferencial from "../components/Preferencial.jsx";
import { historialLlamados, ordenDeLlamado } from "../lib/cola";

export default function MiTurno() {
  const { id } = useParams();
  const { turnos, cargando } = useTurnosHoy();
  const [avisoActivo, setAvisoActivo] = useState(false);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const estadoAnterior = useRef(null);

  const turno = turnos.find((t) => t.id === id);

  // Personas del mismo servicio que llegaron antes y siguen esperando
  // Personas que pasarán antes, aplicando la regla de 1 preferencial por cada 2 normales
  const antes =
    turno?.estado === "esperando"
      ? Math.max(
          0,
          ordenDeLlamado(
            turnos.filter((t) => t.estado === "esperando" && t.servicio_id === turno.servicio_id),
            historialLlamados(turnos)
          ).findIndex((t) => t.id === turno.id)
        )
      : 0;

  const enAtencion = turno
    ? turnos
        .filter((t) => t.servicio_id === turno.servicio_id && t.estado === "llamado")
        .sort((a, b) => new Date(b.llamado_en) - new Date(a.llamado_en))[0]
    : null;

  // Aviso (vibración + sonido) cuando el turno pasa a "llamado" o lo vuelven a llamar
  const claveLlamado = turno?.estado === "llamado" ? turno.llamado_en : null;
  useEffect(() => {
    if (cargando) return;
    if (estadoAnterior.current === undefined || estadoAnterior.current === null) {
      estadoAnterior.current = claveLlamado ?? "";
      return;
    }
    if (claveLlamado && claveLlamado !== estadoAnterior.current) {
      navigator.vibrate?.([300, 120, 300, 120, 300]);
      if (audioListo()) campana();
    }
    estadoAnterior.current = claveLlamado ?? "";
  }, [claveLlamado, cargando]);

  async function cancelar() {
    await supabase.rpc("cancelar_turno", { p_turno_id: id });
    setConfirmarCancelar(false);
  }

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted">Buscando tu turno…</div>;
  }

  if (!turno) {
    return (
      <div className="min-h-screen px-6 py-8 max-w-sm mx-auto">
        <Navegacion ocultarSecciones />
        <h1 className="font-display text-2xl font-bold mt-16">No encontramos este turno</h1>
        <p className="text-sm text-muted mt-2">Puede que sea de otro día. Saca un número nuevo en el kiosco.</p>
      </div>
    );
  }

  const llamado = turno.estado === "llamado";

  return (
    <div className={`min-h-screen transition-colors duration-500 ${llamado ? "bg-coral" : "bg-paper"}`}>
      <div className="px-6 py-8 max-w-sm mx-auto flex flex-col min-h-screen">
        <Navegacion oscuro={llamado} ocultarSecciones />

        <div className="flex-grow flex flex-col justify-center py-10">
          {llamado ? (
            <div key={turno.llamado_en} className="text-center text-white animate-pop-in">
              <p className="text-lg font-semibold">¡Es tu turno!</p>
              <p className="font-display font-bold text-7xl mt-2 tabular">{turno.codigo}</p>
              <p className="text-sm mt-6 opacity-90">Pasa a</p>
              <p className="font-display font-bold text-4xl">{turno.ventanilla?.nombre}</p>
              {turno.veces_llamado > 1 && (
                <p className="text-sm mt-6 bg-white/20 rounded-xl py-2">
                  Te han llamado {turno.veces_llamado} veces, acércate pronto.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white border border-line rounded-3xl p-7 text-center animate-fade-in-up">
              <p className="text-sm font-semibold text-muted">{turno.servicio?.nombre}</p>
              <p className="font-display font-bold text-6xl mt-1 tabular">{turno.codigo}</p>
              <Preferencial turno={turno} conTexto className="mt-2" />
              <p className="text-[12px] text-muted mt-1">Sacado a las {hora(turno.creado_en)}</p>

              <div className="border-t border-dashed border-line my-6" />

              {turno.estado === "esperando" && (
                <>
                  <p className="font-display font-bold text-5xl tabular">{antes}</p>
                  <p className="text-sm text-muted mt-1">
                    {antes === 0 ? "¡Eres el siguiente!" : antes === 1 ? "persona antes que tú" : "personas antes que tú"}
                  </p>
                  {enAtencion && (
                    <p className="text-[13px] mt-5 bg-paper rounded-xl py-2.5">
                      Atendiendo ahora: <strong>{enAtencion.codigo}</strong>
                    </p>
                  )}
                </>
              )}
              {turno.estado === "atendido" && <p className="text-mint font-semibold">Tu turno ya fue atendido. ¡Gracias!</p>}
              {turno.estado === "no_presento" && (
                <p className="text-muted">Te llamamos pero no te presentaste. Saca un turno nuevo si aún lo necesitas.</p>
              )}
              {turno.estado === "cancelado" && <p className="text-muted">Cancelaste este turno.</p>}
            </div>
          )}

          {turno.estado === "esperando" && (
            <div className="mt-6 flex flex-col gap-3">
              {!avisoActivo ? (
                <button
                  onClick={() => {
                    desbloquearAudio();
                    setAvisoActivo(true);
                  }}
                  className="py-3 rounded-xl bg-accent text-paper text-sm font-semibold"
                >
                  Activar aviso con sonido
                </button>
              ) : (
                <p className="text-center text-[13px] text-mint font-semibold">
                  Aviso activado. Mantén esta página abierta.
                </p>
              )}

              {!confirmarCancelar ? (
                <button onClick={() => setConfirmarCancelar(true)} className="py-2 text-[13px] text-muted">
                  Ya no lo necesito, cancelar turno
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmarCancelar(false)}
                    className="flex-1 py-2.5 rounded-xl border border-line text-sm font-semibold bg-white"
                  >
                    No
                  </button>
                  <button onClick={cancelar} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold">
                    Sí, cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
