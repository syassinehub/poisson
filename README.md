# Karim Aquariophilie TN – site / blog

Site statique (HTML/CSS/JS, sans build) pour la chaîne YouTube
https://www.youtube.com/@karimaquariophilietn2039

## Pages

| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : derniers articles, vidéos populaires, appel vers le forum |
| `blog.html` | Tous les articles, filtres + recherche |
| `article.html?a=<slug>` | Un article + vidéos liées + commentaires |
| `videos.html` | Toutes les vidéos et Shorts |
| `communaute.html` | Forum : liste des sujets, `?t=<id>` pour un sujet |
| `apropos.html` | Présentation de Karim |

Contenu (articles, vidéos) : `assets/data.js`. Header/footer communs : `assets/app.js`.

## Lancer en local

```bash
python3 -m http.server 8000
```
puis http://localhost:8000

## Forum et commentaires

Sans configuration, le forum tourne en **mode démo** : messages stockés dans le
navigateur (localStorage), invisibles pour les autres visiteurs.

Pour les partager entre tout le monde, connecter Supabase :

1. Créer un projet gratuit sur https://supabase.com
2. SQL Editor : coller et exécuter `supabase/schema.sql`
3. Project Settings > API : copier `Project URL` et la clé `anon public`
4. Les coller dans `assets/config.js`

La clé `anon` est publique par design ; la sécurité vient des règles RLS du
schéma (lecture + publication autorisées, modification/suppression interdites).
La modération se fait depuis Supabase > Table Editor.

Avant d'ouvrir au grand public, prévoir une protection anti-spam
(captcha Cloudflare Turnstile ou comptes via Supabase Auth).
