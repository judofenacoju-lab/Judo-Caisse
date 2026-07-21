"use client";

import { LogOut, Settings } from "lucide-react";
import type { Session, UserRole } from "@/lib/db";
import { roleLabel } from "@/lib/utils";

interface HeaderProps {
  user: Session;
  onLogout: () => void;
  onOpenSettings: () => void;
}

function headerStyles(role: UserRole): string {
  if (role === "financiere") {
    return "bg-gradient-to-br from-primary to-primary-light text-white border-transparent";
  }
  if (role === "coordon") {
    return "bg-gradient-to-br from-red-700 to-accent text-white border-transparent";
  }
  return "bg-gradient-to-br from-slate-800 to-slate-600 text-white border-transparent";
}

export default function Header({ user, onLogout, onOpenSettings }: HeaderProps) {
  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  }

  const isColored = user.role === "financiere" || user.role === "coordon" || user.role === "admin";

  return (
    <header className={`sticky top-0 z-30 border-b ${headerStyles(user.role)}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🥋</span>
          <div>
            <h1 className="text-xl font-bold">Judo Caisse</h1>
            <p className={`text-xs hidden sm:block ${isColored ? "text-white/80" : "text-muted"}`}>
              Gestion quotidienne de la caisse
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.name}</p>
            <p className={`text-xs ${isColored ? "text-white/80" : "text-muted"}`}>
              {roleLabel(user.role)}
            </p>
          </div>
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
