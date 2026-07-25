# Judo Caisse

Application web de gestion de caisse pour le club de judo (Financière, Coordon, Admin).

## Stack

- **Next.js 15** (App Router)
- **Supabase** (PostgreSQL + Storage)
- **Vercel** (hébergement)
- **Tailwind CSS 4**

## Comptes par défaut

| Rôle | PIN |
|------|-----|
| Financière | `1234` |
| Coordon | `5678` |
| Admin | `1122` |

## Tableaux de bord

- **Judo-Vacances** : partagé entre Financière et Coordon (Admin en lecture)
- **Initiative Judo** : accessible uniquement à Admin et Financière

Après connexion (Admin / Financière), un modal permet de choisir le tableau de bord.
Le Coordon ouvre directement **Judo-Vacances**.

Les données (opérations, catégories, exports, audit) sont séparées par tableau de bord.

## Migration base existante

Si le projet Supabase existe déjà, exécutez aussi `supabase/migration_workspaces.sql`.


## Variables d'environnement

Créez `.env.local` (local) et les mêmes variables sur Vercel :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Démarrage local

```bash
npm install
npm run dev
```

## Déploiement Vercel

1. Importez le repo GitHub `judofenacoju-lab/Judo-Caisse`
2. Ajoutez les 3 variables d'environnement ci-dessus
3. Deploy

## Production

```bash
npm run build
npm start
```
