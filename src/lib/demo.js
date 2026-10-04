import { supabase } from "./supabaseClient";

// Cuenta pública para que cualquiera pruebe el panel del operador.
// Se configura con VITE_DEMO_EMAIL y VITE_DEMO_PASSWORD (en .env y en Vercel).
// Si no están, la app funciona normal, sin opciones de demo.
export const CUENTA_DEMO = {
  email: import.meta.env.VITE_DEMO_EMAIL,
  password: import.meta.env.VITE_DEMO_PASSWORD,
};
export const HAY_DEMO = Boolean(CUENTA_DEMO.email && CUENTA_DEMO.password);

export async function generarDemo() {
  const { data, error } = await supabase.rpc("generar_demo");
  if (error) {
    if (error.message.includes("suficientes")) throw new Error("La fila ya tiene bastantes turnos. ¡Llámalos desde el operador!");
    if (error.message.includes("generar_demo")) throw new Error("Falta correr supabase-demo.sql en Supabase.");
    throw new Error("No se pudieron crear los turnos de prueba.");
  }
  return data;
}

export async function entrarComoDemo() {
  const { error } = await supabase.auth.signInWithPassword(CUENTA_DEMO);
  if (error) throw new Error("No se pudo entrar con la cuenta demo. Revisa que exista en Supabase.");
}
