-- Migration : tableaux de bord Judo-Vacances / Initiative Judo
-- À exécuter dans Supabase → SQL Editor → Run

alter table categories
  add column if not exists workspace text not null default 'judo_vacances'
  check (workspace in ('judo_vacances', 'initiative_judo'));

alter table transactions
  add column if not exists workspace text not null default 'judo_vacances'
  check (workspace in ('judo_vacances', 'initiative_judo'));

alter table audit_logs
  add column if not exists workspace text
  check (workspace is null or workspace in ('judo_vacances', 'initiative_judo'));

create index if not exists idx_categories_workspace on categories(workspace);
create index if not exists idx_transactions_workspace on transactions(workspace);
create index if not exists idx_audit_logs_workspace on audit_logs(workspace);

-- Catégories initiales pour Initiative Judo (si absentes)
insert into categories (name, type, workspace)
select v.name, v.type, 'initiative_judo'
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
where not exists (
  select 1 from categories c
  where c.workspace = 'initiative_judo'
    and c.name = v.name
    and c.type = v.type
);
