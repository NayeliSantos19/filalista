# FilaLista

Gestor de turnos para bancos, clínicas y oficinas de atención: la persona saca un número en el kiosco, lo sigue desde su celular y la pantalla de la sala lo anuncia en voz alta cuando le toca. Todo se sincroniza en tiempo real.

🔗 **Demo en vivo:** https://filalista.vercel.app

Proyecto de portafolio · React + Vite + Tailwind + Supabase (Postgres, Auth y Realtime).

## Qué hace

| Pantalla | Ruta | Para quién |
|---|---|---|
| **Kiosco** | `/kiosco` | Clientes: eligen el servicio y reciben su ticket con QR |
| **Mi turno** | `/turno/:id` | Clientes: ven cuántas personas faltan, reciben aviso (vibración + sonido) y pueden cancelar |
| **Pantalla de sala** | `/pantalla` | TV de la sala: turno actual, últimos llamados, fila por servicio y anuncio por voz |
| **Operador** | `/operador` 🔒 | Personal: llamar siguiente, volver a llamar, atendido / no se presentó |
| **Resumen** | `/resumen` 🔒 | Encargado: emitidos, atendidos, espera y atención promedio por servicio y ventanilla |

### Decisiones técnicas que vale la pena contar

- **Números sin duplicados:** el número se calcula dentro de Postgres (`sacar_turno`) con un candado por servicio, así dos personas que tocan el kiosco al mismo tiempo nunca reciben el mismo ticket.
- **Dos ventanillas no llaman a la misma persona:** `llamar_siguiente` usa `FOR UPDATE SKIP LOCKED`.
- **Seguridad con RLS:** lectura pública (los turnos no guardan datos personales), pero solo el personal autenticado puede llamar o cerrar turnos. Los clientes no pueden insertar filas directo; solo por la función.
- **Tiempo real:** Supabase Realtime avisa cada cambio y la app recarga; hay un respaldo cada 30 s por si se cae la conexión.
- **Modo demo seguro:** `generar_demo()` crea un historial realista del día y personas en fila, con un tope de 25 en espera para que nadie llene la base de datos a punta de clics.
- **Sonido sin archivos:** la campana se genera con Web Audio y el anuncio usa la voz del navegador (`speechSynthesis`).
- Los números se reinician cada día según la zona horaria `America/El_Salvador` (configurable en `src/lib/fechas.js` y en `hoy_local()` del SQL).

## Cómo correrlo localmente

1. Instala las dependencias:
   ```
   npm install
   ```

2. Copia `.env.example` a `.env` y llena tus claves de Supabase (Settings → API):
   ```
   cp .env.example .env
   ```

3. Crea las tablas: abre `supabase-schema.sql`, copia todo y pégalo en el **SQL Editor** de un proyecto **nuevo** de Supabase, luego dale "Run". Crea 3 servicios y 4 ventanillas de prueba.

4. (Opcional, modo demo) Corre también `supabase-demo.sql` en el SQL Editor. Agrega el botón "Crear turnos de prueba" y "Reiniciar el día". Si además quieres el botón "Entrar como operador demo", crea un usuario demo (paso 5) y pon su correo y contraseña en `VITE_DEMO_EMAIL` y `VITE_DEMO_PASSWORD` del `.env` (y en Vercel).

5. Crea una cuenta de operador: Supabase → **Authentication → Users → Add user** (marca "Auto confirm user").

6. Corre el proyecto:
   ```
   npm run dev
   ```

7. Abre `http://localhost:5173`. Para la demo, abre `/pantalla` y `/operador` en pestañas distintas y saca turnos desde `/kiosco`.

## Estructura del proyecto

```
src/
  lib/
    supabaseClient.js     → conexión a Supabase
    fechas.js             → zona horaria, formatos y promedios
    sonido.js             → campana (Web Audio) y anuncio por voz
  hooks/
    useTurnosHoy.js       → turnos del día + suscripción en tiempo real
    useCatalogo.js        → servicios y ventanillas
    useSesion.js          → sesión del personal
  components/
    RutaProtegida.jsx     → exige sesión para operador y resumen
    Marca.jsx, Estado.jsx
  pages/
    Inicio.jsx            → portada con los 4 modos
    Kiosco.jsx            → sacar turno + ticket con QR
    MiTurno.jsx           → seguimiento del turno desde el celular
    Pantalla.jsx          → TV de la sala de espera
    Operador.jsx          → panel de la ventanilla
    Resumen.jsx           → métricas del día
    Login.jsx             → acceso del personal
  App.jsx                 → rutas
supabase-schema.sql       → tablas, funciones, RLS y datos de prueba
supabase-demo.sql         → funciones del modo demo (opcional)
vercel.json               → para que las rutas funcionen al desplegar en Vercel
```

## Próximos pasos

- [x] Deploy en Vercel
- [ ] Pantalla de administración para crear/editar servicios y ventanillas desde la app
- [ ] Prioridad para adultos mayores, embarazadas y personas con discapacidad
- [ ] Notificación por WhatsApp/SMS cuando falten 2 turnos
- [ ] Historial y gráficas por hora del día
- [ ] Escribir el PRD y el caso de estudio (como en StudySpot)
