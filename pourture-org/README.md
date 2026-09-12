# POURTURE.ORG (prototype)

Simulation fictive d'un vieux forum/imageboard (esthétique ~2005-2012). Contenu de démo entièrement fictif, texte uniquement (pas d'upload d'images/fichiers).

## Stack
- Next.js (React) — frontend + API routes
- Prisma — ORM
- SQLite — base de données locale

## Installation

```bash
npm install
cp .env.example .env
# éditer .env : mettre un vrai ADMIN_PASSWORD et un SESSION_SECRET aléatoire
npx prisma db push
npm run seed
```

## Lancement

```bash
npm run dev
```

Site : http://localhost:3000
Admin : http://localhost:3000/admin/login (mot de passe = `ADMIN_PASSWORD` dans `.env`)

## Variables d'environnement (.env)

```
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change_this_password"
SESSION_SECRET="change_this_to_a_long_random_string"
```

## Identifiants de démonstration

Il n'y a pas de compte admin préexistant en base : l'accès admin est protégé uniquement par `ADMIN_PASSWORD` défini dans `.env`. Choisis un mot de passe fort avant tout déploiement au-delà de ton usage local.

## Créer un nouveau board

1. Va sur `/admin/login`, connecte-toi.
2. Va sur `/admin/boards`.
3. Remplis le formulaire (Board ID au format `/exemple/`, Name, Description, Rules, Status).
4. Clique "Create Board". Il apparaît immédiatement sur la page d'accueil s'il est en statut `public`.

## Réinitialiser la base de données

```bash
npm run db:reset
```

Cela supprime `prisma/dev.db`, recrée le schéma et relance le seed de démo.

Ou manuellement :
```bash
rm prisma/dev.db
npx prisma db push
npm run seed
```

## Logo

`public/logo.svg` — bannière "vieux web" verte/rouillée, générée par filtre SVG (bruit + déplacement), affichée en haut de la page d'accueil. Modifiable directement (texte, couleurs, taille) sans recompilation.

## Widgets / Publicités (contrôle total sans coder)

Depuis `/admin/widgets`, tu peux créer/désactiver/supprimer des blocs affichés sur le site, sans toucher au code :

- **Emplacements ("slots")** : `home_top`, `home_bottom`, `board_top`, `thread_top`, `thread_bottom`.
- **Type "banner"** : image (URL externe) + lien de destination + texte alternatif. Chaque affichage incrémente les **vues**, chaque clic (via une redirection `/api/widgets/click/[id]`) incrémente les **clics** — utile si tu vends ces emplacements ("paye pour mettre ta pub").
- **Type "html"** : bloc HTML libre (texte, lien, mise en forme) collé directement — pour tout ce qui n'est pas une simple bannière image (annonces, messages du site, etc.). Non tracké.
- Chaque widget a un ordre d'affichage (`order`) et un statut actif/inactif.
- Comme il n'y a pas de système d'upload de fichiers, les images de bannières sont référencées par URL externe (ex: hébergées ailleurs), pas uploadées depuis le site.

Note sécurité : le contenu "html" est injecté tel quel sur le site (`dangerouslySetInnerHTML`) — c'est volontaire pour te donner un contrôle total en tant qu'admin, mais ne donne jamais l'accès admin à quelqu'un en qui tu n'as pas confiance, car il pourrait injecter du JavaScript arbitraire vu par tous les visiteurs.

## Structure du projet

```
pourture-org/
  public/
    logo.svg               # bannière logo "vieux web" verte/usée
  prisma/
    schema.prisma        # modèles: User, Board, Thread, Post, Report, ModerationAction, Widget
    seed.js               # données de démo fictives
  lib/
    prisma.js             # client Prisma singleton
    identity.js            # génération d'identité anonyme (cookie httpOnly)
    admin.js               # auth admin simple (cookie de session)
    widgets.js              # récupération des widgets actifs par emplacement
  components/
    WidgetSlot.js            # affichage d'un emplacement pub/widget
  pages/
    index.js               # accueil : liste des boards
    catalogue.js            # tous les threads récents
    [board]/index.js        # liste des threads d'un board
    [board]/thread/[id].js  # vue d'un thread + réponses + report
    admin/
      login.js
      index.js               # dashboard (stats)
      boards.js               # CRUD boards
      reports.js              # modération des signalements
      widgets.js               # gestion des pubs/blocs libres (CRUD, stats vues/clics)
    api/
      identity.js             # crée/retourne l'identité anonyme
      boards/index.js         # GET liste / POST créer (admin)
      boards/[id].js          # PUT modifier / DELETE supprimer (admin)
      threads/index.js         # POST créer un thread
      threads/[id].js           # GET un thread
      posts/index.js             # POST répondre
      reports/index.js           # POST signaler
      admin/login.js               # POST connexion admin
      admin/moderate.js            # POST actions de modération
      widgets/index.js             # GET (admin liste) / POST créer widget
      widgets/[id].js               # PUT modifier / DELETE supprimer widget
      widgets/click/[id].js          # GET redirection + comptage de clic
  styles/globals.css        # esthétique "vieux forum"
```

## Notes importantes

- **Pas d'upload** : aucun système d'upload d'image/fichier n'est implémenté, volontairement.
- **Identité anonyme** : à la première visite, une identité `Anonymous #XXXXXX` est créée automatiquement (cookie httpOnly). Une "clé de récupération" fictive est générée mais c'est une fonctionnalité expérimentale — elle n'est affichée qu'une fois et son hash seulement est stocké.
- **Modération** : les posts peuvent être cachés/supprimés, les threads verrouillés, les utilisateurs bannis, via `/admin`. Les signalements ("Report") sont visibles uniquement par l'admin.
- **Sécurité** : l'auth admin ici est volontairement minimale (mot de passe unique + cookie de session), adaptée à un prototype local. Ne pas exposer publiquement sans renforcer l'authentification (hash de mot de passe, rate limiting, HTTPS, etc.).
- **Contenu de démo** : tous les pseudos et messages du seed sont fictifs et inoffensifs (débats de jeux vidéo, petites théories, drama léger) — reproduisant l'ambiance d'un vieux forum sans contenu haineux, violent ou ciblant de vraies personnes.
