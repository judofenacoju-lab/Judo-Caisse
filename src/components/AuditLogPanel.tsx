"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  FileDown,
  KeyRound,
  LogIn,
  Pencil,
  Plus,
  RotateCcw,
  Tags,
  Trash2,
  UserCog,
} from "lucide-react";
import type { AuditAction, AuditLog } from "@/lib/db";
import { formatDateTime, roleLabel } from "@/lib/utils";

const ACTION_LABELS: Record<AuditAction, string> = {
  login: "Connexion",
  transaction_create: "Création opération",
  transaction_delete: "Suppression opération",
  category_create: "Création catégorie",
  category_update: "Modification catégorie",
  category_delete: "Suppression catégorie",
  user_name_update: "Modification nom",
  user_pin_reset: "Réinit. PIN",
  user_pin_change: "Changement PIN",
  export: "Export",
  audit_reset: "Réinit. journal",
};

function actionIcon(action: AuditAction) {
  switch (action) {
    case "login":
      return <LogIn className="w-4 h-4" />;
    case "transaction_create":
    case "category_create":
      return <Plus className="w-4 h-4" />;
    case "transaction_delete":
    case "category_delete":
      return <Trash2 className="w-4 h-4" />;
    case "category_update":
    case "user_name_update":
      return <Pencil className="w-4 h-4" />;
    case "user_pin_reset":
    case "user_pin_change":
      return <KeyRound className="w-4 h-4" />;
    case "export":
      return <FileDown className="w-4 h-4" />;
    case "audit_reset":
      return <RotateCcw className="w-4 h-4" />;
    default:
      return <Tags className="w-4 h-4" />;
  }
}

function actionColor(action: AuditAction): string {
  if (action.includes("delete") || action === "audit_reset") return "bg-red-100 text-accent";
  if (action.includes("create") || action === "login") return "bg-green-100 text-success";
  if (action.includes("pin") || action === "export") return "bg-amber-100 text-amber-700";
  return "bg-blue-100 text-primary";
}

export default function AuditLogPanel() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [filter, setFilter] = useState<AuditAction | "all">("all");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, [open, loadLogs]);

  async function handleReset(e: React.MouseEvent) {
    e.stopPropagation();
    if (
      !confirm(
        "Réinitialiser le journal d'audit ? Toutes les entrées actuelles seront effacées."
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const res = await fetch("/api/audit", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
        setFilter("all");
      } else {
        alert("Impossible de réinitialiser le journal");
      }
    } finally {
      setResetting(false);
    }
  }

  const filtered =
    filter === "all" ? logs : logs.filter((log) => log.action === filter);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 p-6 border-b border-border">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center justify-between text-left hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Journal d&apos;Audit</h2>
              <p className="text-xs text-muted">
                Toutes les manipulations, y compris les suppressions
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-accent/30 text-accent bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors shrink-0"
          title="Réinitialiser le journal"
        >
          <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
          {resetting ? "..." : "Réinitialiser"}
        </button>
      </div>

      {open && (
        <div>
          <div className="p-4 flex flex-wrap gap-2 border-b border-border bg-slate-50">
            {(
              [
                "all",
                "transaction_create",
                "transaction_delete",
                "category_create",
                "category_update",
                "category_delete",
                "user_name_update",
                "user_pin_reset",
                "user_pin_change",
                "login",
                "export",
                "audit_reset",
              ] as const
            ).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-white text-muted border border-border hover:bg-slate-100"
                }`}
              >
                {f === "all" ? "Tout" : ACTION_LABELS[f]}
              </button>
            ))}
          </div>

          {loading && logs.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">
              Aucune entrée d&apos;audit pour le moment
            </p>
          ) : (
            <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
              {filtered.map((log) => (
                <div key={log.id} className="flex gap-3 p-4 hover:bg-slate-50">
                  <div
                    className={`shrink-0 p-2 rounded-lg h-fit ${actionColor(log.action)}`}
                  >
                    {actionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {ACTION_LABELS[log.action]}
                      </span>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs text-muted">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{log.details}</p>
                    <p className="text-xs text-muted mt-1">
                      Par {log.actor_name} ({roleLabel(log.actor_role)})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
