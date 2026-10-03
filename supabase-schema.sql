-- FilaLista · Esquema de base de datos
-- Pega esto en Supabase: SQL Editor -> New query -> Run

-- Fecha "de hoy" según la hora local del negocio (los números se reinician cada día)
create or replace function hoy_local() returns date
language sql stable as $$
  select (now() at time zone 'America/El_Salvador')::date
$$;

-- ───────────── Tablas ─────────────

create table servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  prefijo text not null unique check (prefijo ~ '^[A-Z]$'),  -- letra del ticket: C-001
  orden int not null default 0,
  activo boolean not null default true
);

create table ventanillas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activa boolean not null default true
);

create table turnos (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references servicios(id),
  numero int not null,
  codigo text not null,                       -- ej. "C-012"
  fecha date not null default hoy_local(),
  estado text not null default 'esperando'
    check (estado in ('esperando', 'llamado', 'atendido', 'no_presento', 'cancelado')),
  ventanilla_id uuid references ventanillas(id),
  operador_id uuid references auth.users(id),
  creado_en timestamptz not null default now(),
  llamado_en timestamptz,
  veces_llamado int not null default 0,
  finalizado_en timestamptz,
  unique (servicio_id, fecha, numero)
);

create index turnos_fecha_estado_idx on turnos (fecha, estado, creado_en);

-- ───────────── Funciones ─────────────

-- Cualquiera (kiosco) puede sacar un turno. El número se calcula en la base de datos
-- con un candado por servicio para que dos personas nunca reciban el mismo número.
create or replace function sacar_turno(p_servicio_id uuid)
returns turnos
language plpgsql security definer set search_path = public as $$
declare
  v_servicio servicios;
  v_numero int;
  v_turno turnos;
begin
  select * into v_servicio from servicios where id = p_servicio_id and activo;
  if not found then
    raise exception 'Servicio no disponible';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_servicio_id::text));

  select coalesce(max(numero), 0) + 1 into v_numero
  from turnos
  where servicio_id = p_servicio_id and fecha = hoy_local();

  insert into turnos (servicio_id, numero, codigo)
  values (p_servicio_id, v_numero, v_servicio.prefijo || '-' || lpad(v_numero::text, 3, '0'))
  returning * into v_turno;

  return v_turno;
end $$;

-- El operador llama al siguiente turno de los servicios que atiende.
-- El turno que la ventanilla tenía en curso se marca como atendido.
-- "skip locked" evita que dos ventanillas tomen a la misma persona.
create or replace function llamar_siguiente(p_ventanilla_id uuid, p_servicios uuid[])
returns setof turnos
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión';
  end if;

  update turnos
  set estado = 'atendido', finalizado_en = now()
  where ventanilla_id = p_ventanilla_id and estado = 'llamado';

  select id into v_id
  from turnos
  where fecha = hoy_local()
    and estado = 'esperando'
    and servicio_id = any(p_servicios)
  order by creado_en
  limit 1
  for update skip locked;

  if v_id is null then
    return;  -- nadie esperando
  end if;

  return query
  update turnos
  set estado = 'llamado',
      ventanilla_id = p_ventanilla_id,
      operador_id = auth.uid(),
      llamado_en = now(),
      veces_llamado = 1
  where id = v_id
  returning *;
end $$;

-- La persona puede cancelar su propio turno mientras sigue esperando.
-- El id (uuid) funciona como "llave": solo lo tiene quien sacó el ticket.
create or replace function cancelar_turno(p_turno_id uuid)
returns void
language sql security definer set search_path = public as $$
  update turnos
  set estado = 'cancelado', finalizado_en = now()
  where id = p_turno_id and estado = 'esperando';
$$;

revoke execute on function llamar_siguiente(uuid, uuid[]) from public, anon;
grant execute on function llamar_siguiente(uuid, uuid[]) to authenticated;
grant execute on function sacar_turno(uuid) to anon, authenticated;
grant execute on function cancelar_turno(uuid) to anon, authenticated;

-- ───────────── Seguridad (RLS) ─────────────
-- Lectura pública (la pantalla y el kiosco no inician sesión; los turnos no guardan datos personales).
-- Solo el personal (usuarios autenticados) puede modificar.

alter table servicios enable row level security;
create policy "Servicios visibles" on servicios for select using (true);
create policy "Personal gestiona servicios" on servicios for all to authenticated
  using (true) with check (true);

alter table ventanillas enable row level security;
create policy "Ventanillas visibles" on ventanillas for select using (true);
create policy "Personal gestiona ventanillas" on ventanillas for all to authenticated
  using (true) with check (true);

alter table turnos enable row level security;
create policy "Turnos visibles" on turnos for select using (true);
create policy "Personal actualiza turnos" on turnos for update to authenticated
  using (true) with check (true);
-- Nota: no hay política de insert; los turnos solo se crean con sacar_turno().

-- ───────────── Tiempo real ─────────────
alter publication supabase_realtime add table turnos;

-- ───────────── Datos de prueba ─────────────
insert into servicios (nombre, descripcion, prefijo, orden) values
  ('Caja', 'Depósitos, retiros y pagos', 'C', 1),
  ('Servicio al cliente', 'Consultas, reclamos y trámites', 'S', 2),
  ('Préstamos', 'Solicitudes y asesoría de crédito', 'P', 3);

insert into ventanillas (nombre) values
  ('Ventanilla 1'), ('Ventanilla 2'), ('Ventanilla 3'), ('Ventanilla 4');
