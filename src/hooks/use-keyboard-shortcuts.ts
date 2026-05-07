"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const NAV_MAP: Record<string, string> = {
  d: "/",
  c: "/customers",
  e: "/deals",
  q: "/quotes",
  i: "/invoices",
  s: "/settings",
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

type Options = {
  onShowHelp?: () => void;
};

export function useKeyboardShortcuts({ onShowHelp }: Options = {}) {
  const router = useRouter();
  const [pendingG, setPendingG] = useState(false);

  useEffect(() => {
    if (!pendingG) return;
    const t = setTimeout(() => setPendingG(false), 1500);
    return () => clearTimeout(t);
  }, [pendingG]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (pendingG) {
        const path = NAV_MAP[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          router.push(path);
        }
        setPendingG(false);
        return;
      }

      if (e.key === "g") {
        e.preventDefault();
        setPendingG(true);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        onShowHelp?.();
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[aria-label*="検索"], input[placeholder*="検索"]',
        );
        search?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pendingG, onShowHelp]);

  return { pendingG };
}
