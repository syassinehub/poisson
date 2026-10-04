// Configuration Supabase.
// Vide = mode démo : les messages sont stockés uniquement dans le navigateur (localStorage).
// Rempli = forum et commentaires partagés entre tous les visiteurs.
// Valeurs dans Supabase > Project Settings > API. La clé "anon" est publique par design :
// la sécurité repose sur les règles RLS définies dans supabase/schema.sql.
const SUPABASE_CONFIG = {
  url: "https://gwdyaxrcezcrqzvbzfij.supabase.co",
  anonKey: "sb_publishable_53Kf5V0x0M-Bj6Ic_crAUQ_9oB-_uEc",
};
