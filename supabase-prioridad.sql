-- FilaLista · Turnos con prioridad (migración)
-- Si tu base de datos YA existe, corre este archivo una vez en Supabase:
-- SQL Editor -> New query -> pegar todo -> Run.
-- (Si estás instalando desde cero, supabase-schema.sql y supabase-demo.sql ya lo incluyen.)
--
-- Regla: atención preferencial para adultos mayores, embarazadas y personas con discapacidad.
-- Se intercala: 1 preferencial por cada 2 normales, para que nadie espere para siempre.

-- 1) Nuevas columnas
alter table turnos
  add column if not exists prioridad boolean not null default false,
  add column if not exists motivo_prioridad text
    check (motivo_prioridad in ('adulto_mayor', 'embarazo', 'discapacidad'));

-- 2) sacar_turno ahora acepta un motivo de prioridad (opcional)
drop function if exists sacar_turno(uuid);

create or replace function sacar_turno(p_servicio_id uuid, p_motivo_prioridad text default null)
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

  insert into turnos (servicio_id, numero, codigo, prioridad, motivo_prioridad)
  values (
    p_servicio_id, v_numero, v_servicio.prefijo || '-' || lpad(v_numero::text, 3, '0'),
    p_motivo_prioridad is not null, p_motivo_prioridad
  )
  returning * into v_turno;

  return v_turno;
end $$;

grant execute on function sacar_turno(uuid, text) to anon, authenticated;

-- 3) llamar_siguiente con intercalado 1 de cada 3
create or replace function llamar_siguiente(p_ventanilla_id uuid, p_servicios uuid[])
returns setof turnos
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_pref_reciente boolean;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión';
  end if;

  update turnos
  set estado = 'atendido', finalizado_en = now()
  where ventanilla_id = p_ventanilla_id and estado = 'llamado';

  -- ¿Alguno de los 2 últimos llamados del día fue preferencial?
  select coalesce(bool_or(prioridad), false) into v_pref_reciente
  from (
    select prioridad from turnos
    where fecha = hoy_local() and llamado_en is not null
    order by llamado_en desc
    limit 2
  ) ultimos;

  -- Si no, le toca a un preferencial (si hay alguno esperando)
  if not v_pref_reciente then
    select id into v_id
    from turnos
    where fecha = hoy_local() and estado = 'esperando'
      and servicio_id = any(p_servicios) and prioridad
    order by creado_en
    limit 1
    for update skip locked;
  end if;

  -- Si no tocaba o no hay preferenciales: el normal más antiguo (o un preferencial si ya no quedan normales)
  if v_id is null then
    select id into v_id
    from turnos
    where fecha = hoy_local() and estado = 'esperando'
      and servicio_id = any(p_servicios)
    order by prioridad, creado_en
    limit 1
    for update skip locked;
  end if;

  if v_id is null then
    return;
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

-- 4) El modo demo ahora también crea algunos turnos preferenciales
create or replace function generar_demo()
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_esperando int;
  v_hay_turnos boolean;
  v_servicio servicios;
  v_ventanilla uuid;
  v_numero int;
  v_creado timestamptz;
  v_llamado timestamptz;
  v_motivo text;
  v_creados int := 0;
  i int;
begin
  select count(*) filter (where estado = 'esperando'), count(*) > 0
    into v_esperando, v_hay_turnos
  from turnos
  where fecha = hoy_local();

  if v_esperando >= 25 then
    raise exception 'La fila ya tiene suficientes turnos de prueba';
  end if;

  if not v_hay_turnos then
    for i in 1..14 loop
      select * into v_servicio from servicios where activo order by random() limit 1;
      select id into v_ventanilla from ventanillas where activa order by random() limit 1;
      v_creado := now() - make_interval(mins => 100 - i * 6);
      v_llamado := v_creado + make_interval(mins => 2 + floor(random() * 10)::int);
      v_motivo := case when i % 3 = 0
        then (array['adulto_mayor', 'embarazo', 'discapacidad'])[1 + floor(random() * 3)::int] end;
      v_numero := _nuevo_numero(v_servicio.id);

      insert into turnos (servicio_id, numero, codigo, estado, ventanilla_id, prioridad, motivo_prioridad,
                          creado_en, llamado_en, veces_llamado, finalizado_en)
      values (
        v_servicio.id, v_numero, v_servicio.prefijo || '-' || lpad(v_numero::text, 3, '0'),
        case when random() < 0.12 then 'no_presento' else 'atendido' end,
        v_ventanilla, v_motivo is not null, v_motivo, v_creado, v_llamado, 1,
        least(now(), v_llamado + make_interval(mins => 2 + floor(random() * 6)::int))
      );
      v_creados := v_creados + 1;
    end loop;
  end if;

  for i in 1..8 loop
    select * into v_servicio from servicios where activo order by random() limit 1;
    v_motivo := case when i in (3, 6)
      then (array['adulto_mayor', 'embarazo', 'discapacidad'])[1 + floor(random() * 3)::int] end;
    v_numero := _nuevo_numero(v_servicio.id);

    insert into turnos (servicio_id, numero, codigo, prioridad, motivo_prioridad, creado_en)
    values (
      v_servicio.id, v_numero, v_servicio.prefijo || '-' || lpad(v_numero::text, 3, '0'),
      v_motivo is not null, v_motivo,
      case when v_hay_turnos then clock_timestamp()
           else now() - make_interval(mins => (8 - i) * 2) end
    );
    v_creados := v_creados + 1;
  end loop;

  return v_creados;
end $$;

-- Que la API de Supabase vea los cambios de inmediato
notify pgrst, 'reload schema';
