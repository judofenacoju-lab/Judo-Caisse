"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Category, PublicUser, Session, TransactionType, UserRole } from "@/lib/db";

interface SettingsPanelProps {
  user: Session;
  open: boolean;
  onClose: () => void;
}

type Tab = "export" | "pin" | "categories" | "users";

export default function SettingsPanel({ user, open, onClose }: SettingsPanelProps) {
  const isAdmin = user.role === "admin";
  const [tab, setTab] = useState<Tab>("export");

  if (!open) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = isAdmin
    ? [
        { id: "export", label: "Export", icon: <Download className="w-4 h-4" /> },
        { id: "users", label: "Utilisateurs", icon: <Users className="w-4 h-4" /> },
      ]
    : [
        { id: "export", label: "Export", icon: <Download className="w-4 h-4" /> },
        { id: "pin", label: "Code PIN", icon: <KeyRound className="w-4 h-4" /> },
        { id: "categories", label: "Catégories", icon: <Tags className="w-4 h-4" /> },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h2 className="text-xl font-bold">Paramètres</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-border shrink-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? "border-primary-light text-primary-light"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {tab === "export" && <ExportTab />}
          {tab === "pin" && !isAdmin && <PinTab user={user} />}
          {tab === "categories" && !isAdmin && <CategoriesTab />}
          {tab === "users" && isAdmin && <AdminUsersTab />}
        </div>
      </div>
    </div>
  );
}

function ExportTab() {
  const [loading, setLoading] = useState<"pdf" | "xlsx" | null>(null);

  async function handleExport(format: "pdf" | "xlsx") {
    setLoading(format);
    try {
      const res = await fetch(`/api/export?format=${format}`);
      if (!res.ok) {
        alert("Erreur lors de l'export");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `judo-caisse-${new Date().toISOString().slice(0, 10)}.${format === "pdf" ? "pdf" : "xlsx"}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Exportez le rapport financier : résumé et historique des opérations.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => handleExport("pdf")}
          disabled={loading !== null}
          className="flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-primary-light hover:bg-blue-50 transition-all disabled:opacity-50"
        >
          <div className="p-3 bg-red-100 rounded-xl">
            <FileText className="w-6 h-6 text-accent" />
          </div>
          <div className="text-left">
            <p className="font-semibold">Export PDF</p>
            <p className="text-sm text-muted">
              {loading === "pdf" ? "Génération..." : "Rapport imprimable"}
            </p>
          </div>
        </button>
        <button
          onClick={() => handleExport("xlsx")}
          disabled={loading !== null}
          className="flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-primary-light hover:bg-blue-50 transition-all disabled:opacity-50"
        >
          <div className="p-3 bg-green-100 rounded-xl">
            <FileSpreadsheet className="w-6 h-6 text-success" />
          </div>
          <div className="text-left">
            <p className="font-semibold">Export Excel</p>
            <p className="text-sm text-muted">
              {loading === "xlsx" ? "Génération..." : "Même structure que le PDF"}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

function PinTab({ user }: { user: Session }) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPin !== confirmPin) {
      setError("Les nouveaux PIN ne correspondent pas");
      return;
    }
    if (newPin.length < 4) {
      setError("Le PIN doit contenir au moins 4 chiffres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      setSuccess(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <p className="text-sm text-muted">
        Modifiez votre code PIN personnel ({user.name}). Le PIN doit contenir 4 à 6 chiffres.
      </p>

      <div>
        <label className="block text-sm font-medium mb-2">PIN actuel</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={currentPin}
          onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
          className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Nouveau PIN</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={newPin}
          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
          className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Confirmer le nouveau PIN</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
          className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="text-sm text-success bg-green-50 px-4 py-2 rounded-lg">
          PIN modifié avec succès
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Modifier le PIN"}
      </button>
    </form>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<TransactionType>("entree");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, type: newType }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    setNewName("");
    loadCategories();
  }

  async function handleUpdate(id: number) {
    setError("");
    const res = await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    setEditingId(null);
    loadCategories();
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    setError("");
    const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    loadCategories();
  }

  const entrees = categories.filter((c) => c.type === "entree");
  const sorties = categories.filter((c) => c.type === "sortie");

  if (loading) {
    return <p className="text-muted text-sm">Chargement...</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Ajoutez, renommez ou supprimez les catégories d&apos;entrées et de sorties.
      </p>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nouvelle catégorie"
          className="flex-1 px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
          required
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as TransactionType)}
          className="px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-light"
        >
          <option value="entree">Entrée</option>
          <option value="sortie">Sortie</option>
        </select>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}

      <CategoryGroup
        title="Entrées"
        items={entrees}
        colorClass="text-success"
        editingId={editingId}
        editName={editName}
        onStartEdit={(cat) => {
          setEditingId(cat.id);
          setEditName(cat.name);
        }}
        onEditNameChange={setEditName}
        onSaveEdit={handleUpdate}
        onCancelEdit={() => setEditingId(null)}
        onDelete={handleDelete}
      />

      <CategoryGroup
        title="Sorties"
        items={sorties}
        colorClass="text-accent"
        editingId={editingId}
        editName={editName}
        onStartEdit={(cat) => {
          setEditingId(cat.id);
          setEditName(cat.name);
        }}
        onEditNameChange={setEditName}
        onSaveEdit={handleUpdate}
        onCancelEdit={() => setEditingId(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}

function AdminUsersTab() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [resetPinId, setResetPinId] = useState<number | null>(null);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleSaveName(userId: number) {
    setError("");
    setSuccess("");
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name: editName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    setEditingNameId(null);
    setSuccess("Nom modifié avec succès");
    loadUsers();
  }

  async function handleResetPin(userId: number) {
    setError("");
    setSuccess("");
    if (newPin !== confirmPin) {
      setError("Les PIN ne correspondent pas");
      return;
    }
    if (newPin.length < 4) {
      setError("Le PIN doit contenir au moins 4 chiffres");
      return;
    }
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newPin }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    setResetPinId(null);
    setNewPin("");
    setConfirmPin("");
    setSuccess("PIN réinitialisé avec succès");
  }

  function roleLabel(role: UserRole) {
    if (role === "financiere") return "Financière";
    return "Coordon";
  }

  if (loading) {
    return <p className="text-muted text-sm">Chargement...</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Gérez les comptes Financière et Coordon : modification des noms et réinitialisation
        des PIN sans connaître le PIN actuel.
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="text-sm text-success bg-green-50 px-4 py-2 rounded-lg">{success}</p>
      )}

      <div className="space-y-4">
        {users.map((u) => (
          <div key={u.id} className="p-4 rounded-xl border border-border bg-slate-50 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide">
                  {roleLabel(u.role)}
                </p>
                {editingNameId === u.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveName(u.id)}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setEditingNameId(null)}
                      className="px-3 py-1.5 text-sm text-muted"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-semibold">{u.name}</p>
                    <button
                      onClick={() => {
                        setEditingNameId(u.id);
                        setEditName(u.name);
                        setError("");
                        setSuccess("");
                      }}
                      className="p-1 text-muted hover:text-primary rounded-lg"
                      title="Modifier le nom"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setResetPinId(resetPinId === u.id ? null : u.id);
                  setNewPin("");
                  setConfirmPin("");
                  setError("");
                  setSuccess("");
                }}
                className="px-3 py-2 text-sm font-medium bg-white border border-border rounded-lg hover:border-primary-light hover:text-primary transition-colors"
              >
                Réinitialiser PIN
              </button>
            </div>

            {resetPinId === u.id && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Nouveau PIN"
                  className="px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Confirmer le PIN"
                  className="px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
                <button
                  onClick={() => handleResetPin(u.id)}
                  className="sm:col-span-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-light"
                >
                  Enregistrer le nouveau PIN
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryGroup({
  title,
  items,
  colorClass,
  editingId,
  editName,
  onStartEdit,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  title: string;
  items: Category[];
  colorClass: string;
  editingId: number | null;
  editName: string;
  onStartEdit: (cat: Category) => void;
  onEditNameChange: (name: string) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div>
      <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 ${colorClass}`}>
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Aucune catégorie</p>
      ) : (
        <ul className="space-y-2">
          {items.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 group"
            >
              {editingId === cat.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => onEditNameChange(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
                    autoFocus
                  />
                  <button
                    onClick={() => onSaveEdit(cat.id)}
                    className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-light"
                  >
                    OK
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="px-3 py-1.5 text-sm text-muted hover:bg-slate-200 rounded-lg"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <button
                    onClick={() => onStartEdit(cat)}
                    className="p-1.5 text-muted hover:text-primary hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Renommer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(cat.id)}
                    className="p-1.5 text-muted hover:text-accent hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
