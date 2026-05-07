"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function DetailBackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-500)] transition-colors hover:text-[var(--color-accent-700)]",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

type DetailHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
};

export function DetailHeader({
  eyebrow,
  title,
  subtitle,
  badges,
  actions,
}: DetailHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent-600)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink-950)] md:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-[var(--color-ink-500)]">{subtitle}</p>
        ) : null}
        {badges ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {badges}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

type DetailSectionProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function DetailSection({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: DetailSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--color-line)] bg-card p-5 md:p-6",
        "shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {title || actions ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-semibold text-[var(--color-ink-950)]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="shrink-0 flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn(bodyClassName)}>{children}</div>
    </section>
  );
}

type DetailFieldProps = {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function DetailField({
  label,
  children,
  className,
}: DetailFieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-500)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--color-ink-950)] break-words">
        {children}
      </dd>
    </div>
  );
}

export function DetailFieldGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-4 sm:grid-cols-2 md:gap-5",
        className,
      )}
    >
      {children}
    </dl>
  );
}

type MetaItem = {
  label: React.ReactNode;
  value: React.ReactNode;
};

export function DetailMetaList({ items }: { items: MetaItem[] }) {
  return (
    <ul className="divide-y divide-[var(--color-line)]">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 py-2.5 text-xs first:pt-0 last:pb-0"
        >
          <span className="text-[var(--color-ink-500)]">{it.label}</span>
          <span className="text-right text-[var(--color-ink-950)]">
            {it.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

type RelatedRowProps = {
  href?: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  trailing?: React.ReactNode;
  badge?: React.ReactNode;
};

export function RelatedRow({
  href,
  primary,
  secondary,
  trailing,
  badge,
}: RelatedRowProps) {
  const inner = (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium text-[var(--color-ink-950)]">
          {primary}
        </p>
        {secondary ? (
          <p className="truncate text-xs text-[var(--color-ink-500)]">
            {secondary}
          </p>
        ) : null}
      </div>
      {trailing ? (
        <span className="shrink-0 font-mono text-sm tabular-nums text-[var(--color-ink-700)]">
          {trailing}
        </span>
      ) : null}
      {badge ? <span className="shrink-0">{badge}</span> : null}
    </div>
  );

  if (!href) {
    return (
      <li className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-soft)]">
        {inner}
      </li>
    );
  }
  return (
    <li className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-soft)] transition-colors hover:border-[var(--color-accent-300)] hover:bg-[var(--color-accent-50)]">
      <Link href={href} className="block">
        {inner}
      </Link>
    </li>
  );
}

export function RelatedList({
  children,
  empty,
}: {
  children: React.ReactNode;
  empty?: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  if (!hasChildren) {
    return (
      <p className="text-xs text-[var(--color-ink-500)]">
        {empty ?? "登録されていません"}
      </p>
    );
  }
  return <ul className="space-y-2">{children}</ul>;
}
