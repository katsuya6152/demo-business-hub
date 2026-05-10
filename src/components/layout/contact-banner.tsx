"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles, X } from "lucide-react";
import { CONTACT_COPY, CONTACT_URL } from "@/lib/constants/contact";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "business-hub-contact-banner-dismissed-at";
const RESHOW_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const APPEAR_DELAY_MS = 8000; // 8s of engagement before showing

function shouldShow(): boolean {
  try {
    const dismissedAt = window.localStorage.getItem(STORAGE_KEY);
    if (!dismissedAt) return true;
    const elapsed = Date.now() - Number(dismissedAt);
    return elapsed > RESHOW_AFTER_MS;
  } catch {
    return true;
  }
}

export function ContactBanner() {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (!shouldShow()) return;
    const showTimer = setTimeout(() => {
      setVisible(true);
      // Next tick so the slide-in transition runs.
      requestAnimationFrame(() => setAnimateIn(true));
    }, APPEAR_DELAY_MS);
    return () => clearTimeout(showTimer);
  }, []);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore — banner will reappear next session
    }
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 200);
  };

  if (!visible) return null;

  return (
    <div
      role="complementary"
      aria-label="開発者へのお問い合わせ案内"
      className={cn(
        // Mobile: fixed bottom centered, above mobile bottom nav (h-14).
        // Desktop (lg+): fixed bottom-right corner.
        "fixed inset-x-3 bottom-[4.25rem] z-40 mx-auto max-w-sm transition-all duration-300 ease-out lg:inset-auto lg:bottom-5 lg:right-5 lg:mx-0",
        animateIn
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-accent-200)] bg-card shadow-2xl ring-1 ring-black/5">
        {/* Decorative gradient blob */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-[var(--color-accent-200)] via-[var(--color-cyan-200)] to-transparent opacity-60 blur-2xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-gradient-to-tr from-[var(--color-accent-100)] to-transparent opacity-50 blur-2xl"
        />

        <div className="relative p-4 pr-9 sm:p-5 sm:pr-10">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={CONTACT_COPY.bannerDismiss}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-500)] transition-colors hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-ink-950)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)]"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent-500)] to-[var(--color-accent-700)] shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-700)]">
              {CONTACT_COPY.bannerEyebrow}
            </p>
          </div>

          <p className="mt-2.5 text-base font-bold leading-snug text-[var(--color-ink-950)] sm:text-[17px]">
            {CONTACT_COPY.bannerHeadline}
          </p>
          <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-[var(--color-ink-600)] sm:text-[13px]">
            {CONTACT_COPY.bannerSub}
          </p>

          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              // Best-effort: also mark dismissed so it doesn't reappear after they engaged.
              try {
                window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
              } catch {
                /* ignore */
              }
            }}
            className="group mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-accent-600)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--color-accent-700)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)] focus-visible:ring-offset-2"
          >
            {CONTACT_COPY.bannerCta}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
