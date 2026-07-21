"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileUp, Paperclip, Plus, X } from "lucide-react";
import CameraCapture from "@/components/CameraCapture";
import type { Category, Currency, TransactionType } from "@/lib/db";

interface TransactionFormProps {
  onSuccess: () => void;
}

interface JustificationItem {
  id: string;
  file: File;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("entree");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [justifications, setJustifications] = useState<JustificationItem[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    if (open) {
      fetch(`/api/categories?type=${type}`)
        .then((r) => r.json())
        .then((data) => {
          setCategories(data.categories ?? []);
          setCategoryId("");
        });
    }
  }, [open, type]);

  function resetForm() {
    setAmount("");
    setCurrency("USD");
    setDescription("");
    setCategoryId("");
    setDate(new Date().toISOString().split("T")[0]);
    setJustifications([]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addJustification(file: File) {
    idCounter.current += 1;
    setJustifications((prev) => [
      ...prev,
      { id: `j-${idCounter.current}`, file },
    ]);
    setError("");
  }

  function removeJustification(id: string) {
    setJustifications((prev) => prev.filter((j) => j.id !== id));
  }

  function handleImportFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => addJustification(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Montant invalide");
      setLoading(false);
      return;
    }

    if (type === "sortie" && justifications.length === 0) {
      setError("Au moins un justificatif (PDF ou JPG) est obligatoire pour les sorties");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("amount", String(parsedAmount));
      formData.append("currency", currency);
      formData.append("description", description);
      if (categoryId) formData.append("categoryId", categoryId);
      formData.append("date", date);
      for (const j of justifications) {
        formData.append("justification", j.file);
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement");
        return;
      }

      resetForm();
      setOpen(false);
      onSuccess();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-4 bg-primary text-white font-semibold rounded-full shadow-lg hover:bg-primary-light transition-all hover:scale-105"
      >
        <Plus className="w-5 h-5" />
        Nouvelle opération
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-bold">Nouvelle opération</h2>
            <button
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType("entree");
                  setJustifications([]);
                }}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  type === "entree"
                    ? "bg-green-100 text-success border-2 border-success"
                    : "bg-slate-50 text-muted border-2 border-transparent hover:border-border"
                }`}
              >
                + Entrée
              </button>
              <button
                type="button"
                onClick={() => setType("sortie")}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  type === "sortie"
                    ? "bg-red-100 text-accent border-2 border-accent"
                    : "bg-slate-50 text-muted border-2 border-transparent hover:border-border"
                }`}
              >
                − Sortie
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Montant
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="flex-1 px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light text-xl font-semibold"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      currency === "USD"
                        ? "bg-primary text-white border-2 border-primary"
                        : "bg-slate-50 text-muted border-2 border-transparent hover:border-border"
                    }`}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("FC")}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      currency === "FC"
                        ? "bg-primary text-white border-2 border-primary"
                        : "bg-slate-50 text-muted border-2 border-transparent hover:border-border"
                    }`}
                  >
                    FC
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex : Cotisation saison 2025-2026"
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Catégorie
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light bg-white"
              >
                <option value="">— Sélectionner —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-light"
                required
              />
            </div>

            {type === "sortie" && (
              <div className="space-y-3 p-4 rounded-xl border-2 border-dashed border-accent/30 bg-red-50/50">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Justificatifs <span className="text-accent">*</span>
                  </label>
                  <p className="text-xs text-muted mt-1">
                    Pièce d&apos;identité ou documents (PDF ou JPG). Vous pouvez en ajouter
                    plusieurs.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCameraOpen(true)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border bg-white hover:border-primary-light hover:bg-blue-50 transition-all"
                  >
                    <Camera className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium">Photographier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border bg-white hover:border-primary-light hover:bg-blue-50 transition-all"
                  >
                    <FileUp className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium">Importer</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,application/pdf,.jpg,.jpeg,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImportFiles(e.target.files)}
                />

                {justifications.length > 0 && (
                  <ul className="space-y-2">
                    {justifications.map((j, index) => (
                      <li
                        key={j.id}
                        className="flex items-center gap-2 p-3 bg-white rounded-lg border border-border"
                      >
                        <Paperclip className="w-4 h-4 text-muted shrink-0" />
                        <span className="text-sm truncate flex-1">
                          {j.file.name || `Justificatif ${index + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeJustification(j.id)}
                          className="text-xs text-accent hover:underline shrink-0"
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={
                loading || (type === "sortie" && justifications.length === 0)
              }
              className={`w-full py-3 px-4 font-semibold rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                type === "entree"
                  ? "bg-success hover:bg-green-700"
                  : "bg-accent hover:bg-red-700"
              }`}
            >
              {loading
                ? "Enregistrement..."
                : type === "entree"
                  ? "Enregistrer l'entrée"
                  : justifications.length === 0
                    ? "Ajoutez un justificatif pour continuer"
                    : "Enregistrer la sortie"}
            </button>
          </form>
        </div>
      </div>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={addJustification}
      />
    </>
  );
}
