"use client";

import { formatCurrency } from "@/lib/utils";
import type { CurrencyTotals } from "@/lib/db";
import { ArrowDownLeft, ArrowUpRight, Wallet, Receipt } from "lucide-react";

interface StatsCardsProps {
  usd: CurrencyTotals;
  fc: CurrencyTotals;
  transactionCount: number;
  onOpenRecap?: () => void;
  elegant?: boolean;
}

export default function StatsCards({
  usd,
  fc,
  transactionCount,
  onOpenRecap,
  elegant = false,
}: StatsCardsProps) {
  if (elegant) {
    return (
      <div className="space-y-5 initiative-rise">
        {onOpenRecap && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onOpenRecap}
              className="px-5 py-2.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-all shadow-[0_10px_24px_-14px_rgba(15,92,86,0.8)]"
            >
              Récapitulatif
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="initiative-hero text-white rounded-[1.4rem] p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                Solde actuel
              </span>
              <Wallet className="w-5 h-5 text-white/70" />
            </div>
            <p className="text-3xl font-semibold tracking-tight">
              {formatCurrency(usd.solde, "USD")}
            </p>
            <p className="text-lg font-medium text-white/80 mt-1">
              {formatCurrency(fc.solde, "FC")}
            </p>
          </div>

          {[
            {
              label: "Entrées",
              usd: usd.entrees,
              fc: fc.entrees,
              tone: "text-[#c40000]",
              iconBg: "bg-red-100",
              Icon: ArrowDownLeft,
            },
            {
              label: "Sorties",
              usd: usd.sorties,
              fc: fc.sorties,
              tone: "text-orange-700",
              iconBg: "bg-orange-100",
              Icon: ArrowUpRight,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="initiative-panel rounded-[1.4rem] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {card.label}
                </span>
                <div className={`p-2 ${card.iconBg} rounded-xl`}>
                  <card.Icon className={`w-4 h-4 ${card.tone}`} />
                </div>
              </div>
              <p className={`text-xl font-semibold ${card.tone}`}>
                {formatCurrency(card.usd, "USD")}
              </p>
              <p className={`text-base font-medium opacity-80 mt-1 ${card.tone}`}>
                {formatCurrency(card.fc, "FC")}
              </p>
            </div>
          ))}

          <div className="initiative-panel rounded-[1.4rem] p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Opérations
              </span>
              <div className="p-2 bg-slate-100/80 rounded-xl">
                <Receipt className="w-4 h-4 text-muted" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight">
              {transactionCount}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
