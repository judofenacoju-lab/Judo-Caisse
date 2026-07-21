"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Shield, UserCircle } from "lucide-react";
import type { StaffRole } from "@/lib/db";

interface LoginFormProps {
  onSuccess: () => void;
  formKey: number;
}

export default function LoginForm({ onSuccess, formKey }: LoginFormProps) {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRole(null);
    setPin("");
    setShowPin(false);
    setError("");
    if (pinRef.current) pinRef.current.value = "";
  }, [formKey]);

  function toggleRole(selected: StaffRole) {
    setRole((current) => (current === selected ? null : selected));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = role ? { role, pin } : { pin };
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = text ? (JSON.parse(text) as { error?: string }) : {};
      } catch {
        setError(
          res.ok
            ? "Réponse serveur invalide"
            : `Erreur serveur (${res.status}). Vérifiez les variables Supabase sur Vercel.`
        );
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Erreur de connexion");
        return;
      }
      setPin("");
      onSuccess();
    } catch {
      setError("Impossible de se connecter au serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-primary to-slate-800">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <span className="text-4xl">🥋</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Judo Caisse</h1>
          <p className="text-slate-300 mt-2">Gestion quotidienne de la caisse</p>
        </div>

        <form
          key={formKey}
          onSubmit={handleSubmit}
          autoComplete="off"
          className="bg-white rounded-2xl shadow-2xl p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Votre rôle
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toggleRole("financiere")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === "financiere"
                    ? "border-primary-light bg-blue-50 text-primary"
                    : "border-border hover:border-slate-300"
                }`}
              >
                <Shield className="w-6 h-6" />
                <span className="font-medium text-sm">Financière</span>
              </button>
              <button
                type="button"
                onClick={() => toggleRole("coordon")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === "coordon"
                    ? "border-primary-light bg-blue-50 text-primary"
                    : "border-border hover:border-slate-300"
                }`}
              >
                <UserCircle className="w-6 h-6" />
                <span className="font-medium text-sm">Coordon</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={`pin-${formKey}`} className="block text-sm font-medium text-slate-700 mb-2">
              Code PIN
            </label>
            <div className="relative">
              <input
                ref={pinRef}
                id={`pin-${formKey}`}
                name="judo-caisse-pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Entrez votre code"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                readOnly
                onFocus={(e) => e.target.removeAttribute("readonly")}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent text-center text-2xl tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-foreground rounded-lg transition-colors"
                title={showPin ? "Masquer le PIN" : "Afficher le PIN"}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
