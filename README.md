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

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Ouvrez **SQL Editor** et exécutez le fichier `supabase/schema.sql`
3. Dans **Storage**, vérifiez que le bucket `justifications` existe (créé par le SQL)
4. Dans **Project Settings → API**, copiez :
   - Project URL
   - `service_role` key (secret)

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
