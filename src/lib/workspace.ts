import type { UserRole } from "./db";

export type Workspace = "judo_vacances" | "initiative_judo";

export const WORKSPACE_OPTIONS: {
  id: Workspace;
  label: string;
  description: string;
}[] = [
  {
    id: "judo_vacances",
    label: "Judo-Vacances",
    description: "Caisse partagée Financière et Coordon",
  },
  {
    id: "initiative_judo",
    label: "Initiative Judo",
    description: "Caisse réservée à l'Admin et à la Financière",
  },
];

export function isWorkspace(value: unknown): value is Workspace {
  return value === "judo_vacances" || value === "initiative_judo";
}

export function workspaceLabel(workspace: Workspace): string {
  return (
    WORKSPACE_OPTIONS.find((w) => w.id === workspace)?.label ?? workspace
  );
}

export function canAccessWorkspace(
  role: UserRole,
  workspace: Workspace
): boolean {
  if (workspace === "judo_vacances") return true;
  return role === "admin" || role === "financiere";
}

export function requiresWorkspaceChoice(role: UserRole): boolean {
  return role === "admin" || role === "financiere";
}

export function defaultWorkspaceForRole(role: UserRole): Workspace | null {
  if (role === "coordon") return "judo_vacances";
  return null;
}
