import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Servicios y ventanillas activos (cambian poco, se cargan una vez)
export function useCatalogo() {
  const [servicios, setServicios] = useState([]);
  const [ventanillas, setVentanillas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("servicios").select("*").eq("activo", true).order("orden"),
      supabase.from("ventanillas").select("*").eq("activa", true).order("nombre"),
    ]).then(([s, v]) => {
      setServicios(s.data ?? []);
      setVentanillas(v.data ?? []);
      setCargando(false);
    });
  }, []);

  return { servicios, ventanillas, cargando };
}
