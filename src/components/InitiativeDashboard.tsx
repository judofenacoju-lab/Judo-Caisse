"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Paperclip,
  Settings,
  Trash2,
} from "lucide-react";
import type { CurrencyTotals, Session, Transaction, TransactionType } from "@/lib/db";
import { formatCurrency, formatDate, roleLabel } from "@/lib/utils";

interface InitiativeDashboardProps {
  user: Session;
  stats: {
    usd: CurrencyTotals;
    fc: CurrencyTotals;
    transactionCount: number;
  } | null;
  transactions: Transaction[];
  canDelete: boolean;
  onLogout: () => void;
  onOpenSettings: () => void;
  onChangeWorkspace?: () => void;
  onOpenRecap?: () => void;
  onOpenAudit?: () => void;
  onDelete: () => void;
  onNewOperation?: () => void;
}

const PAGE_SIZE = 5;

export default function InitiativeDashboard({
  user,
  stats,
  transactions,
  canDelete,
  onLogout,
  onOpenSettings,
  onChangeWorkspace,
  onOpenRecap,
  onOpenAudit,
  onDelete,
  onNewOperation,
}: InitiativeDashboardProps) {
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered =
    filter === "all" ? transactions : transactions.filter((t) => t.type === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [filter, transactions.length]);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette opération ?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      if (res.ok) onDelete();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="theme-initiative min-h-screen">
      {/* Floating island nav — not a full-width sticky bar */}
      <div className="px-4 sm:px-6 pt-5 pb-2">
        <div className="max-w-6xl mx-auto initiative-island flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500 font-medium">
              Caisse
            </p>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-black truncate">
              Initiative-Judo
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className="hidden md:block text-right mr-2">
              <p className="text-sm font-bold text-black">{user.name}</p>
              <p className="text-xs text-gray-500">{roleLabel(user.role)}</p>
            </div>
            {onChangeWorkspace && (
              <button
                type="button"
                onClick={onChangeWorkspace}
                className="initiative-icon-btn"
                title="Changer de caisse"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSettings}
              className="initiative-icon-btn"
              title="Paramètres"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="initiative-icon-btn"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 lg:gap-8">
          {/* Left rail — vertical metrics (desktop) */}
          <aside className="hidden lg:flex flex-col gap-4 initiative-rise">
            <div className="initiative-rail p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-4">
                Synthèse
              </p>
              {stats && (
                <div className="space-y-5">
                  <RailMetric
                    label="Entrées $"
                    value={formatCurrency(stats.usd.entrees, "USD")}
                    tone="in"
                  />
                  <RailMetric
                    label="Entrées FC"
                    value={formatCurrency(stats.fc.entrees, "FC")}
                    tone="in"
                  />
                  <div className="h-px bg-red-900/10" />
                  <RailMetric
                    label="Sorties $"
                    value={formatCurrency(stats.usd.sorties, "USD")}
                    tone="out"
                  />
                  <RailMetric
                    label="Sorties FC"
                    value={formatCurrency(stats.fc.sorties, "FC")}
                    tone="out"
                  />
                  <div className="h-px bg-red-900/10" />
                  <RailMetric
                    label="Opérations"
                    value={String(stats.transactionCount)}
                    tone="neutral"
                  />
                </div>
              )}
              {(onOpenRecap || onOpenAudit) && (
                <div className="mt-6 space-y-2">
                  {onOpenRecap && (
                    <button
                      type="button"
                      onClick={onOpenRecap}
                      className="w-full py-3 text-sm font-semibold text-red-950 border border-red-900/15 hover:bg-red-900/5 transition-colors"
                      style={{
                        clipPath:
                          "polygon(0 0, 100% 0, 100% 70%, 92% 100%, 0 100%)",
                      }}
                    >
                      Récapitulatif
                    </button>
                  )}
                  {onOpenAudit && (
                    <button
                      type="button"
                      onClick={onOpenAudit}
                      className="w-full py-3 text-sm font-semibold text-red-950 border border-red-900/15 hover:bg-red-900/5 transition-colors"
                      style={{
                        clipPath:
                          "polygon(0 0, 100% 0, 100% 70%, 92% 100%, 0 100%)",
                      }}
                    >
                      Journal d&apos;Audit
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>

          <div className="space-y-6 min-w-0">
            {/* Diagonal hero — not a rounded card grid */}
            {stats && (
              <section className="initiative-rise initiative-hero-slab relative overflow-hidden">
                <div className="relative z-10 p-6 sm:p-8 pr-10 sm:pr-16">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/70 font-medium">
                    Solde actuel
                  </p>
                  <p className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-white">
                    {formatCurrency(stats.usd.solde, "USD")}
                  </p>
                  <p className="mt-2 text-xl font-bold text-white">
                    {formatCurrency(stats.fc.solde, "FC")}
                  </p>
                  {(onOpenRecap || onOpenAudit) && (
                    <div className="lg:hidden mt-5 flex flex-wrap gap-2">
                      {onOpenRecap && (
                        <button
                          type="button"
                          onClick={onOpenRecap}
                          className="inline-flex px-4 py-2 text-sm font-semibold bg-white/15 hover:bg-white/25 transition-colors text-white"
                        >
                          Récapitulatif
                        </button>
                      )}
                      {onOpenAudit && (
                        <button
                          type="button"
                          onClick={onOpenAudit}
                          className="inline-flex px-4 py-2 text-sm font-semibold bg-white/15 hover:bg-white/25 transition-colors text-white"
                        >
                          Journal d&apos;Audit
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="initiative-hero-cut" aria-hidden />
              </section>
            )}

            {/* Mobile metrics — horizontal chip strip, not 4 equal cards */}
            {stats && (
              <div className="lg:hidden flex gap-3 overflow-x-auto pb-1 initiative-rise-delay scrollbar-none">
                <MetricChip
                  label="Entrées"
                  primary={formatCurrency(stats.usd.entrees, "USD")}
                  secondary={formatCurrency(stats.fc.entrees, "FC")}
                  tone="in"
                />
                <MetricChip
                  label="Sorties"
                  primary={formatCurrency(stats.usd.sorties, "USD")}
                  secondary={formatCurrency(stats.fc.sorties, "FC")}
                  tone="out"
                />
                <MetricChip
                  label="Ops"
                  primary={String(stats.transactionCount)}
                  tone="neutral"
                />
              </div>
            )}

            {/* Timeline / ticket list — not a single rounded table card */}
            <section className="initiative-rise-delay">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500 font-medium">
                    Mouvements
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight text-black mt-1">
                    Historique
                  </h2>
                </div>
                <div className="flex gap-0 border border-red-900/15 overflow-hidden">
                  {(["all", "entree", "sortie"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={`px-3.5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        filter === f
                          ? "bg-[#fb0101] text-white"
                          : "bg-white/50 text-red-900/70 hover:bg-white"
                      }`}
                    >
                      {f === "all" ? "Tout" : f === "entree" ? "Entrées" : "Sorties"}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="initiative-ticket p-10 text-center text-muted">
                  <p>Aucune opération enregistrée</p>
                  {canDelete && (
                    <p className="text-sm mt-1">
                      Utilisez « Nouvelle opération » pour commencer
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {pageItems.map((tx, index) => (
                    <article
                      key={tx.id}
                      className="initiative-ticket group"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div
                        className={`initiative-ticket-accent ${
                          tx.type === "entree"
                            ? "bg-[#fb0101]"
                            : "bg-orange-600"
                        }`}
                      />
                      <div className="flex-1 min-w-0 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {tx.type === "entree" ? (
                                <ArrowDownLeft className="w-4 h-4 text-[#c40000] flex-shrink-0" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-orange-700 flex-shrink-0" />
                              )}
                              <p className="font-bold text-black truncate">
                                {tx.description}
                              </p>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {formatDate(tx.date)}
                              {tx.category_name ? ` · ${tx.category_name}` : ""}
                              {tx.created_by_name
                                ? ` · ${tx.created_by_name}${
                                    tx.created_by_role
                                      ? ` (${roleLabel(tx.created_by_role)})`
                                      : ""
                                  }`
                                : ""}
                            </p>
                            {(tx.justification_files?.length ?? 0) > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {(tx.justification_files ?? []).map((file, i) => (
                                  <a
                                    key={file}
                                    href={`/api/files/${file}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-red-800 hover:underline"
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    Justificatif
                                    {(tx.justification_files?.length ?? 0) > 1
                                      ? ` ${i + 1}`
                                      : ""}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <p className="text-base sm:text-lg font-bold whitespace-nowrap text-black">
                              {tx.type === "entree" ? "+" : "−"}
                              {formatCurrency(tx.amount, tx.currency ?? "USD")}
                            </p>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(tx.id)}
                                disabled={deletingId === tx.id}
                                className="p-2 text-red-900/40 hover:text-orange-700 hover:bg-orange-50 transition-colors disabled:opacity-50"
                                title="Supprimer"
                                aria-label="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-red-900/10">
                  <p className="text-sm text-red-900/55">
                    Page {currentPage} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-red-900/15 bg-white/60 hover:bg-white disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Préc.
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-red-900/15 bg-white/60 hover:bg-white disabled:opacity-40"
                    >
                      Suiv.
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {onNewOperation && (
        <button
          type="button"
          onClick={onNewOperation}
          className="initiative-fab fixed bottom-6 right-6 z-40"
        >
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">Nouvelle opération</span>
        </button>
      )}
    </div>
  );
}

function RailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
  tone: "in" | "out" | "neutral";
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500 font-medium">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-black">{value}</p>
    </div>
  );
}

function MetricChip({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary?: string;
  tone: "in" | "out" | "neutral";
}) {
  return (
    <div
      className="flex-shrink-0 min-w-[140px] px-4 py-3 border border-gray-200 bg-white/80"
      style={{ clipPath: "polygon(0 0, 100% 0, 100% 78%, 88% 100%, 0 100%)" }}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500 font-medium">
        {label}
      </p>
      <p className="mt-1 font-bold text-black">{primary}</p>
      {secondary && (
        <p className="text-xs font-bold text-black mt-0.5">{secondary}</p>
      )}
    </div>
  );
}
