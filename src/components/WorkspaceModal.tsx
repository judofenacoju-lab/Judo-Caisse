"use client";

import { useState } from "react";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import type { Workspace } from "@/lib/workspace";
import { WORKSPACE_OPTIONS } from "@/lib/workspace";

interface WorkspaceModalProps {
  onSelect: (workspace: Workspace) => Promise<void>;
  onLogout: () => void;
}

export default function WorkspaceModal({
  onSelect,
  onLogout,
}: WorkspaceModalProps) {
  const [loading, setLoading] = useState<Workspace | null>(null);
  const [error, setError] = useState("");

  async function handleSelect(workspace: Workspace) {
    setError("");
    setLoading(workspace);
    try {
      await onSelect(workspace);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sélection impossible");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-primary to-slate-800">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Choisir un tableau de bord</h1>
          <p className="text-slate-300 mt-2">
            Sélectionnez l&apos;espace de caisse à ouvrir
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-3">
          {WORKSPACE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={loading !== null}
              onClick={() => handleSelect(option.id)}
              className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-border hover:border-primary-light hover:bg-slate-50 transition-colors text-left disabled:opacity-60"
            >
              <div>
                <p className="font-semibold text-slate-900">{option.label}</p>
                <p className="text-sm text-muted mt-0.5">{option.description}</p>
              </div>
              <ArrowRight
                className={`w-5 h-5 text-primary flex-shrink-0 ${
                  loading === option.id ? "animate-pulse" : ""
                }`}
              />
            </button>
          ))}

          {error && (
            <p className="text-sm text-accent bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={onLogout}
            disabled={loading !== null}
            className="w-full mt-2 py-2.5 text-sm font-medium text-muted hover:text-accent transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
