import type { Session } from "@smarterp/contracts";

const storageKeys = {
  session: "smarterp.next.session",
  selectedTenantId: "smarterp.next.selectedTenantId",
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isStoredSession(value: unknown): value is Session {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Session).userId === "string" &&
    typeof (value as Session).email === "string" &&
    typeof (value as Session).displayName === "string" &&
    typeof (value as Session).accessToken === "string" &&
    ((value as Session).role === "founder")
  );
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function readStoredSession(): Session | null {
  const session = readJson<unknown>(storageKeys.session);
  return isStoredSession(session) ? session : null;
}

export function writeStoredSession(session: Session | null): void {
  if (!canUseStorage()) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(storageKeys.session);
    return;
  }

  window.localStorage.setItem(storageKeys.session, JSON.stringify(session));
}

export function readStoredTenantId(): string {
  if (!canUseStorage()) {
    return "";
  }

  return window.localStorage.getItem(storageKeys.selectedTenantId) ?? "";
}

export function writeStoredTenantId(tenantId: string): void {
  if (!canUseStorage()) {
    return;
  }

  if (!tenantId) {
    window.localStorage.removeItem(storageKeys.selectedTenantId);
    return;
  }

  window.localStorage.setItem(storageKeys.selectedTenantId, tenantId);
}

export function clearStoredWorkspaceState(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(storageKeys.session);
  window.localStorage.removeItem(storageKeys.selectedTenantId);
}
