import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Marca from "./Marca.jsx";

export const SECCIONES = [
  { ruta: "/kiosco", nombre: "Kiosco" },
  { ruta: "/pantalla", nombre: "Pantalla" },
  { ruta: "/operador", nombre: "Operador" },
  { ruta: "/resumen", nombre: "Resumen" },
];

// Barra superior compartida: botón para regresar, logo y accesos a las demás pantallas.
// `extra` permite que cada página agregue sus propias acciones a la derecha.
export default function Navegacion({ oscuro = false, volverA, extra, ocultarSecciones = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  function volver() {
    if (volverA) return navigate(volverA);
    // Si la persona entró directo a esta página, no hay historial: vuelve al inicio
    if (location.key === "default") navigate("/");
    else navigate(-1);
  }

  const borde = oscuro ? "border-white/10 bg-white/5 text-paper hover:bg-white/10" : "border-line bg-white text-ink hover:border-accent";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={volver}
          aria-label="Regresar"
          title="Regresar"
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition ${borde}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <Marca oscuro={oscuro} />
      </div>

      <div className="flex items-center gap-2">
        {!ocultarSecciones && (
          <nav
            className={`hidden md:flex items-center gap-1 p-1 rounded-xl border ${
              oscuro ? "border-white/10 bg-white/5" : "border-line bg-white"
            }`}
          >
            {SECCIONES.map((s) => (
              <NavLink
                key={s.ruta}
                to={s.ruta}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-[13px] font-semibold transition ${
                    isActive
                      ? oscuro
                        ? "bg-paper text-ink"
                        : "bg-accent text-paper"
                      : oscuro
                      ? "text-paper/60 hover:text-paper"
                      : "text-muted hover:text-ink"
                  }`
                }
              >
                {s.nombre}
              </NavLink>
            ))}
          </nav>
        )}
        {extra}
      </div>
    </header>
  );
}
