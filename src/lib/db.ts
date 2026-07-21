import { deleteJustificationFiles as deleteFiles } from "./files";
import { getSupabase } from "./supabase";

export type UserRole = "financiere" | "coordon" | "admin";
export type StaffRole = "financiere" | "coordon";
export type TransactionType = "entree" | "sortie";
export type Currency = "USD" | "FC";

export interface User {
  id: number;
  name: string;
  role: UserRole;
  pin: string;
}

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description: string;
  category_id: number | null;
  category_name?: string;
  created_by: number;
  created_by_name?: string;
  created_by_role?: UserRole;
  date: string;
  created_at: string;
  justification_files?: string[];
}

export interface Session {
  userId: number;
  name: string;
  role: UserRole;
}

export interface PublicUser {
  id: number;
  name: string;
  role: StaffRole;
}

export type AuditAction =
  | "login"
  | "transaction_create"
  | "transaction_delete"
  | "category_create"
  | "category_update"
  | "category_delete"
  | "user_name_update"
  | "user_pin_reset"
  | "user_pin_change"
  | "export"
  | "audit_reset";

export interface AuditLog {
  id: number;
  action: AuditAction;
  actor_id: number;
  actor_name: string;
  actor_role: UserRole;
  details: string;
  metadata?: Record<string, string | number | boolean | null>;
  created_at: string;
}

export interface CurrencyTotals {
  entrees: number;
  sorties: number;
  solde: number;
}

export interface RecapPeriodRow {
  key: string;
  label: string;
  usd: CurrencyTotals;
  fc: CurrencyTotals;
}

type TxRow = {
  id: number;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description: string;
  category_id: number | null;
  created_by: number;
  date: string;
  created_at: string;
  justification_files: string[] | null;
  categories?: { name: string } | { name: string }[] | null;
  users?: { name: string; role: UserRole } | { name: string; role: UserRole }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapTransaction(row: TxRow): Transaction {
  const category = one(row.categories);
  const user = one(row.users);
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    currency: row.currency ?? "USD",
    description: row.description,
    category_id: row.category_id,
    category_name: category?.name,
    created_by: row.created_by,
    created_by_name: user?.name,
    created_by_role: user?.role,
    date: String(row.date).slice(0, 10),
    created_at: row.created_at,
    justification_files: row.justification_files ?? [],
  };
}

function emptyTotals(): CurrencyTotals {
  return { entrees: 0, sorties: 0, solde: 0 };
}

function addToTotals(totals: CurrencyTotals, tx: Transaction) {
  if (tx.type === "entree") totals.entrees += tx.amount;
  else totals.sorties += tx.amount;
  totals.solde = totals.entrees - totals.sorties;
}

export async function authenticateAdmin(pin: string): Promise<User | null> {
  const { data, error } = await getSupabase()
    .from("users")
    .select("*")
    .eq("role", "admin")
    .eq("pin", pin)
    .maybeSingle();
  if (error || !data) return null;
  return data as User;
}

export async function authenticateUser(
  role: StaffRole,
  pin: string
): Promise<User | null> {
  const { data, error } = await getSupabase()
    .from("users")
    .select("*")
    .eq("role", role)
    .eq("pin", pin)
    .maybeSingle();
  if (error || !data) return null;
  return data as User;
}

export async function getUserById(id: number): Promise<User | null> {
  const { data, error } = await getSupabase()
    .from("users")
    .select("id, name, role")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return { ...(data as Omit<User, "pin">), pin: "" };
}

export async function getFreshSession(session: Session): Promise<Session | null> {
  const user = await getUserById(session.userId);
  if (!user) return null;
  return { userId: user.id, name: user.name, role: user.role };
}

export async function getStaffUsers(): Promise<PublicUser[]> {
  const { data, error } = await getSupabase()
    .from("users")
    .select("id, name, role")
    .in("role", ["financiere", "coordon"])
    .order("id");
  if (error || !data) return [];
  return data as PublicUser[];
}

export async function adminResetUserPin(
  userId: number,
  newPin: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^\d{4,6}$/.test(newPin)) {
    return { ok: false, error: "Le PIN doit contenir 4 à 6 chiffres" };
  }

  const { data: user } = await getSupabase()
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return { ok: false, error: "Utilisateur introuvable" };
  if (user.role === "admin") {
    return { ok: false, error: "Impossible de réinitialiser le PIN admin ici" };
  }

  const { error } = await getSupabase()
    .from("users")
    .update({ pin: newPin })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminUpdateUserName(
  userId: number,
  name: string
): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nom requis" };

  const { data: user } = await getSupabase()
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return { ok: false, error: "Utilisateur introuvable" };
  if (user.role === "admin") {
    return { ok: false, error: "Impossible de modifier l'administrateur ici" };
  }

  const { data, error } = await getSupabase()
    .from("users")
    .update({ name: trimmed })
    .eq("id", userId)
    .select("id, name, role")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Erreur" };
  return { ok: true, user: data as PublicUser };
}

export async function getCategories(type?: TransactionType): Promise<Category[]> {
  let query = getSupabase().from("categories").select("*").order("name");
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error || !data) return [];
  return data as Category[];
}

export async function getTransactions(filters?: {
  type?: TransactionType;
  limit?: number;
  offset?: number;
}): Promise<Transaction[]> {
  let query = getSupabase()
    .from("transactions")
    .select("*, categories(name), users!transactions_created_by_fkey(name, role)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as TxRow[]).map(mapTransaction);
}

export async function getTransactionCount(type?: TransactionType): Promise<number> {
  let query = getSupabase()
    .from("transactions")
    .select("id", { count: "exact", head: true });
  if (type) query = query.eq("type", type);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

export async function getStats() {
  const { data, error } = await getSupabase()
    .from("transactions")
    .select("type, amount, currency");

  const txs = (error || !data ? [] : data) as Pick<
    Transaction,
    "type" | "amount" | "currency"
  >[];

  function totalsFor(currency: Currency) {
    const filtered = txs.filter((t) => (t.currency ?? "USD") === currency);
    const entrees = filtered
      .filter((t) => t.type === "entree")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const sorties = filtered
      .filter((t) => t.type === "sortie")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { entrees, sorties, solde: entrees - sorties };
  }

  return {
    usd: totalsFor("USD"),
    fc: totalsFor("FC"),
    transactionCount: txs.length,
  };
}

export async function createTransaction(data: {
  type: TransactionType;
  amount: number;
  currency: Currency;
  description: string;
  categoryId: number | null;
  createdBy: number;
  date: string;
  justificationFiles?: string[];
}): Promise<Transaction> {
  const { data: row, error } = await getSupabase()
    .from("transactions")
    .insert({
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      category_id: data.categoryId,
      created_by: data.createdBy,
      date: data.date,
      justification_files: data.justificationFiles ?? [],
    })
    .select("*, categories(name), users!transactions_created_by_fkey(name, role)")
    .single();

  if (error || !row) throw new Error(error?.message ?? "Création impossible");
  return mapTransaction(row as TxRow);
}

export async function deleteTransaction(id: number): Promise<Transaction | null> {
  const { data: existing } = await getSupabase()
    .from("transactions")
    .select("*, categories(name), users!transactions_created_by_fkey(name, role)")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return null;

  const tx = mapTransaction(existing as TxRow);
  await deleteFiles(tx.justification_files ?? []);

  const { error } = await getSupabase().from("transactions").delete().eq("id", id);
  if (error) return null;
  return tx;
}

export async function addAuditLog(entry: {
  action: AuditAction;
  actorId: number;
  actorName: string;
  actorRole: UserRole;
  details: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<AuditLog> {
  const { data, error } = await getSupabase()
    .from("audit_logs")
    .insert({
      action: entry.action,
      actor_id: entry.actorId,
      actor_name: entry.actorName,
      actor_role: entry.actorRole,
      details: entry.details,
      metadata: entry.metadata ?? null,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Audit impossible");
  return data as AuditLog;
}

export async function getAuditLogs(limit = 200): Promise<AuditLog[]> {
  const { data, error } = await getSupabase()
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as AuditLog[];
}

export async function clearAuditLogs(actor: {
  id: number;
  name: string;
  role: UserRole;
}): Promise<void> {
  await getSupabase().from("audit_logs").delete().neq("id", 0);
  await addAuditLog({
    action: "audit_reset",
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    details: "Réinitialisation du journal d'audit",
  });
}

export async function updateUserPin(
  userId: number,
  currentPin: string,
  newPin: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^\d{4,6}$/.test(newPin)) {
    return { ok: false, error: "Le nouveau PIN doit contenir 4 à 6 chiffres" };
  }

  const { data: user } = await getSupabase()
    .from("users")
    .select("id, pin")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return { ok: false, error: "Utilisateur introuvable" };
  if (user.pin !== currentPin) return { ok: false, error: "PIN actuel incorrect" };

  const { error } = await getSupabase()
    .from("users")
    .update({ pin: newPin })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createCategory(
  name: string,
  type: TransactionType
): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nom requis");

  const { data: existing } = await getSupabase()
    .from("categories")
    .select("id")
    .ilike("name", trimmed)
    .eq("type", type)
    .maybeSingle();

  if (existing) throw new Error("Cette catégorie existe déjà");

  const { data, error } = await getSupabase()
    .from("categories")
    .insert({ name: trimmed, type })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Création impossible");
  return data as Category;
}

export async function updateCategory(
  id: number,
  name: string
): Promise<Category | null> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nom requis");

  const { data: current } = await getSupabase()
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!current) return null;

  const { data: exists } = await getSupabase()
    .from("categories")
    .select("id")
    .neq("id", id)
    .eq("type", current.type)
    .ilike("name", trimmed)
    .maybeSingle();

  if (exists) throw new Error("Cette catégorie existe déjà");

  const { data, error } = await getSupabase()
    .from("categories")
    .update({ name: trimmed })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Mise à jour impossible");
  return data as Category;
}

export async function deleteCategory(
  id: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { count } = await getSupabase()
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "Catégorie utilisée par des opérations — impossible de supprimer",
    };
  }

  const { error } = await getSupabase().from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getAllTransactions(): Promise<Transaction[]> {
  return getTransactions();
}

export async function getExportData() {
  const [stats, transactions, monthly] = await Promise.all([
    getStats(),
    getAllTransactions(),
    getMonthlyStats(),
  ]);
  return { stats, transactions, monthly };
}

export async function getRecapData(filters: {
  mode: "date" | "month" | "year" | "all";
  date?: string;
  month?: string;
  year?: string;
}) {
  let txs = await getAllTransactions();

  if (filters.mode === "date" && filters.date) {
    txs = txs.filter((t) => t.date === filters.date);
  } else if (filters.mode === "month" && filters.month) {
    txs = txs.filter((t) => t.date.startsWith(filters.month!));
  } else if (filters.mode === "year" && filters.year) {
    txs = txs.filter((t) => t.date.startsWith(filters.year!));
  }

  const usd = emptyTotals();
  const fc = emptyTotals();
  for (const tx of txs) {
    const currency = tx.currency ?? "USD";
    if (currency === "FC") addToTotals(fc, tx);
    else addToTotals(usd, tx);
  }

  const periodsMap = new Map<string, RecapPeriodRow>();

  for (const tx of txs) {
    let key: string;
    let label: string;

    if (filters.mode === "year") {
      key = tx.date.slice(0, 7);
      const [y, m] = key.split("-");
      label = new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
      }).format(new Date(parseInt(y), parseInt(m) - 1));
    } else if (filters.mode === "month" || filters.mode === "date") {
      key = tx.date;
      label = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(tx.date + "T00:00:00"));
    } else {
      key = tx.date.slice(0, 7);
      const [y, m] = key.split("-");
      label = new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
      }).format(new Date(parseInt(y), parseInt(m) - 1));
    }

    let row = periodsMap.get(key);
    if (!row) {
      row = { key, label, usd: emptyTotals(), fc: emptyTotals() };
      periodsMap.set(key, row);
    }
    const currency = tx.currency ?? "USD";
    if (currency === "FC") addToTotals(row.fc, tx);
    else addToTotals(row.usd, tx);
  }

  const periods = Array.from(periodsMap.values()).sort((a, b) =>
    b.key.localeCompare(a.key)
  );

  return {
    summary: { usd, fc, transactionCount: txs.length },
    periods,
    transactions: txs,
  };
}

export async function getMonthlyStats() {
  const txs = await getAllTransactions();
  const byMonth = new Map<string, { usd: CurrencyTotals; fc: CurrencyTotals }>();

  for (const tx of txs) {
    const month = tx.date.slice(0, 7);
    const current = byMonth.get(month) ?? {
      usd: emptyTotals(),
      fc: emptyTotals(),
    };
    const currency = tx.currency ?? "USD";
    if (currency === "FC") addToTotals(current.fc, tx);
    else addToTotals(current.usd, tx);
    byMonth.set(month, current);
  }

  return Array.from(byMonth.entries())
    .map(([month, stats]) => ({ month, ...stats }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12);
}

export function canCreateTransactions(role: UserRole): boolean {
  return role === "financiere" || role === "coordon";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}
