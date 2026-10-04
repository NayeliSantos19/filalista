import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Marca from "../components/Marca.jsx";
import BotonDemo from "../components/BotonDemo.jsx";
import { HAY_DEMO, entrarComoDemo } from "../lib/demo";

const PASOS = [
  { n: "01", titulo: "Saca tu número", texto: "Elige el servicio en el kiosco y recibe un ticket con código QR." },
  { n: "02", titulo: "Espera tranquilo", texto: "Escanea el QR y mira desde tu celular cuántas personas faltan." },
  { n: "03", titulo: "Te llamamos", texto: "La pantalla anuncia tu turno en voz alta y tu celular vibra." },
];

const GRUPOS = [
  {
    titulo: "Para clientes",
    modos: [
      {
        ruta: "/kiosco",
        titulo: "Kiosco",
        texto: "Elegir servicio y obtener el ticket.",
        color: "bg-sunLight text-sun",
        icono: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6",
      },
      {
        ruta: "/pantalla",
        titulo: "Pantalla de sala",
        texto: "Turnos llamados, para la TV de la sala.",
        color: "bg-coralLight text-coral",
        icono: "M3 5h18v11H3V5Zm6 15h6M12 16v4",
      },
    ],
  },
  {
    titulo: "Para el personal",
    privado: true,
    modos: [
      {
        ruta: "/operador",
        titulo: "Operador",
        texto: "Llamar, volver a llamar y cerrar turnos.",
        color: "bg-accentLight text-accent",
        icono: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
      },
      {
        ruta: "/resumen",
        titulo: "Resumen del día",
        texto: "Atendidos y tiempos promedio.",
        color: "bg-mintLight text-mint",
        icono: "M4 20V10m6 10V4m6 16v-7m4 7H2",
      },
    ],
  },
];

function Icono({ d, className = "" }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function Inicio() {
  return (
    <div className="min-h-screen">
      {/* Barra superior */}
      <div className="max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between">
        <Marca />
        <Link
          to="/operador"
          className="text-[13px] font-semibold px-3.5 py-2 rounded-xl border border-line bg-white hover:border-accent transition"
        >
          Acceso del personal
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-20 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-accent bg-accentLight rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
            Gestor de turnos en tiempo real
          </span>
          <h1 className="font-display text-4xl sm:text-[3.4rem] font-bold leading-[1.05] mt-5">
            Filas ordenadas,
            <br />
            <span className="text-accent">esperas más tranquilas.</span>
          </h1>
          <p className="text-muted text-[17px] mt-5 max-w-lg leading-relaxed">
            Saca un número, síguelo desde el celular y escucha cuando te toca. El kiosco, la pantalla y las ventanillas
            se mantienen sincronizados al instante.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to="/kiosco"
              className="inline-flex items-center gap-2 bg-accent text-paper rounded-xl px-5 py-3.5 font-semibold hover:opacity-90 transition"
            >
              Sacar un turno
              <Icono d="M5 12h14M13 6l6 6-6 6" />
            </Link>
            <Link
              to="/pantalla"
              className="inline-flex items-center gap-2 bg-white border border-line rounded-xl px-5 py-3.5 font-semibold hover:border-accent transition"
            >
              Ver pantalla de sala
            </Link>
          </div>
        </div>

        {/* Ilustración: ticket + pantalla */}
        <div className="relative h-[340px] sm:h-[380px] animate-fade-in-up" style={{ animationDelay: "120ms" }} aria-hidden="true">
          <div className="absolute inset-6 rounded-[2rem] bg-accentLight" />

          <div className="absolute top-2 right-2 sm:right-8 w-[78%] sm:w-[70%] bg-night text-paper rounded-2xl p-5 shadow-xl rotate-2">
            <div className="flex justify-between text-[11px] text-paper/50">
              <span>Pantalla de sala</span>
              <span>10:24</span>
            </div>
            <p className="text-[12px] text-paper/60 mt-4">Turno</p>
            <p className="font-display font-bold text-5xl text-coral tabular leading-none mt-1">S-004</p>
            <span className="inline-block mt-4 bg-coral text-white text-[13px] font-semibold rounded-lg px-3 py-1.5">
              → Ventanilla 2
            </span>
            <div className="mt-4 flex gap-2 text-[11px] text-paper/60">
              <span className="bg-white/5 rounded-md px-2 py-1 tabular">C-011 · V1</span>
              <span className="bg-white/5 rounded-md px-2 py-1 tabular">P-002 · V3</span>
            </div>
          </div>

          <div className="absolute bottom-2 left-2 sm:left-6 w-[56%] sm:w-[48%] bg-white border border-line rounded-2xl p-5 shadow-lg -rotate-3 text-center">
            <p className="text-[11px] font-semibold text-muted">Caja</p>
            <p className="font-display font-bold text-4xl tabular mt-1">C-012</p>
            <div className="border-t border-dashed border-line my-3" />
            <p className="font-display font-bold text-2xl tabular">3</p>
            <p className="text-[11px] text-muted">personas antes que tú</p>
          </div>
        </div>
      </section>

      {/* Modo demo */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-night text-paper p-7 sm:p-10">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-coral/20 blur-2xl" aria-hidden="true" />
          <p className="text-[12px] font-semibold uppercase tracking-wider text-coral">Modo demo</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2">Pruébalo en un minuto</h2>
          <p className="text-paper/60 text-sm mt-2 max-w-xl">
            No necesitas una fila real: crea turnos de prueba, abre la pantalla y atiéndelos como si fueras el
            personal del banco.
          </p>

          <ol className="grid md:grid-cols-3 gap-4 mt-8">
            <PasoDemo n="1" titulo="Llena la fila" texto="Crea personas esperando y un historial del día.">
              <BotonDemo etiqueta="Crear turnos de prueba" />
            </PasoDemo>
            <PasoDemo n="2" titulo="Abre la pantalla" texto="Mejor en otra pestaña o ventana, con el sonido activado.">
              <a
                href="/pantalla"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-white/10 hover:bg-white/15 transition"
              >
                Abrir pantalla de sala ↗
              </a>
            </PasoDemo>
            <PasoDemo n="3" titulo="Atiende la fila" texto="Llama al siguiente y mira cómo cambia todo en vivo.">
              <BotonOperadorDemo />
            </PasoDemo>
          </ol>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-white border-y border-line">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-coral">Cómo funciona</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2">Tres pasos, cero empujones</h2>
          <ol className="grid sm:grid-cols-3 gap-6 mt-8">
            {PASOS.map((p) => (
              <li key={p.n} className="relative pl-14">
                <span className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-paper border border-line font-display font-bold text-accent flex items-center justify-center tabular">
                  {p.n}
                </span>
                <h3 className="font-display font-bold text-lg">{p.titulo}</h3>
                <p className="text-sm text-muted mt-1 leading-relaxed">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pantallas */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-coral">Pantallas</p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2">¿A dónde quieres ir?</h2>

        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {GRUPOS.map((g) => (
            <div key={g.titulo}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-muted">{g.titulo}</h3>
                {g.privado && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted bg-white border border-line rounded-full px-2 py-0.5">
                    <Icono d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5V11Z" className="w-3 h-3" />
                    con sesión
                  </span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {g.modos.map((m) => (
                  <Link
                    key={m.ruta}
                    to={m.ruta}
                    className="group bg-white border border-line rounded-2xl p-5 hover:border-accent hover:-translate-y-0.5 hover:shadow-md transition"
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                      <Icono d={m.icono} />
                    </span>
                    <h4 className="font-display font-bold text-lg mt-4 flex items-center justify-between">
                      {m.titulo}
                      <Icono d="M5 12h14M13 6l6 6-6 6" className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition" />
                    </h4>
                    <p className="text-sm text-muted mt-1 leading-relaxed">{m.texto}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

      </section>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap justify-between gap-2 text-[12px] text-muted">
          <span>FilaLista · Proyecto de portafolio</span>
          <span>React · Tailwind · Supabase Realtime</span>
        </div>
      </footer>
    </div>
  );
}

function PasoDemo({ n, titulo, texto, children }) {
  return (
    <li className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
      <span className="font-display font-bold text-coral">{n}</span>
      <h3 className="font-display font-bold text-lg mt-1">{titulo}</h3>
      <p className="text-[13px] text-paper/60 mt-1 mb-4 flex-grow">{texto}</p>
      {children}
    </li>
  );
}

function BotonOperadorDemo() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  if (!HAY_DEMO) {
    return (
      <Link to="/operador" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-paper text-ink self-start">
        Ir al operador →
      </Link>
    );
  }

  async function entrar() {
    setCargando(true);
    setError(null);
    try {
      await entrarComoDemo();
      navigate("/operador");
    } catch (e) {
      setError(e.message);
      setCargando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={entrar}
        disabled={cargando}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-paper text-ink disabled:opacity-60"
      >
        {cargando ? "Entrando…" : "Entrar como operador demo →"}
      </button>
      {error && <p className="text-[12px] text-red-300 mt-2">{error}</p>}
    </div>
  );
}
