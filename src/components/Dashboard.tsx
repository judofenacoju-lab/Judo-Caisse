"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import InitiativeDashboard from "@/components/InitiativeDashboard";
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
  onChangeWorkspace?: () => void;
}

interface Stats {
  usd: CurrencyTotals;
  fc: CurrencyTotals;
  transactionCount: number;
}

const POLL_INTERVAL_MS = 3000;

export default function Dashboard({
  user,
  onLogout,
  onUserUpdate,
  onChangeWorkspace,
}: DashboardProps) {
  const [currentUser, setCurrentUser] = useState(user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    setStats(null);
    setTransactions([]);
  }, [user.workspace]);

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
  }, [refresh, user.workspace]);

  const isReadOnly = !canCreateTransactions(currentUser.role);
  const isInitiative = currentUser.workspace === "initiative_judo";

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isInitiative ? "theme-initiative" : ""
        }`}
      >
        <div className="text-center">
          <span className="text-4xl animate-pulse">🥋</span>
          <p className="text-muted mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  if (isInitiative) {
    return (
      <>
        <InitiativeDashboard
          user={currentUser}
          stats={stats}
          transactions={transactions}
          canDelete={!isReadOnly}
          onLogout={onLogout}
          onOpenSettings={() => setSettingsOpen(true)}
          onChangeWorkspace={onChangeWorkspace}
          onOpenRecap={
            currentUser.role === "admin" ? () => setRecapOpen(true) : undefined
          }
          onDelete={() => refresh(true)}
          onNewOperation={!isReadOnly ? () => setFormOpen(true) : undefined}
        />

        {currentUser.role === "admin" && (
          <div className="theme-initiative max-w-6xl mx-auto px-4 sm:px-6 pb-24 -mt-4">
            <AuditLogPanel />
          </div>
        )}

        {!isReadOnly && (
          <div className={formOpen ? "theme-initiative" : undefined}>
            <TransactionForm
              onSuccess={() => {
                refresh(true);
                setFormOpen(false);
              }}
              elegant
              open={formOpen}
              onOpenChange={setFormOpen}
              hideFab
            />
          </div>
        )}

        {currentUser.role === "admin" && (
          <RecapModal open={recapOpen} onClose={() => setRecapOpen(false)} />
        )}

        <SettingsPanel
          user={currentUser}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={currentUser}
        onLogout={onLogout}
        onOpenSettings={() => setSettingsOpen(true)}
        onChangeWorkspace={onChangeWorkspace}
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
