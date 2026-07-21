import type { Currency, UserRole } from "./db";

export function canCreateTransactions(role: UserRole): boolean {
  return role === "financiere" || role === "coordon";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}

export function roleLabel(role: UserRole): string {
  if (role === "financiere") return "Financière";
  if (role === "coordon") return "Coordon";
  return "Administrateur";
}

export function currencyLabel(currency: Currency): string {
  return currency === "FC" ? "FC" : "$";
}

export function formatCurrency(amount: number, currency: Currency = "USD"): string {
  if (currency === "FC") {
    return (
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount) + " FC"
    );
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
