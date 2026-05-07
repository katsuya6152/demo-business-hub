"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AlertCircle, FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  dedupAgainstExisting,
  parseCustomersCSV,
  type CsvParseOutcome,
  type DedupResult,
} from "@/lib/csv/customers-csv";
import { useCustomersStore } from "@/lib/store/customers";

type CsvImportSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AnalyzedFile = {
  filename: string;
  outcome: CsvParseOutcome;
  dedup: DedupResult;
};

export function CsvImportSheet({ open, onOpenChange }: CsvImportSheetProps) {
  const customers = useCustomersStore((s) => s.customers);
  const add = useCustomersStore((s) => s.add);

  const [analyzed, setAnalyzed] = useState<AnalyzedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setAnalyzed(null);
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleClose = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset],
  );

  const analyzeFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const outcome = parseCustomersCSV(text);
        const dedup = dedupAgainstExisting(outcome.validRows, customers);
        setAnalyzed({ filename: file.name, outcome, dedup });
      } catch (err) {
        toast.error(
          `CSV の読み込みに失敗しました: ${err instanceof Error ? err.message : "不明なエラー"}`,
        );
      }
    },
    [customers],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (
        !file.name.toLowerCase().endsWith(".csv") &&
        file.type !== "text/csv"
      ) {
        toast.error("CSV ファイル (.csv) を選択してください");
        return;
      }
      void analyzeFile(file);
    },
    [analyzeFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!analyzed) return;
    setImporting(true);
    try {
      const inserted = analyzed.dedup.toInsert;
      for (const row of inserted) {
        add(row);
      }
      toast.success(`${inserted.length} 件のインポートが完了しました`);
      reset();
      onOpenChange(false);
    } finally {
      setImporting(false);
    }
  }, [analyzed, add, reset, onOpenChange]);

  const stats = useMemo(() => {
    if (!analyzed) return null;
    const valid = analyzed.outcome.validRows.length;
    const errorRows = new Set(
      analyzed.outcome.errors.filter((e) => e.row > 0).map((e) => e.row),
    ).size;
    const headerErrors = analyzed.outcome.errors.filter((e) => e.row === 0);
    return {
      valid,
      errorRows,
      headerErrors,
      duplicates: analyzed.dedup.duplicates.length,
      toInsert: analyzed.dedup.toInsert.length,
    };
  }, [analyzed]);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-[var(--color-line)]">
          <SheetTitle>顧客 CSV インポート</SheetTitle>
          <SheetDescription>
            CSV ファイルをドラッグ＆ドロップ、または選択してください。
            ヘッダー行に「顧客名 / 業種 / 担当者 / 役職 / メール / 電話 / 郵便番号 /
            住所 / ステータス / メモ」が必要です。
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4 py-4">
          {!analyzed ? (
            <DropZone
              dragOver={dragOver}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onPick={() => inputRef.current?.click()}
            />
          ) : (
            <FileSummary
              filename={analyzed.filename}
              onClear={reset}
              stats={stats}
            />
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {analyzed && stats ? (
            <>
              <StatsRow stats={stats} />
              {stats.headerErrors.length > 0 ? (
                <HeaderErrorBox messages={stats.headerErrors.map((e) => e.message)} />
              ) : null}
              {analyzed.outcome.errors.filter((e) => e.row > 0).length > 0 ? (
                <ErrorTable errors={analyzed.outcome.errors.filter((e) => e.row > 0)} />
              ) : null}
              {analyzed.dedup.duplicates.length > 0 ? (
                <DuplicatesBox dups={analyzed.dedup.duplicates} />
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-line)] p-4">
          <Button variant="outline" onClick={() => handleClose(false)}>
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              !analyzed ||
              importing ||
              analyzed.dedup.toInsert.length === 0
            }
          >
            <Upload className="h-4 w-4" />
            {analyzed
              ? `${analyzed.dedup.toInsert.length} 件をインポート`
              : "インポート確定"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DropZone({
  dragOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onPick,
}: {
  dragOver: boolean;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onPick: () => void;
}) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
        dragOver
          ? "border-[var(--color-accent-600)] bg-[var(--color-accent-50)]"
          : "border-[var(--color-line)] bg-[var(--color-bg-soft)] hover:bg-[var(--color-bg-elevated)]",
      )}
    >
      <Upload className="h-8 w-8 text-[var(--color-ink-500)]" />
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink-950)]">
          ここに CSV ファイルをドロップ
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-500)]">
          またはクリックしてファイルを選択
        </p>
      </div>
    </div>
  );
}

function FileSummary({
  filename,
  onClear,
  stats,
}: {
  filename: string;
  onClear: () => void;
  stats: { valid: number; errorRows: number; toInsert: number } | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-[var(--color-ink-500)]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--color-ink-950)]">
            {filename}
          </p>
          {stats ? (
            <p className="text-xs text-[var(--color-ink-500)]">
              成功 {stats.valid} / エラー {stats.errorRows} / 追加対象{" "}
              {stats.toInsert}
            </p>
          ) : null}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClear}
        aria-label="ファイルを取り消す"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function StatsRow({
  stats,
}: {
  stats: {
    valid: number;
    errorRows: number;
    duplicates: number;
    toInsert: number;
  };
}) {
  const items: Array<{
    label: string;
    value: number;
    tone: "ink" | "cyan" | "amber" | "red";
  }> = [
    { label: "成功行", value: stats.valid, tone: "cyan" },
    { label: "エラー行", value: stats.errorRows, tone: "red" },
    { label: "重複（スキップ）", value: stats.duplicates, tone: "amber" },
    { label: "追加対象", value: stats.toInsert, tone: "ink" },
  ];
  const TONE_CLS: Record<typeof items[number]["tone"], string> = {
    ink: "border-[var(--color-line)] bg-card text-[var(--color-ink-950)]",
    cyan: "border-[var(--color-cyan-200)] bg-[var(--color-cyan-50)] text-[var(--color-cyan-700)]",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className={cn("rounded-lg border px-3 py-2", TONE_CLS[it.tone])}
        >
          <p className="text-[10px] uppercase tracking-wider opacity-80">
            {it.label}
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {it.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function HeaderErrorBox({ messages }: { messages: string[] }) {
  return (
    <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">CSV ヘッダーが不正です</p>
        <ul className="mt-1 list-inside list-disc text-xs">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ErrorTable({
  errors,
}: {
  errors: Array<{ row: number; field?: string; message: string }>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-line)]">
      <div className="border-b border-[var(--color-line)] bg-[var(--color-bg-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-ink-700)]">
        エラー詳細（{errors.length} 件）
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-bg-soft)] text-xs text-[var(--color-ink-500)]">
            <tr>
              <th className="px-3 py-1.5 text-left">行</th>
              <th className="px-3 py-1.5 text-left">フィールド</th>
              <th className="px-3 py-1.5 text-left">メッセージ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {errors.map((e, i) => (
              <tr key={i}>
                <td className="px-3 py-1.5 tabular-nums text-[var(--color-ink-700)]">
                  {e.row}
                </td>
                <td className="px-3 py-1.5 text-[var(--color-ink-700)]">
                  {e.field ?? "—"}
                </td>
                <td className="px-3 py-1.5 text-red-700">{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DuplicatesBox({
  dups,
}: {
  dups: Array<{ row: number; email: string }>;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <p className="font-semibold">
        既に登録済みのメール {dups.length} 件はスキップされます
      </p>
      <ul className="mt-1 list-inside list-disc text-xs">
        {dups.slice(0, 5).map((d, i) => (
          <li key={i}>
            行 {d.row}: {d.email}
          </li>
        ))}
        {dups.length > 5 ? <li>… ほか {dups.length - 5} 件</li> : null}
      </ul>
    </div>
  );
}
