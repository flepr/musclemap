-- MuscleMap — interface d'administration (page admin/, réservée à Fabien).
-- Les données ne sortent que par ces fonctions, et seulement pour un compte inscrit dans private.admins.
-- Par compte : identité du compte, dates, nombre de séances. Jamais les muscles ni les dates des séances
-- d'une personne : le détail des séances n'apparaît que dans des totaux tous comptes confondus.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.admins (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table private.admins enable row level security;

-- Compte Microsoft de Fabien (fabien@lepe.re)
insert into private.admins (user_id) values ('87ae7f7c-97a8-4816-9e47-858d37d7c023');

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.admins where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public, anon, authenticated;

-- Vrai si l'utilisateur connecté est administrateur (la page admin s'en sert pour afficher « Accès réservé »)
create function public.admin_check()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin();
$$;
revoke all on function public.admin_check() from public, anon;
grant execute on function public.admin_check() to authenticated;

-- Statistiques globales (semaines du lundi au dimanche, heure de Paris ; 12 dernières semaines)
create function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  tz constant text := 'Europe/Paris';
  w_now date := date_trunc('week', now() at time zone tz)::date;
  r jsonb;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with u as (
    select a.id, a.created_at, a.raw_app_meta_data->>'provider' as provider,
           d.updated_at as last_open, d.data
      from auth.users a
      left join public.user_data d on d.user_id = a.id
  ),
  s as (
    select u.id as uid, (x->>'datetime')::timestamptz as dt, coalesce(x->'muscles', '[]'::jsonb) as muscles
      from u, jsonb_array_elements(coalesce(u.data->'sessions', '[]'::jsonb)) x
     where x ? 'datetime'
  ),
  st as (select u.data->'settings' as v from u where u.data is not null),
  wk as (select (w_now - 7 * g) as w from generate_series(0, 11) g)
  select jsonb_build_object(
    'generated_at', now(),
    'accounts', jsonb_build_object(
      'total',     (select count(*) from u),
      'google',    (select count(*) from u where provider = 'google'),
      'microsoft', (select count(*) from u where provider = 'azure'),
      'migrated',  (select count(*) from u where exists (select 1 from s where s.uid = u.id and s.dt < u.created_at - interval '1 day')),
      'empty',     (select count(*) from u where not exists (select 1 from s where s.uid = u.id))
    ),
    'active', jsonb_build_object(
      'day',   (select count(*) from u where last_open > now() - interval '1 day'),
      'week',  (select count(*) from u where last_open > now() - interval '7 days'),
      'month', (select count(*) from u where last_open > now() - interval '30 days')
    ),
    'sessions', jsonb_build_object(
      'total', (select count(*) from s),
      'last7', (select count(*) from s where s.dt > now() - interval '7 days'),
      'last30', (select count(*) from s where s.dt > now() - interval '30 days')
    ),
    'weeks', (
      select jsonb_agg(jsonb_build_object(
               'week', wk.w,
               'new_accounts', (select count(*) from u where (u.created_at at time zone tz)::date >= wk.w and (u.created_at at time zone tz)::date < wk.w + 7),
               'sessions', (select count(*) from s where (s.dt at time zone tz)::date >= wk.w and (s.dt at time zone tz)::date < wk.w + 7),
               'loggers', (select count(distinct s.uid) from s where (s.dt at time zone tz)::date >= wk.w and (s.dt at time zone tz)::date < wk.w + 7)
             ) order by wk.w)
        from wk
    ),
    'muscles', coalesce((
      select jsonb_agg(jsonb_build_object('id', m, 'n', n) order by n desc, m)
        from (select m, count(*) as n from s, jsonb_array_elements_text(s.muscles) m group by m) t
    ), '[]'::jsonb),
    'settings', jsonb_build_object(
      'accounts',  (select count(*) from st),
      'lang',      coalesce((select jsonb_object_agg(k, n) from (select coalesce(v->>'lang', 'auto') k, count(*) n from st group by 1) t), '{}'::jsonb),
      'theme',     coalesce((select jsonb_object_agg(k, n) from (select coalesce(v->>'theme', 'auto') k, count(*) n from st group by 1) t), '{}'::jsonb),
      'detailed',  (select count(*) from st where v->>'entry' = 'muscles'),
      'custom_thresholds', (select count(*) from st where coalesce((v->>'recSmall')::int, 48) <> 48 or coalesce((v->>'recBig')::int, 72) <> 72 or coalesce((v->>'targetDays')::int, 5) <> 5),
      'excluded',  (select count(*) from st where jsonb_typeof(v->'excluded') = 'array' and jsonb_array_length(v->'excluded') > 0),
      'stats_off', (select count(*) from st where v->>'stats' = 'false')
    )
  ) into r;
  return r;
end;
$$;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

-- Liste des comptes : identité, dates, nombre de séances (jamais leur contenu)
create function public.admin_users()
returns table (
  id uuid, email text, name text, provider text, created_at timestamptz, last_sign_in_at timestamptz,
  last_open timestamptz, sessions integer, migrated boolean, is_admin boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select a.id, a.email::text,
           coalesce(a.raw_user_meta_data->>'full_name', a.raw_user_meta_data->>'name')::text,
           (a.raw_app_meta_data->>'provider')::text,
           a.created_at, a.last_sign_in_at, d.updated_at,
           coalesce(jsonb_array_length(d.data->'sessions'), 0)::int,
           exists (select 1 from jsonb_array_elements(coalesce(d.data->'sessions', '[]'::jsonb)) x
                    where x ? 'datetime' and (x->>'datetime')::timestamptz < a.created_at - interval '1 day'),
           exists (select 1 from private.admins p where p.user_id = a.id)
      from auth.users a
      left join public.user_data d on d.user_id = a.id
     order by d.updated_at desc nulls last, a.created_at desc;
end;
$$;
revoke all on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

-- Suppression d'un compte (et de ses séances en ligne) par l'administrateur ; pas son propre compte
create function public.admin_delete_user(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_id = (select auth.uid()) then
    raise exception 'cannot delete own account here';
  end if;
  delete from auth.users where id = p_id;
end;
$$;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;
