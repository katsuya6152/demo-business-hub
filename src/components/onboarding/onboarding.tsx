"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resetAllData } from "@/lib/store";
import {
  type Industry,
  INDUSTRIES,
  INDUSTRY_LABELS,
  INDUSTRY_EMOJIS,
} from "@/lib/types/industry";
import { cn } from "@/lib/utils";

const INDUSTRY_HINTS: Record<Industry, string> = {
  "it-services":
    "管理画面開発・SaaS導入支援などの受託案件。1案件 50〜200万円規模、フェーズ別の見積。",
  wholesale:
    "食品スーパー・レストラン向け定期発注。月次/週次の高頻度取引、商品単位の明細。",
  consulting:
    "管理職研修・人事制度設計など士業/コンサル案件。月額顧問契約、80〜500万円のハイレンジ。",
};

export function Onboarding() {
  const router = useRouter();
  const [selected, setSelected] = useState<Industry>("it-services");
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    resetAllData(selected);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg-soft)] py-16 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-600)]">
            業界横断 統合業務ハブ — Demo
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[var(--color-ink-950)]">
            まずは業種を選んでください
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-500)]">
            選んだ業種に合わせて、過去6ヶ月分のサンプルデータが投入されます。
            あとから設定画面で切り替え可能です。
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {INDUSTRIES.map((ind) => {
            const isActive = selected === ind;
            return (
              <button
                key={ind}
                type="button"
                onClick={() => setSelected(ind)}
                aria-pressed={isActive}
                className={cn(
                  "text-left transition-all",
                  isActive ? "scale-[1.02]" : "hover:scale-[1.01]",
                )}
              >
                <Card
                  className={cn(
                    "h-full p-5 transition-shadow",
                    isActive
                      ? "border-[var(--color-accent-600)] shadow-md ring-2 ring-[var(--color-accent-200)]"
                      : "border-[var(--color-line)] hover:shadow-sm",
                  )}
                >
                  <div className="text-3xl">{INDUSTRY_EMOJIS[ind]}</div>
                  <p className="mt-2 text-base font-semibold text-[var(--color-ink-950)]">
                    {INDUSTRY_LABELS[ind]}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-500)]">
                    {INDUSTRY_HINTS[ind]}
                  </p>
                </Card>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            onClick={start}
            disabled={busy}
            className="min-w-48"
          >
            {busy ? "セットアップ中..." : "このデータで始める"}
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-ink-500)]">
          実DB・実LLM・認証なしの完全モック。データはブラウザの localStorage
          に保存されます。
        </p>
      </div>
    </main>
  );
}
