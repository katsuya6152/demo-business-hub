"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: ["⌘", "K"], description: "コマンドパレットを開く（Mac）" },
  { keys: ["Ctrl", "K"], description: "コマンドパレットを開く（Win/Linux）" },
  { keys: ["g", "→", "d"], description: "ダッシュボードへ移動" },
  { keys: ["g", "→", "c"], description: "顧客一覧へ移動" },
  { keys: ["g", "→", "e"], description: "案件一覧へ移動" },
  { keys: ["g", "→", "q"], description: "見積一覧へ移動" },
  { keys: ["g", "→", "i"], description: "請求一覧へ移動" },
  { keys: ["g", "→", "s"], description: "設定へ移動" },
  { keys: ["/"], description: "現在画面の検索ボックスにフォーカス" },
  { keys: ["?"], description: "このヘルプを表示" },
  { keys: ["Esc"], description: "ダイアログ・パレットを閉じる" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>キーボードショートカット</DialogTitle>
          <DialogDescription>
            効率的に画面を移動・操作するためのキー一覧です。
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map((s, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] pb-2 last:border-b-0"
            >
              <span className="text-[var(--color-ink-700)]">
                {s.description}
              </span>
              <span className="flex items-center gap-1 text-xs">
                {s.keys.map((k, ki) => (
                  <kbd
                    key={ki}
                    className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-1.5 font-mono text-[11px] text-[var(--color-ink-700)]"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
