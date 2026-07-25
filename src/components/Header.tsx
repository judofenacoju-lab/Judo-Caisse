"use client";

import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import type { Session, UserRole } from "@/lib/db";
import { roleLabel } from "@/lib/utils";
import { workspaceLabel } from "@/lib/workspace";

interface HeaderProps {
  user: Session;
  onLogout: () => void;
  onOpenSettings: () => void;
  onChangeWorkspace?: () => void;
}

function headerStyles(role: UserRole, elegant: boolean): string {
  if (elegant) {
    return "bg-[linear-gradient(120deg,#7a0000_0%,#b40000_55%,#fb0101_100%)] text-white border-transparent shadow-[0_12px_30px_-18px_rgba(120,0,0,0.7)]";
  }
  if (role === "financiere" || role === "coordon") {
    return "bg-gradient-to-br from-primary to-primary-light text-white border-transparent";
  }
  return "bg-gradient-to-br from-slate-800 to-slate-600 text-white border-transparent";
}

export default function Header({
  user,
  onLogout,
  onOpenSettings,
  onChangeWorkspace,
}: HeaderProps) {
  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  }

  const elegant = user.workspace === "initiative_judo";
  const isColored =
    elegant ||
    user.role === "financiere" ||
    user.role === "coordon" ||
    user.role === "admin";

  return (
    <header className={`sticky top-0 z-30 border-b ${headerStyles(user.role, elegant)}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">🥋</span>
          <div className="min-w-0">
            <h1
              className={`text-xl font-bold truncate ${
                elegant ? "tracking-tight" : ""
              }`}
            >
              {elegant ? "Initiative-Judo" : "Judo Caisse"}
            </h1>
            <p
              className={`text-xs truncate ${
                isColored ? "text-white/80" : "text-muted"
              }`}
            >
              {elegant
                ? "Caisse élégante · Admin & Financière"
                : user.workspace
                  ? workspaceLabel(user.workspace)
                  : "Gestion quotidienne de la caisse"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.name}</p>
            <p className={`text-xs ${isColored ? "text-white/80" : "text-muted"}`}>
              {roleLabel(user.role)}
            </p>
          </div>
          {onChangeWorkspace && (
            <button
              onClick={onChangeWorkspace}
              className={`p-2 rounded-lg transition-colors ${
                isColored
                  ? "text-white/90 hover:bg-white/15"
                  : "text-muted hover:text-primary hover:bg-blue-50"
              }`}
              title="Changer de caisse"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-lg transition-colors ${
              isColored
                ? "text-white/90 hover:bg-white/15"
                : "text-muted hover:text-primary hover:bg-blue-50"
            }`}
            title="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg transition-colors ${
              isColored
                ? "text-white/90 hover:bg-white/15"
                : "text-muted hover:text-accent hover:bg-red-50"
            }`}
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
