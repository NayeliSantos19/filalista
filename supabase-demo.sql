-- FilaLista · Modo demo
-- Corre esto en Supabase (SQL Editor -> New query -> Run) DESPUÉS de supabase-schema.sql.
-- Agrega dos funciones:
--   generar_demo()   -> cualquiera puede llenar la fila con turnos de prueba
--   reiniciar_demo() -> el personal borra los turnos de hoy para empezar de cero

-- Número siguiente del día para un servicio (con candado para que no se repita)
create or replace function _nuevo_numero(p_servicio_id uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v int;
begin
  perform pg_advisory_xact_lock(hashtext(p_servicio_id::text));
  select coalesce(max(numero), 0) + 1 into v
  from turnos
  where servicio_id = p_servicio_id and fecha = hoy_local();
  return v;
end $$;

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
  v_creados int := 0;
  i int;
begin
  select count(*) filter (where estado = 'esperando'), count(*) > 0
    into v_esperando, v_hay_turnos
  from turnos
  where fecha = hoy_local();

  -- Límite para que nadie llene la base de datos a punta de clics
  if v_esperando >= 25 then
    raise exception 'La fila ya tiene suficientes turnos de prueba';
  end if;

  -- 1) Si el día está vacío, crea un "historial" de la última hora y media
  --    para que el Resumen y la pantalla tengan datos desde el inicio.
  if not v_hay_turnos then
    for i in 1..14 loop
      select * into v_servicio from servicios where activo order by random() limit 1;
      select id into v_ventanilla from ventanillas where activa order by random() limit 1;
      v_creado := now() - make_interval(mins => 100 - i * 6);
      v_llamado := v_creado + make_interval(mins => 2 + floor(random() * 10)::int);
      v_numero := _nuevo_numero(v_servicio.id);

      insert into turnos (servicio_id, numero, codigo, estado, ventanilla_id,
                          creado_en, llamado_en, veces_llamado, finalizado_en)
      values (
        v_servicio.id, v_numero, v_servicio.prefijo || '-' || lpad(v_numero::text, 3, '0'),
        case when random() < 0.12 then 'no_presento' else 'atendido' end,
        v_ventanilla, v_creado, v_llamado, 1,
        least(now(), v_llamado + make_interval(mins => 2 + floor(random() * 6)::int))
      );
      v_creados := v_creados + 1;
    end loop;
  end if;

  -- 2) Personas esperando en la fila
  for i in 1..8 loop
    select * into v_servicio from servicios where activo order by random() limit 1;
    v_numero := _nuevo_numero(v_servicio.id);

    insert into turnos (servicio_id, numero, codigo, creado_en)
    values (
      v_servicio.id, v_numero, v_servicio.prefijo || '-' || lpad(v_numero::text, 3, '0'),
      case when v_hay_turnos then clock_timestamp()
           else now() - make_interval(mins => (8 - i) * 2) end
    );
    v_creados := v_creados + 1;
  end loop;

  return v_creados;
end $$;

create or replace function reiniciar_demo()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión';
  end if;
  delete from turnos where fecha = hoy_local();
end $$;

revoke execute on function _nuevo_numero(uuid) from public, anon, authenticated;
revoke execute on function reiniciar_demo() from public, anon;
grant execute on function generar_demo() to anon, authenticated;
grant execute on function reiniciar_demo() to authenticated;
