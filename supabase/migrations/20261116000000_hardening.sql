-- Droits inutiles hérités des privilèges par défaut du projet (TRUNCATE contournerait les règles RLS ;
-- non exposé par l'API, mais autant le retirer).
revoke truncate, references, trigger, maintain on public.user_data from anon, authenticated;

-- Fonction du déclencheur « RLS automatique » (option du projet) : elle n'a pas à être appelable par l'API.
-- Le déclencheur, lui, continue de s'exécuter (les déclencheurs ne vérifient pas ce droit).
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
