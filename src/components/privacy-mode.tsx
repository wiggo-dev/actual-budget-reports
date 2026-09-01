"use client";

import { Eye, EyeOff } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "actual-reports-privacy-mode";
const PRIVACY_EVENT = "actual-reports-privacy-mode-change";

function readPrivacyMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return sessionStorage.getItem(STORAGE_KEY) === "1";
}

function writePrivacyMode(enabled: boolean) {
  sessionStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  document.documentElement.classList.toggle("privacy-mode", enabled);
  window.dispatchEvent(new Event(PRIVACY_EVENT));
}

function subscribePrivacy(onStoreChange: () => void) {
  window.addEventListener(PRIVACY_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(PRIVACY_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

type PrivacyModeContextValue = {
  enabled: boolean;
  toggle: () => void;
};

const PrivacyModeContext = createContext<PrivacyModeContextValue | null>(null);

export function PrivacyModeProvider({ children }: { children: ReactNode }) {
  const enabled = useSyncExternalStore(
    subscribePrivacy,
    readPrivacyMode,
    () => false
  );

  useEffect(() => {
    document.documentElement.classList.toggle("privacy-mode", enabled);
  }, [enabled]);

  const toggle = useCallback(() => {
    writePrivacyMode(!readPrivacyMode());
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "p" || !event.shiftKey) {
        return;
      }
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      toggle();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <PrivacyModeContext.Provider value={{ enabled, toggle }}>
      {children}
    </PrivacyModeContext.Provider>
  );
}

export function usePrivacyMode() {
  const context = useContext(PrivacyModeContext);
  if (!context) {
    throw new Error("usePrivacyMode must be used within PrivacyModeProvider");
  }
  return context;
}

export function PrivacyModeToggle({ className }: { className?: string }) {
  const { enabled, toggle } = usePrivacyMode();

  return (
    <Button
      type="button"
      variant={enabled ? "default" : "outline"}
      size="sm"
      className={cn("shrink-0 rounded-xl", className)}
      aria-pressed={enabled}
      title="Blur amounts and charts (⇧⌘P / ⇧Ctrl+P)"
      onClick={toggle}
    >
      {enabled ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      {enabled ? "Privacy on" : "Privacy off"}
    </Button>
  );
}
