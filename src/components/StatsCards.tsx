"use client";

import { formatCurrency } from "@/lib/utils";
import type { CurrencyTotals } from "@/lib/db";
import { ArrowDownLeft, ArrowUpRight, Wallet, Receipt } from "lucide-react";

interface StatsCardsProps {
  usd: CurrencyTotals;
  fc: CurrencyTotals;
  transactionCount: number;
  onOpenRecap?: () => void;
}

export default function StatsCards({
  usd,
  fc,
  transactionCount,
  onOpenRecap,
}: StatsCardsProps) {
  return (
    <div className="space-y-4">
      {onOpenRecap && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onOpenRecap}
            className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm"
          >
            Récapitulatif
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary to-primary-light text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-100">Solde actuel</span>
            <Wallet className="w-5 h-5 text-blue-200" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(usd.solde, "USD")}</p>
          <p className="text-lg font-semibold text-blue-100 mt-1">
            {formatCurrency(fc.solde, "FC")}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">Entrées</span>
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowDownLeft className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="text-xl font-bold text-success">
            {formatCurrency(usd.entrees, "USD")}
          </p>
          <p className="text-base font-semibold text-success/80 mt-1">
            {formatCurrency(fc.entrees, "FC")}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">Sorties</span>
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowUpRight className="w-4 h-4 text-accent" />
            </div>
          </div>
          <p className="text-xl font-bold text-accent">
            {formatCurrency(usd.sorties, "USD")}
          </p>
          <p className="text-base font-semibold text-accent/80 mt-1">
            {formatCurrency(fc.sorties, "FC")}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">Opérations</span>
            <div className="p-2 bg-slate-100 rounded-lg">
              <Receipt className="w-4 h-4 text-muted" />
            </div>
          </div>
          <p className="text-2xl font-bold">{transactionCount}</p>
        </div>
      </div>
    </div>
  );
}
