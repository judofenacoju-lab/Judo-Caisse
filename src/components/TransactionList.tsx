"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Paperclip,
  Trash2,
} from "lucide-react";
import type { Transaction, TransactionType } from "@/lib/db";
import { formatCurrency, formatDate, roleLabel } from "@/lib/utils";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: () => void;
  canDelete?: boolean;
}

const PAGE_SIZE = 6;

export default function TransactionList({
  transactions,
  onDelete,
  canDelete = true,
}: TransactionListProps) {
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered =
    filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter, transactions.length]);

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
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-bold">Historique des opérations</h2>
          <div className="flex gap-2">
            {(["all", "entree", "sortie"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-muted hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "Tout" : f === "entree" ? "Entrées" : "Sorties"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-muted">
          <p>Aucune opération enregistrée</p>
          {canDelete && (
            <p className="text-sm mt-1">Cliquez sur « Nouvelle opération » pour commencer</p>
          )}
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {pageItems.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group"
              >
                <div
                  className={`flex-shrink-0 p-2.5 rounded-xl ${
                    tx.type === "entree" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {tx.type === "entree" ? (
                    <ArrowDownLeft className="w-5 h-5 text-success" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-accent" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{tx.description}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted">
                    <span>{formatDate(tx.date)}</span>
                    {tx.category_name && (
                      <>
                        <span>·</span>
                        <span>{tx.category_name}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>
                      {tx.created_by_name}
                      {tx.created_by_role && ` (${roleLabel(tx.created_by_role)})`}
                    </span>
                    {(tx.justification_files?.length ?? 0) > 0 && (
                      <>
                        <span>·</span>
                        {(tx.justification_files ?? []).map((file, i) => (
                          <a
                            key={file}
                            href={`/api/files/${file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary-light hover:underline"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            Justificatif
                            {(tx.justification_files?.length ?? 0) > 1 ? ` ${i + 1}` : ""}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold text-lg whitespace-nowrap ${
                      tx.type === "entree" ? "text-success" : "text-accent"
                    }`}
                  >
                    {tx.type === "entree" ? "+" : "−"}
                    {formatCurrency(tx.amount, tx.currency ?? "USD")}
                  </span>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      className="flex-shrink-0 p-2 text-muted hover:text-accent hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 p-4 border-t border-border bg-slate-50">
              <p className="text-sm text-muted">
                Page {currentPage} / {totalPages}
                <span className="hidden sm:inline">
                  {" "}
                  · {filtered.length} opération{filtered.length > 1 ? "s" : ""}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
