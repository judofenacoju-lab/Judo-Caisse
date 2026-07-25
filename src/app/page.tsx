"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import LoginForm from "@/components/LoginForm";
import WorkspaceModal from "@/components/WorkspaceModal";
import type { Session } from "@/lib/db";
import type { Workspace } from "@/lib/workspace";

const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary to-slate-800">
      <div className="text-center">
        <span className="text-4xl animate-pulse">🥋</span>
        <p className="text-slate-300 mt-4">Chargement du tableau de bord...</p>
      </div>
    </div>
  ),
  ssr: false,
});

async function fetchSession(signal?: AbortSignal): Promise<Session | null> {
  const res = await fetch("/api/auth", { signal, cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? null;
}

export default function Home() {
  const [user, setUser] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [loginKey, setLoginKey] = useState(0);

  const checkAuth = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const session = await fetchSession(controller.signal);
      setUser(session);
      return session;
    } catch {
      setUser(null);
      return null;
    } finally {
      clearTimeout(timeout);
      setRestoring(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function handleLoginSuccess() {
    setRestoring(true);
    await checkAuth();
  }

  async function handleWorkspaceSelect(workspace: Workspace) {
    const res = await fetch("/api/auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Sélection impossible");
    }
    setUser(data.user);
  }

  async function handleChangeWorkspace() {
    const res = await fetch("/api/auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearWorkspace: true }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setUser(data.user);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    setUser(null);
    setLoginKey((k) => k + 1);
  }

  if (user && !user.workspace) {
    return (
      <WorkspaceModal
        onSelect={handleWorkspaceSelect}
        onLogout={handleLogout}
      />
    );
  }

  if (user?.workspace) {
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        onUserUpdate={setUser}
        onChangeWorkspace={
          user.role === "admin" || user.role === "financiere"
            ? handleChangeWorkspace
            : undefined
        }
      />
    );
  }

  return (
    <>
      <LoginForm key={loginKey} formKey={loginKey} onSuccess={handleLoginSuccess} />
      {restoring && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-sm text-muted">
          Vérification de la session...
        </div>
      )}
    </>
  );
}
