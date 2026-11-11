-- MuscleMap — comptes Supabase : une ligne par compte, avec le même contenu que l'ancien
-- fichier de synchro OneDrive / Google Drive ({ sessions, tombstones, settings }).
-- La fusion entre appareils reste faite par l'app (store.js) ; la base ne fait que garder
-- le document et refuser une écriture faite à partir d'une version périmée (colonne rev).

create table public.user_data (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  rev        bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- Chacun ne voit et ne modifie que sa propre ligne.
create policy "own row: read"   on public.user_data for select to authenticated using (user_id = (select auth.uid()));
create policy "own row: insert" on public.user_data for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own row: update" on public.user_data for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own row: delete" on public.user_data for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;
grant all on public.user_data to service_role;

-- Enregistre le document si personne ne l'a modifié depuis la lecture (p_rev = rev lu, 0 = aucune ligne lue).
-- Renvoie la nouvelle révision, ou null si un autre appareil a écrit entre-temps (l'app relit, fusionne, réessaie).
create function public.save_data(p_data jsonb, p_rev bigint)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_rev bigint;
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in';
  end if;
  if p_rev = 0 then
    insert into public.user_data (user_id, data) values ((select auth.uid()), p_data)
      on conflict (user_id) do nothing
      returning rev into new_rev;
  else
    update public.user_data
       set data = p_data, rev = rev + 1, updated_at = now()
     where user_id = (select auth.uid()) and rev = p_rev
     returning rev into new_rev;
  end if;
  return new_rev;
end;
$$;

revoke all on function public.save_data(jsonb, bigint) from public, anon;
grant execute on function public.save_data(jsonb, bigint) to authenticated;

-- Suppression du compte par la personne elle-même (Réglages) : le compte et ses séances en ligne.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
