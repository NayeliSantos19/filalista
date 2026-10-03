import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Navegacion from "../components/Navegacion.jsx";

// Solo inicio de sesión: las cuentas del personal se crean desde
// Supabase -> Authentication -> Users -> Add user (así nadie se registra como operador).
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      setError(error.message.includes("Invalid login credentials") ? "Correo o contraseña incorrectos." : error.message);
      return;
    }
    navigate(location.state?.desde ?? "/operador", { replace: true });
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-sm mx-auto flex flex-col">
      <Navegacion ocultarSecciones volverA="/" />
      <div className="flex-grow flex flex-col justify-center">
        <h1 className="font-display text-2xl font-bold">Acceso del personal</h1>
        <p className="text-sm text-muted mt-1.5">Inicia sesión para atender desde tu ventanilla.</p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5">Correo</label>
            <input
              type="email"
              required
              placeholder="operador@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-line bg-white text-sm"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-line bg-white text-sm"
            />
          </div>

          {error && <p className="text-[13px] text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="bg-accent text-paper rounded-xl py-3.5 font-semibold text-[15px] disabled:opacity-60"
          >
            {cargando ? "Un momento…" : "Iniciar sesión"}
          </button>
        </form>
        <p className="text-[12px] text-muted mt-5 leading-relaxed">
          ¿No tienes cuenta? Pídele al administrador que te cree una.
        </p>
      </div>
    </div>
  );
}
