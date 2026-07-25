-- Judo Caisse — schéma Supabase
-- À exécuter dans : Supabase → SQL Editor → New query → Run

create table if not exists users (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null check (role in ('financiere', 'coordon', 'admin')),
  pin text not null,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id bigint generated always as identity primary key,
  name text not null,
  type text not null check (type in ('entree', 'sortie')),
  workspace text not null default 'judo_vacances'
    check (workspace in ('judo_vacances', 'initiative_judo')),
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id bigint generated always as identity primary key,
  type text not null check (type in ('entree', 'sortie')),
  amount double precision not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD', 'FC')),
  description text not null,
  category_id bigint references categories(id) on delete set null,
  created_by bigint not null references users(id),
  date date not null,
  justification_files text[] not null default '{}',
  workspace text not null default 'judo_vacances'
    check (workspace in ('judo_vacances', 'initiative_judo')),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  action text not null,
  actor_id bigint not null,
  actor_name text not null,
  actor_role text not null,
  details text not null,
  metadata jsonb,
  workspace text
    check (workspace is null or workspace in ('judo_vacances', 'initiative_judo')),
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_date on transactions(date desc);
create index if not exists idx_transactions_type on transactions(type);
create index if not exists idx_transactions_workspace on transactions(workspace);
create index if not exists idx_categories_workspace on categories(workspace);
create index if not exists idx_audit_logs_created on audit_logs(created_at desc);
create index if not exists idx_audit_logs_workspace on audit_logs(workspace);

insert into users (name, role, pin)
select * from (values
  ('Marie Dupont', 'financiere', '1234'),
  ('Jean Martin', 'coordon', '5678'),
  ('Administrateur', 'admin', '1122')
) as v(name, role, pin)
where not exists (select 1 from users);

insert into categories (name, type, workspace)
select v.name, v.type, w.workspace
from (values
  ('Cotisations', 'entree'),
  ('Subventions', 'entree'),
  ('Événements / Galas', 'entree'),
  ('Ventes (kimonos, goodies)', 'entree'),
  ('Dons', 'entree'),
  ('Matériel & équipement', 'sortie'),
  ('Compétitions', 'sortie'),
  ('Location salle', 'sortie'),
  ('Assurances & licences', 'sortie'),
  ('Frais bancaires', 'sortie'),
  ('Divers', 'sortie')
) as v(name, type)
cross join (values ('judo_vacances'), ('initiative_judo')) as w(workspace)
where not exists (
  select 1 from categories c
  where c.name = v.name and c.type = v.type and c.workspace = w.workspace
);

insert into storage.buckets (id, name, public)
values ('justifications', 'justifications', false)
on conflict (id) do nothing;
