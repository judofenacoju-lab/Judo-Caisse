"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Search, X } from "lucide-react";
import type { CurrencyTotals, Transaction } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

interface RecapModalProps {
  open: boolean;
  onClose: () => void;
}

type SearchMode = "date" | "month" | "year" | "all";

interface RecapData {
  summary: {
    usd: CurrencyTotals;
    fc: CurrencyTotals;
    transactionCount: number;
  };
  periods: {
    key: string;
    label: string;
    usd: CurrencyTotals;
    fc: CurrencyTotals;
  }[];
  transactions: Transaction[];
}

function TotalsBlock({
  title,
  usd,
  fc,
}: {
  title: string;
  usd: CurrencyTotals;
  fc: CurrencyTotals;
}) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      <p className="text-sm font-semibold text-muted">{title}</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted mb-1">USD ($)</p>
          <p className="text-success font-medium">+ {formatCurrency(usd.entrees, "USD")}</p>
          <p className="text-accent font-medium">− {formatCurrency(usd.sorties, "USD")}</p>
          <p className="font-bold mt-1">{formatCurrency(usd.solde, "USD")}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">FC</p>
          <p className="text-success font-medium">+ {formatCurrency(fc.entrees, "FC")}</p>
          <p className="text-accent font-medium">− {formatCurrency(fc.sorties, "FC")}</p>
          <p className="font-bold mt-1">{formatCurrency(fc.solde, "FC")}</p>
        </div>
      </div>
    </div>
  );
}

export default function RecapModal({ open, onClose }: RecapModalProps) {
  const now = new Date();
  const [mode, setMode] = useState<SearchMode>("month");
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [month, setMonth] = useState(now.toISOString().slice(0, 7));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRecap = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ mode });
      if (mode === "date") params.set("date", date);
      if (mode === "month") params.set("month", month);
      if (mode === "year") params.set("year", year);

      const res = await fetch(`/api/stats?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRecap(data.recap ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [mode, date, month, year]);

  useEffect(() => {
    if (open) loadRecap();
  }, [open, loadRecap]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Récapitulatif</h2>
              <p className="text-xs text-muted">Recherche par date, mois ou année</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 border-b border-border shrink-0">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "date" as const, label: "Par date" },
                { id: "month" as const, label: "Par mois" },
                { id: "year" as const, label: "Par année" },
                { id: "all" as const, label: "Tout" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === m.id
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-muted hover:bg-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {mode === "date" && (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            )}
            {mode === "month" && (
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            )}
            {mode === "year" && (
              <input
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
                placeholder="Année"
              />
            )}
            {mode !== "all" && (
              <button
                type="button"
                onClick={loadRecap}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-light transition-colors"
              >
                <Search className="w-4 h-4" />
                Rechercher
              </button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading && !recap ? (
            <p className="text-sm text-muted text-center py-8">Chargement...</p>
          ) : !recap ? (
            <p className="text-sm text-muted text-center py-8">Aucune donnée</p>
          ) : (
            <>
              <TotalsBlock
                title={`Résumé (${recap.summary.transactionCount} opération${recap.summary.transactionCount > 1 ? "s" : ""})`}
                usd={recap.summary.usd}
                fc={recap.summary.fc}
              />

              {recap.periods.length > 0 && mode !== "date" && (
                <div>
                  <h3 className="text-sm font-bold mb-3">Détail par période</h3>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted bg-slate-50 border-b border-border">
                          <th className="p-3 font-medium">Période</th>
                          <th className="p-3 font-medium text-right">Entrées $</th>
                          <th className="p-3 font-medium text-right">Sorties $</th>
                          <th className="p-3 font-medium text-right">Solde $</th>
                          <th className="p-3 font-medium text-right">Entrées FC</th>
                          <th className="p-3 font-medium text-right">Sorties FC</th>
                          <th className="p-3 font-medium text-right">Solde FC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recap.periods.map((p) => (
                          <tr key={p.key}>
                            <td className="p-3 capitalize">{p.label}</td>
                            <td className="p-3 text-right text-success">
                              {formatCurrency(p.usd.entrees, "USD")}
                            </td>
                            <td className="p-3 text-right text-accent">
                              {formatCurrency(p.usd.sorties, "USD")}
                            </td>
                            <td className="p-3 text-right font-semibold">
                              {formatCurrency(p.usd.solde, "USD")}
                            </td>
                            <td className="p-3 text-right text-success">
                              {formatCurrency(p.fc.entrees, "FC")}
                            </td>
                            <td className="p-3 text-right text-accent">
                              {formatCurrency(p.fc.sorties, "FC")}
                            </td>
                            <td className="p-3 text-right font-semibold">
                              {formatCurrency(p.fc.solde, "FC")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
