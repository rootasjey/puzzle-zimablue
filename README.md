# Puzzle Zimablue

Prototype local d’un puzzle commun par jour, construit autour des illustrations publiques de [zimablue.cc](https://zimablue.cc).

## Démarrer

```sh
npm install
npm run dev
```

Nuxt démarre sur `http://localhost:3001`. Le build cible Cloudflare Workers :

```sh
npm run build
npx wrangler dev
```

## Programmer les puzzles

Les œuvres et dates sont choisies à la main dans `app/data/puzzles.ts`. Ajoute une entrée par jour avec son URL de variante d’image publique, son nom et son slug Zimablue. Ces URLs et métadonnées ont été relevées dans l’API publique ; le prototype garde ensuite la programmation dans son manifeste local. Le même mélange est présenté à tout le monde pour une même date. Les jours archivés restent jouables.

Le prototype utilise pour l’instant une grille fixe de 3×3, des échanges par clic/toucher et ne sauvegarde pas la progression. Les illustrations sont demandées directement depuis `zimablue.cc`.

## API et secrets

Le prototype affiche les images via leurs variantes publiques hébergées sur Zimablue. La consultation de ces variantes ne nécessite pas de clé API ; aucune clé ni variable secrète n’est à configurer pour le lancer. Les fichiers `.env` et `.dev.vars` sont ignorés par Git si des secrets privés deviennent nécessaires plus tard.
