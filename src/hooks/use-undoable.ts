"use client";

import { toast } from "sonner";

type UndoableOptions<T> = {
  /** Snapshot of the array before mutation (used to restore on undo) */
  before: T[];
  /** Function that replaces the entire array, used to restore */
  setAll: (items: T[]) => void;
  /** Function that performs the actual mutation (delete/update). */
  perform: () => void;
  /** Toast message shown after the mutation succeeds */
  message: string;
  /** Toast description (optional) */
  description?: string;
  /** Toast duration in ms (default 6000) */
  duration?: number;
};

/**
 * Performs a mutation immediately and shows a toast with an "Undo" action.
 * On click, restores the snapshot via `setAll`.
 */
export function performUndoable<T>({
  before,
  setAll,
  perform,
  message,
  description,
  duration = 6000,
}: UndoableOptions<T>): void {
  perform();
  toast.success(message, {
    description,
    duration,
    action: {
      label: "元に戻す",
      onClick: () => {
        setAll(before);
        toast.info("操作を元に戻しました");
      },
    },
  });
}
