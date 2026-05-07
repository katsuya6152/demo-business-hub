"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LostReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  defaultReason?: string;
};

export function LostReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  defaultReason = "",
}: LostReasonDialogProps) {
  // State is reset by remounting via the parent's `key` prop on each open.
  const [reason, setReason] = useState<string>(defaultReason);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>失注理由を入力</DialogTitle>
          <DialogDescription className="text-sm text-[var(--color-ink-500)]">
            この案件を失注として記録します。理由を入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="lost-reason">理由</Label>
          <Textarea
            id="lost-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="例：価格が合わなかった / 競合に決まった / プロジェクト凍結"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            失注として記録
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
