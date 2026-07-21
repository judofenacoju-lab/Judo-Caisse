"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import SettingsPanel from "@/components/SettingsPanel";
import StatsCards from "@/components/StatsCards";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import AuditLogPanel from "@/components/AuditLogPanel";
import RecapModal from "@/components/RecapModal";
import type { CurrencyTotals, Session, Transaction } from "@/lib/db";
import { canCreateTransactions } from "@/lib/utils";

interface DashboardProps {
  user: Session;
  onLogout: () => void;
  onUserUpdate: (user: Session) => void;
}

interface Stats {
  usd: CurrencyTotals;
  fc: CurrencyTotals;
  transactionCount: number;
}

const POLL_INTERVAL_MS = 3000;

export default function Dashboard({ user, onLogout, onUserUpdate }: DashboardProps) {
  const [currentUser, setCurrentUser] = useState(user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = useCallback(
    async (silent = false) => {
      try {
        const [statsRes, txRes, authRes] = await Promise.all([
          fetch("/api/stats", { cache: "no-store" }),
          fetch("/api/transactions?limit=100", { cache: "no-store" }),
          fetch("/api/auth", { cache: "no-store" }),
        ]);

        if (!isMounted.current) return;

        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.user) {
            setCurrentUser(authData.user);
            onUserUpdate(authData.user);
          }
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }

        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData.transactions ?? []);
        }
      } finally {
        if (isMounted.current && !silent) {
          setLoading(false);
        }
      }
    },
    [onUserUpdate]
  );

  useEffect(() => {
    refresh(false);
    const interval = setInterval(() => refresh(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const isReadOnly = !canCreateTransactions(currentUser.role);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-pulse">🥋</span>
          <p className="text-muted mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={currentUser}
        onLogout={onLogout}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {stats && (
          <StatsCards
            usd={stats.usd}
            fc={stats.fc}
            transactionCount={stats.transactionCount}
            onOpenRecap={
              currentUser.role === "admin" ? () => setRecapOpen(true) : undefined
            }
          />
        )}

        {currentUser.role === "admin" && <AuditLogPanel />}

        <TransactionList
          transactions={transactions}
          onDelete={() => refresh(true)}
          canDelete={!isReadOnly}
        />
      </main>

      {!isReadOnly && <TransactionForm onSuccess={() => refresh(true)} />}

      {currentUser.role === "admin" && (
        <RecapModal open={recapOpen} onClose={() => setRecapOpen(false)} />
      )}

      <SettingsPanel
        user={currentUser}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
