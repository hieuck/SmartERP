import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";

import type {
  FoundationSnapshot,
  LoginInput,
  Session,
  TenantRecord,
} from "@smarterp/contracts";

import {
  getFoundation,
  login,
  setApiSession,
  setUnauthorizedHandler,
} from "../api";
import { loadTenants } from "../modules/tenants/api";
import {
  clearStoredWorkspaceState,
  writeStoredSession,
  writeStoredTenantId,
} from "./workspaceStorage";

type WorkspaceSessionEffectsDependencies = {
  session: Session | null;
  selectedTenantId: string;
  setSession: Dispatch<SetStateAction<Session | null>>;
  setFoundation: Dispatch<SetStateAction<FoundationSnapshot | null>>;
  setIsBooting: Dispatch<SetStateAction<boolean>>;
  setTenants: Dispatch<SetStateAction<TenantRecord[]>>;
  setSelectedTenantId: Dispatch<SetStateAction<string>>;
  setNoticeMessage: (message: string) => void;
  setErrorMessage: (message: string) => void;
  resetTenantWorkspaceData: () => void;
  refreshTenantWorkspace: (tenantId: string) => Promise<void>;
};

type WorkspaceSessionCommandDependencies = {
  setIsBusy: (busy: boolean) => void;
  setErrorMessage: (message: string) => void;
  setNoticeMessage: (message: string) => void;
  setSession: Dispatch<SetStateAction<Session | null>>;
  setSelectedTenantId: (tenantId: string) => void;
  resetTenantWorkspaceData: () => void;
};

export function useWorkspaceSessionEffects({
  session,
  selectedTenantId,
  setSession,
  setFoundation,
  setIsBooting,
  setTenants,
  setSelectedTenantId,
  setNoticeMessage,
  setErrorMessage,
  resetTenantWorkspaceData,
  refreshTenantWorkspace,
}: WorkspaceSessionEffectsDependencies): void {
  useEffect(() => {
    setApiSession(session);
  }, [session]);

  useEffect(() => {
    setUnauthorizedHandler((message) => {
      clearStoredWorkspaceState();
      setSession(null);
      setSelectedTenantId("");
      setNoticeMessage("");
      setErrorMessage(message);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    getFoundation()
      .then(setFoundation)
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load foundation.");
      })
      .finally(() => {
        setIsBooting(false);
      });
  }, []);

  useEffect(() => {
    writeStoredSession(session);
  }, [session]);

  useEffect(() => {
    writeStoredTenantId(selectedTenantId);
  }, [selectedTenantId]);

  useEffect(() => {
    if (!session) {
      setTenants([]);
      setSelectedTenantId("");
      resetTenantWorkspaceData();
      setNoticeMessage("");
      return;
    }

    loadTenants()
      .then((items) => {
        setTenants(items);
        setSelectedTenantId((current) =>
          items.some((tenant) => tenant.id === current) ? current : (items[0]?.id ?? ""),
        );
      })
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load tenants.");
      });
  }, [session]);

  useEffect(() => {
    if (!selectedTenantId) {
      resetTenantWorkspaceData();
      return;
    }

    refreshTenantWorkspace(selectedTenantId).catch((caught: unknown) => {
      setErrorMessage(caught instanceof Error ? caught.message : "Failed to load workspace.");
    });
  }, [selectedTenantId]);
}

export function createWorkspaceSessionCommands({
  setIsBusy,
  setErrorMessage,
  setNoticeMessage,
  setSession,
  setSelectedTenantId,
  resetTenantWorkspaceData,
}: WorkspaceSessionCommandDependencies) {
  return {
    async loginToWorkspace(input: LoginInput): Promise<void> {
      setIsBusy(true);
      setErrorMessage("");

      try {
        const result = await login(input);
        setSession(result.session);
      } catch (caught) {
        setErrorMessage(caught instanceof Error ? caught.message : "Login failed.");
        throw caught;
      } finally {
        setIsBusy(false);
      }
    },

    logoutFromWorkspace(): void {
      clearStoredWorkspaceState();
      setSession(null);
      setSelectedTenantId("");
      setErrorMessage("");
      setNoticeMessage("");
      resetTenantWorkspaceData();
    },
  };
}
