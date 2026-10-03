import { Routes, Route } from "react-router-dom";
import Inicio from "./pages/Inicio.jsx";
import Kiosco from "./pages/Kiosco.jsx";
import MiTurno from "./pages/MiTurno.jsx";
import Pantalla from "./pages/Pantalla.jsx";
import Operador from "./pages/Operador.jsx";
import Resumen from "./pages/Resumen.jsx";
import Login from "./pages/Login.jsx";
import RutaProtegida from "./components/RutaProtegida.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/kiosco" element={<Kiosco />} />
      <Route path="/turno/:id" element={<MiTurno />} />
      <Route path="/pantalla" element={<Pantalla />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/operador"
        element={
          <RutaProtegida>
            <Operador />
          </RutaProtegida>
        }
      />
      <Route
        path="/resumen"
        element={
          <RutaProtegida>
            <Resumen />
          </RutaProtegida>
        }
      />
    </Routes>
  );
}
