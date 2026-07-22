-- DARKZONE · Backend liviano para GitHub Pages + Supabase
-- Ejecutá TODO este archivo una sola vez desde Supabase > SQL Editor.
-- Las tablas quedan protegidas por RLS: el navegador solo puede ejecutar las funciones públicas definidas al final.

create table if not exists public.dz_site_stats (
  id smallint primary key check (id = 1),
  total_visits bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.dz_site_stats (id, total_visits)
values (1, 0)
on conflict (id) do nothing;

create table if not exists public.dz_presence_sessions (
  session_id uuid primary key,
  last_seen timestamptz not null default now()
);

create index if not exists dz_presence_last_seen_idx
  on public.dz_presence_sessions(last_seen);

create table if not exists public.dz_referral_profiles (
  code text primary key,
  phone text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.dz_referral_events (
  id bigint generated always as identity primary key,
  code text not null references public.dz_referral_profiles(code) on delete cascade,
  visitor_id uuid not null,
  event_type text not null check (event_type in ('landing','contact')),
  created_at timestamptz not null default now(),
  unique (code, visitor_id, event_type)
);

create index if not exists dz_referral_events_code_idx
  on public.dz_referral_events(code, event_type);

-- Una fila = un amigo NUEVO verificado manualmente por el administrador.
create table if not exists public.dz_referral_confirmations (
  id bigint generated always as identity primary key,
  code text not null references public.dz_referral_profiles(code) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists dz_referral_confirmations_code_idx
  on public.dz_referral_confirmations(code);

alter table public.dz_site_stats enable row level security;
alter table public.dz_presence_sessions enable row level security;
alter table public.dz_referral_profiles enable row level security;
alter table public.dz_referral_events enable row level security;
alter table public.dz_referral_confirmations enable row level security;

-- Sin políticas directas: anon/authenticated no pueden listar teléfonos ni editar tablas.
revoke all on table public.dz_site_stats from anon, authenticated;
revoke all on table public.dz_presence_sessions from anon, authenticated;
revoke all on table public.dz_referral_profiles from anon, authenticated;
revoke all on table public.dz_referral_events from anon, authenticated;
revoke all on table public.dz_referral_confirmations from anon, authenticated;

create or replace function public.dz_get_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total bigint;
  v_online bigint;
begin
  select total_visits into v_total from public.dz_site_stats where id = 1;
  select count(*) into v_online
  from public.dz_presence_sessions
  where last_seen > now() - interval '90 seconds';

  return jsonb_build_object(
    'total_visits', coalesce(v_total, 0),
    'online_users', coalesce(v_online, 0)
  );
end;
$$;

create or replace function public.dz_register_visit(p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inserted integer;
begin
  insert into public.dz_presence_sessions(session_id, last_seen)
  values (p_session, now())
  on conflict (session_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 1 then
    update public.dz_site_stats
      set total_visits = total_visits + 1, updated_at = now()
      where id = 1;
  else
    update public.dz_presence_sessions
      set last_seen = now()
      where session_id = p_session;
  end if;

  delete from public.dz_presence_sessions
    where last_seen < now() - interval '24 hours';

  return public.dz_get_stats();
end;
$$;

create or replace function public.dz_heartbeat(p_session uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.dz_presence_sessions(session_id, last_seen)
  values (p_session, now())
  on conflict (session_id) do update set last_seen = excluded.last_seen;

  delete from public.dz_presence_sessions
    where last_seen < now() - interval '24 hours';
end;
$$;

create or replace function public.dz_get_or_create_referral(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_phone text;
  v_code text;
begin
  v_phone := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');

  if length(v_phone) < 10 or length(v_phone) > 15 then
    raise exception 'invalid phone';
  end if;

  select code into v_code
  from public.dz_referral_profiles
  where phone = v_phone;

  if v_code is not null then
    return jsonb_build_object('code', v_code);
  end if;

  loop
    v_code := 'DZ-' || upper(substr(md5(random()::text || clock_timestamp()::text || v_phone), 1, 10));
    exit when not exists (select 1 from public.dz_referral_profiles where code = v_code);
  end loop;

  insert into public.dz_referral_profiles(code, phone)
  values (v_code, v_phone)
  on conflict (phone) do update set phone = excluded.phone
  returning code into v_code;

  return jsonb_build_object('code', v_code);
end;
$$;

-- Devuelve el teléfono SOLO cuando ya se conoce un código aleatorio concreto.
-- Esto permite prellenar "Vengo de parte de..." en WhatsApp sin poner el número en la URL pública.
create or replace function public.dz_get_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_phone text;
begin
  select phone into v_phone
  from public.dz_referral_profiles
  where code = upper(trim(p_code));

  return jsonb_build_object('phone', v_phone);
end;
$$;

create or replace function public.dz_track_referral(p_code text, p_visitor uuid, p_event text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_event not in ('landing','contact') then
    raise exception 'invalid event';
  end if;

  if not exists (select 1 from public.dz_referral_profiles where code = upper(trim(p_code))) then
    return;
  end if;

  insert into public.dz_referral_events(code, visitor_id, event_type)
  values (upper(trim(p_code)), p_visitor, p_event)
  on conflict (code, visitor_id, event_type) do nothing;
end;
$$;

create or replace function public.dz_referral_progress(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_contacted bigint;
  v_confirmed bigint;
begin
  select count(distinct visitor_id) into v_contacted
  from public.dz_referral_events
  where code = upper(trim(p_code)) and event_type = 'contact';

  select count(*) into v_confirmed
  from public.dz_referral_confirmations
  where code = upper(trim(p_code));

  return jsonb_build_object(
    'contacted', coalesce(v_contacted, 0),
    'confirmed', coalesce(v_confirmed, 0)
  );
end;
$$;

-- Solo estas funciones se exponen a la web pública.
revoke execute on function public.dz_get_stats() from public;
revoke execute on function public.dz_register_visit(uuid) from public;
revoke execute on function public.dz_heartbeat(uuid) from public;
revoke execute on function public.dz_get_or_create_referral(text) from public;
revoke execute on function public.dz_get_referral(text) from public;
revoke execute on function public.dz_track_referral(text,uuid,text) from public;
revoke execute on function public.dz_referral_progress(text) from public;

grant execute on function public.dz_get_stats() to anon, authenticated;
grant execute on function public.dz_register_visit(uuid) to anon, authenticated;
grant execute on function public.dz_heartbeat(uuid) to anon, authenticated;
grant execute on function public.dz_get_or_create_referral(text) to anon, authenticated;
grant execute on function public.dz_get_referral(text) to anon, authenticated;
grant execute on function public.dz_track_referral(text,uuid,text) to anon, authenticated;
grant execute on function public.dz_referral_progress(text) to anon, authenticated;
