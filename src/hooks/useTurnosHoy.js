import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { hoyLocal } from "../lib/fechas";

// Trae todos los turnos de hoy y se mantiene al día en tiempo real.
// Cada cambio en la tabla dispara una recarga (simple y siempre consistente).
export function useTurnosHoy() {
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const temporizador = useRef(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from("turnos")
      .select("*, servicio:servicios(id, nombre, prefijo), ventanilla:ventanillas(id, nombre)")
      .eq("fecha", hoyLocal())
      .order("creado_en", { ascending: true });

    if (error) setError(error.message);
    else {
      setTurnos(data);
      setError(null);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();

    const canal = supabase
      .channel(`turnos-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "turnos" }, () => {
        clearTimeout(temporizador.current);
        temporizador.current = setTimeout(cargar, 150);
      })
      .subscribe();

    // Respaldo por si se pierde la conexión en tiempo real
    const intervalo = setInterval(cargar, 30000);
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      supabase.removeChannel(canal);
      clearInterval(intervalo);
      clearTimeout(temporizador.current);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargar]);

  return { turnos, cargando, error, recargar: cargar };
}
