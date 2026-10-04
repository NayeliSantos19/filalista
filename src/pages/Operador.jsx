import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useCatalogo } from "../hooks/useCatalogo";
import { useTurnosHoy } from "../hooks/useTurnosHoy";
import { formatoMin, hora, minutosEntre, promedio } from "../lib/fechas";
import Navegacion from "../components/Navegacion.jsx";
import BotonDemo from "../components/BotonDemo.jsx";

const CLAVE_VENTANILLA = "filalista.ventanilla";
const CLAVE_SERVICIOS = "filalista.servicios";

function leer(clave, porDefecto) {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : porDefecto;
  } catch {
    return porDefecto;
  }
}
function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento disponible */
  }
}

export default function Operador() {
  const { servicios, ventanillas, cargando: cargandoCatalogo } = useCatalogo();
  const { turnos, recargar } = useTurnosHoy();
  const [ventanillaId, setVentanillaId] = useState(() => leer(CLAVE_VENTANILLA, null));
  const [serviciosSel, setServiciosSel] = useState(() => leer(CLAVE_SERVICIOS, null));
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Por defecto la ventanilla atiende todos los servicios
  useEffect(() => {
    if (serviciosSel === null && servicios.length) setServiciosSel(servicios.map((s) => s.id));
  }, [servicios, serviciosSel]);

  useEffect(() => guardar(CLAVE_VENTANILLA, ventanillaId), [ventanillaId]);
  useEffect(() => {
    if (serviciosSel) guardar(CLAVE_SERVICIOS, serviciosSel);
  }, [serviciosSel]);

  const ventanilla = ventanillas.find((v) => v.id === ventanillaId);
  const seleccion = serviciosSel ?? [];
  const actual = turnos.find((t) => t.estado === "llamado" && t.ventanilla_id === ventanillaId);
  const cola = turnos.filter((t) => t.estado === "esperando" && seleccion.includes(t.servicio_id));
  const misAtendidos = turnos.filter((t) => t.estado === "atendido" && t.ventanilla_id === ventanillaId);
  const atencionProm = promedio(
    misAtendidos.filter((t) => t.llamado_en && t.finalizado_en).map((t) => minutosEntre(t.llamado_en, t.finalizado_en))
  );

  async function llamarSiguiente() {
    setOcupado(true);
    setMensaje(null);
    const { data, error } = await supabase.rpc("llamar_siguiente", {
      p_ventanilla_id: ventanillaId,
      p_servicios: seleccion,
    });
    setOcupado(false);
    if (error) setMensaje({ tipo: "error", texto: error.message });
    else if (!data?.length) setMensaje({ tipo: "info", texto: "No hay personas esperando en tus servicios." });
    recargar();
  }

  async function actualizar(cambios) {
    if (!actual) return;
    setOcupado(true);
    setMensaje(null);
    const { error } = await supabase.from("turnos").update(cambios).eq("id", actual.id);
    setOcupado(false);
    if (error) setMensaje({ tipo: "error", texto: error.message });
    recargar();
  }

  const ahora = () => new Date().toISOString();
  const rellamar = () => actualizar({ llamado_en: ahora(), veces_llamado: (actual?.veces_llamado ?? 0) + 1 });
  const finalizar = (estado) => actualizar({ estado, finalizado_en: ahora() });

  function alternarServicio(id) {
    setServiciosSel((prev) => {
      const lista = prev ?? [];
      if (lista.includes(id)) return lista.length > 1 ? lista.filter((x) => x !== id) : lista;
      return [...lista, id];
    });
  }

  async function salir() {
    await supabase.auth.signOut();
  }

  if (cargandoCatalogo) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted">Cargando…</div>;
  }

  // ── Paso 1: elegir ventanilla ──
  if (!ventanilla) {
    return (
      <div className="min-h-screen px-6 py-8 max-w-md mx-auto">
        <Navegacion ocultarSecciones volverA="/" />
        <h1 className="font-display text-2xl font-bold mt-14">¿En qué ventanilla estás?</h1>
        <p className="text-sm text-muted mt-1">Se recordará en este dispositivo.</p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {cargandoCatalogo && <p className="text-sm text-muted">Cargando…</p>}
          {ventanillas.map((v) => (
            <button
              key={v.id}
              onClick={() => setVentanillaId(v.id)}
              className="bg-white border-2 border-line rounded-2xl py-6 font-display font-bold text-lg hover:border-accent transition"
            >
              {v.nombre}
            </button>
          ))}
        </div>
        <button onClick={salir} className="text-[13px] text-muted mt-8">
          Cerrar sesión
        </button>
      </div>
    );
  }

  // ── Panel del operador ──
  return (
    <div className="min-h-screen px-5 py-6 max-w-5xl mx-auto">
      <Navegacion
        extra={
        <div className="flex items-center gap-2 text-sm">
          <select
            value={ventanillaId}
            onChange={(e) => setVentanillaId(e.target.value)}
            className="bg-white border border-line rounded-xl px-3 py-2 font-semibold"
          >
            {ventanillas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
              </option>
            ))}
          </select>
          <Link to="/resumen" className="md:hidden px-3 py-2 rounded-xl border border-line bg-white font-medium">
            Resumen
          </Link>
          <button onClick={salir} className="px-3 py-2 text-muted">
            Salir
          </button>
        </div>
        }
      />

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5 mt-6">
        {/* Turno en curso */}
        <section className="flex flex-col gap-4">
          <div className="bg-white border border-line rounded-3xl p-7">
            <p className="text-[13px] font-semibold text-muted uppercase tracking-wider">Atendiendo ahora</p>
            {actual ? (
              <div key={actual.id} className="animate-pop-in">
                <p className="font-display font-bold text-7xl mt-3 tabular">{actual.codigo}</p>
                <p className="text-sm text-muted mt-2">
                  {actual.servicio?.nombre} · llegó {hora(actual.creado_en)} · esperó{" "}
                  {formatoMin(minutosEntre(actual.creado_en, actual.llamado_en))}
                  {actual.veces_llamado > 1 && ` · llamado ${actual.veces_llamado} veces`}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-6">
                  <button
                    onClick={rellamar}
                    disabled={ocupado}
                    className="py-3 rounded-xl border border-line text-sm font-semibold disabled:opacity-50"
                  >
                    Volver a llamar
                  </button>
                  <button
                    onClick={() => finalizar("no_presento")}
                    disabled={ocupado}
                    className="py-3 rounded-xl border border-line text-sm font-semibold disabled:opacity-50"
                  >
                    No se presentó
                  </button>
                  <button
                    onClick={() => finalizar("atendido")}
                    disabled={ocupado}
                    className="py-3 rounded-xl bg-mintLight text-mint text-sm font-semibold disabled:opacity-50"
                  >
                    Atendido
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-muted mt-4">Ventanilla libre. Llama al siguiente cuando estés listo.</p>
            )}
          </div>

          <button
            onClick={llamarSiguiente}
            disabled={ocupado || cola.length === 0}
            className="py-5 rounded-2xl bg-accent text-paper font-display font-bold text-xl disabled:opacity-40 active:scale-[0.99] transition"
          >
            {ocupado ? "Un momento…" : cola.length === 0 ? "Nadie en espera" : `Llamar siguiente · ${cola[0].codigo}`}
          </button>
          {actual && cola.length > 0 && (
            <p className="text-[12px] text-muted -mt-2 text-center">
              Al llamar al siguiente, {actual.codigo} se marcará como atendido.
            </p>
          )}
          {cola.length === 0 && (
            <div className="flex flex-col items-center text-center bg-white border border-dashed border-line rounded-2xl p-4">
              <p className="text-[13px] text-muted mb-3">¿Probando la app? Crea personas en la fila para atenderlas.</p>
              <BotonDemo variante="secundario" alTerminar={recargar} />
            </div>
          )}
          {mensaje && (
            <p className={`text-sm text-center ${mensaje.tipo === "error" ? "text-red-600" : "text-muted"}`}>
              {mensaje.texto}
            </p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Dato valor={misAtendidos.length} etiqueta="Atendidos hoy" />
            <Dato valor={cola.length} etiqueta="En tu fila" />
            <Dato valor={formatoMin(atencionProm)} etiqueta="Atención promedio" />
          </div>
        </section>

        {/* Fila */}
        <section className="bg-white border border-line rounded-3xl p-6">
          <p className="text-[13px] font-semibold text-muted uppercase tracking-wider">Servicios que atiendes</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {servicios.map((s) => {
              const activo = seleccion.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => alternarServicio(s.id)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border transition ${
                    activo ? "bg-accent text-paper border-accent" : "bg-white text-muted border-line"
                  }`}
                >
                  {s.prefijo} · {s.nombre}
                </button>
              );
            })}
          </div>

          <p className="text-[13px] font-semibold text-muted uppercase tracking-wider mt-7">Próximos en la fila</p>
          <ul className="mt-2 divide-y divide-line">
            {cola.length === 0 && <li className="py-4 text-sm text-muted">La fila está vacía 🎉</li>}
            {cola.slice(0, 12).map((t, i) => (
              <li key={t.id} className="flex items-center justify-between py-3 animate-fade-in-up">
                <span className="flex items-center gap-3">
                  <span className="text-[12px] text-muted w-4 tabular">{i + 1}</span>
                  <span className="font-display font-bold text-lg tabular">{t.codigo}</span>
                </span>
                <span className="text-[12px] text-muted">
                  {hora(t.creado_en)} · espera {formatoMin(minutosEntre(t.creado_en, new Date()))}
                </span>
              </li>
            ))}
          </ul>
          {cola.length > 12 && <p className="text-[12px] text-muted mt-2">y {cola.length - 12} más…</p>}
        </section>
      </div>
    </div>
  );
}

function Dato({ valor, etiqueta }) {
  return (
    <div className="bg-white border border-line rounded-2xl p-4">
      <p className="font-display font-bold text-2xl tabular">{valor}</p>
      <p className="text-[12px] text-muted mt-0.5">{etiqueta}</p>
    </div>
  );
}
