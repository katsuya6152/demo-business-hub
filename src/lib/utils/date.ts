import {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  parseISO,
} from "date-fns";
import { ja } from "date-fns/locale";

export function fmtDate(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd");
}

export function fmtDateTime(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd HH:mm");
}

export function fmtMonth(iso: string): string {
  return format(parseISO(iso), "yyyy-MM");
}

export function fmtRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: ja });
}

export function isThisMonth(iso: string, ref: Date = new Date()): boolean {
  const date = parseISO(iso);
  return !isBefore(date, startOfMonth(ref)) && !isAfter(date, endOfMonth(ref));
}

export function isLastMonth(iso: string, ref: Date = new Date()): boolean {
  const last = subMonths(ref, 1);
  return isThisMonth(iso, last);
}

export function isNextMonth(iso: string, ref: Date = new Date()): boolean {
  const next = addMonths(ref, 1);
  return isThisMonth(iso, next);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = parseISO(fromIso);
  const to = parseISO(toIso);
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function todayIso(): string {
  return new Date().toISOString();
}

export {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isAfter,
  isBefore,
};
