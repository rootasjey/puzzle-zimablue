# Puzzle Zimablue

Prototype d’un puzzle commun par jour, construit autour des illustrations publiques de [zimablue.cc](https://zimablue.cc).

## Démarrer

```sh
npm install
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply puzzle-zimablue --local
npm run build
npx wrangler dev --local --port 3001
```

Nuxt et Wrangler utilisent le port `3001`. `.dev.vars` est ignoré par Git : remplace les valeurs d’exemple avant de démarrer. Wrangler simule D1 et le binding email en local ; les emails simulés sont consignés localement et ne sont pas envoyés.

Le compte administrateur se crée une seule fois depuis `/admin/initialiser`. La clé de bootstrap et l’email autorisé proviennent de `.dev.vars`. Ensuite, utilise `/admin/connexion`. Il n’y a pas d’inscription publique ; le schéma prévoit déjà les rôles `admin` et `user` pour une éventuelle ouverture ultérieure.

## Programmer les puzzles

Dans `/admin/calendrier`, les puzzles sont stockés dans D1. Les dates se déplacent par glisser-déposer ; ouvre une date vide pour en préparer un. La sélection des illustrations reste manuelle et provient de l’API publique de Zimablue. Les puzzles peuvent être enregistrés en brouillon ou publiés avec 9, 16 ou 25 pièces. Les utilisateurs voient le puzzle publié du jour et peuvent rejouer les archives.

## Compte et récupération du mot de passe

Génère des valeurs aléatoires longues pour `NUXT_SESSION_PASSWORD` (au moins 32 caractères) et `NUXT_ADMIN_BOOTSTRAP_KEY` (au moins 32 caractères), et renseigne l’adresse du propriétaire dans `NUXT_INITIAL_ADMIN_EMAIL`. `NUXT_PUBLIC_SITE_URL` sert à construire les liens de récupération.

Les jetons de récupération sont à usage unique, expirent après 30 minutes et seule leur empreinte est stockée dans D1. La réponse de la demande reste identique pour les adresses inconnues afin de ne pas révéler les comptes existants. Le binding Cloudflare Email Service est simulé par Wrangler en local ; les emails simulés ne sont pas envoyés. En production, vérifie que `no-reply@zimablue.cc` est autorisé comme expéditeur dans Cloudflare.

## Build Cloudflare

```sh
npm run typecheck
npm run build
npx wrangler dev --local
```

Le build Nuxt utilise le preset `cloudflare_module`. Avant tout déploiement, crée la base D1 Cloudflare, renseigne son `database_id` dans `wrangler.jsonc`, puis applique les migrations distantes. Ces étapes ne sont pas exécutées depuis ce prototype.
