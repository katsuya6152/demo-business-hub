"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/shared/skeleton";
import { useMounted } from "@/hooks/use-mounted";
import { useSettingsStore } from "@/lib/store/settings";
import { resetAllData, clearAllData } from "@/lib/store";
import {
  useLlmConfigStore,
  LLM_PROVIDER_LABELS,
  LLM_DEFAULT_MODELS,
  isLlmReady,
  type LlmProvider,
} from "@/lib/ai/llm-config";
import { testLlmConnection } from "@/lib/ai/llm-client";
import { Sparkles } from "lucide-react";
import {
  type Industry,
  INDUSTRIES,
  INDUSTRY_LABELS,
  INDUSTRY_EMOJIS,
} from "@/lib/types/industry";

const companySchema = z.object({
  name: z.string().min(1, "会社名を入力してください"),
  postalCode: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string().email("メール形式が不正です"),
  invoiceRegistrationNumber: z.string(),
  bankInfo: z.string(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function SettingsPage() {
  const mounted = useMounted();
  const settings = useSettingsStore((s) => s.settings);
  const meta = useSettingsStore((s) => s.meta);
  const updateCompany = useSettingsStore((s) => s.updateCompany);
  const [pendingIndustry, setPendingIndustry] = useState<Industry | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const llmConfig = useLlmConfigStore((s) => s.config);
  const setLlmProvider = useLlmConfigStore((s) => s.setProvider);
  const setLlmApiKey = useLlmConfigStore((s) => s.setApiKey);
  const setLlmModel = useLlmConfigStore((s) => s.setModel);
  const [apiKeyDraft, setApiKeyDraft] = useState(llmConfig.apiKey);
  const [modelDraft, setModelDraft] = useState(
    llmConfig.model || LLM_DEFAULT_MODELS[llmConfig.provider],
  );
  const [testing, setTesting] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: settings.company,
    values: settings.company,
  });

  if (!mounted) {
    return (
      <AppShell>
        <div className="max-w-3xl space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-64" />
          </div>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  const onSaveCompany = form.handleSubmit((values) => {
    updateCompany(values);
    toast.success("自社情報を保存しました");
  });

  const handleIndustryChange = (next: Industry | null) => {
    if (!next || next === settings.industry) return;
    setPendingIndustry(next);
  };

  const confirmIndustrySwitch = () => {
    if (!pendingIndustry) return;
    resetAllData(pendingIndustry);
    toast.success(
      `${INDUSTRY_LABELS[pendingIndustry]} のデータに切り替えました`,
    );
    setPendingIndustry(null);
  };

  const handleReset = () => {
    resetAllData(settings.industry);
    toast.success(
      `${INDUSTRY_LABELS[settings.industry]} のサンプルデータでリセットしました`,
    );
  };

  const handleClear = () => {
    clearAllData();
    toast.success(
      "全データを削除しました。オンボーディングからやり直してください",
    );
  };

  const handleProviderChange = (next: LlmProvider | null) => {
    if (!next) return;
    setLlmProvider(next);
    setModelDraft(LLM_DEFAULT_MODELS[next] || "");
  };

  const handleSaveLlm = () => {
    setLlmApiKey(apiKeyDraft.trim());
    setLlmModel(modelDraft.trim());
    toast.success("AI 設定を保存しました");
  };

  const handleTestLlm = async () => {
    setTesting(true);
    const ok = await testLlmConnection({
      ...llmConfig,
      apiKey: apiKeyDraft.trim(),
      model: modelDraft.trim(),
    });
    setTesting(false);
    if (ok) {
      toast.success(
        llmConfig.provider === "offline"
          ? "オフラインモードで動作中です"
          : `${LLM_PROVIDER_LABELS[llmConfig.provider]} の設定が確認できました`,
      );
    } else {
      toast.error("API キーが未入力です");
    }
  };

  const llmReady = isLlmReady({
    ...llmConfig,
    apiKey: apiKeyDraft.trim(),
  });

  return (
    <AppShell>
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
            設定
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">
            業種の切替、自社情報の編集、データ管理ができます。
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-[var(--color-ink-950)]">
            業種設定
          </h2>
          <p className="mt-1 text-xs text-[var(--color-ink-500)]">
            現在: {INDUSTRY_EMOJIS[settings.industry]}{" "}
            {INDUSTRY_LABELS[settings.industry]}
          </p>
          <Separator className="my-4" />
          <div className="flex items-center gap-3">
            <Label className="text-sm">業種を変更:</Label>
            <Select
              value={settings.industry}
              onValueChange={handleIndustryChange}
            >
              <SelectTrigger className="w-56">
                <SelectValue>
                  <span className="mr-2">
                    {INDUSTRY_EMOJIS[settings.industry]}
                  </span>
                  {INDUSTRY_LABELS[settings.industry]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    <span className="mr-2">{INDUSTRY_EMOJIS[ind]}</span>
                    {INDUSTRY_LABELS[ind]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-[var(--color-ink-950)]">
            自社情報（請求書・見積書のヘッダ）
          </h2>
          <Separator className="my-4" />
          <form onSubmit={onSaveCompany} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="name">会社名 *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="postalCode">郵便番号</Label>
              <Input id="postalCode" {...form.register("postalCode")} />
            </div>
            <div>
              <Label htmlFor="phone">電話</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">住所</Label>
              <Input id="address" {...form.register("address")} />
            </div>
            <div>
              <Label htmlFor="email">メール *</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="invoiceRegistrationNumber">
                インボイス登録番号
              </Label>
              <Input
                id="invoiceRegistrationNumber"
                {...form.register("invoiceRegistrationNumber")}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="bankInfo">振込先</Label>
              <Input id="bankInfo" {...form.register("bankInfo")} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">保存</Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-accent-600)]" />
            <h2 className="text-base font-semibold text-[var(--color-ink-950)]">
              AI 設定
            </h2>
            <span
              className={
                llmReady && llmConfig.provider !== "offline"
                  ? "ml-auto inline-flex items-center rounded-full bg-[var(--color-cyan-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-cyan-700)]"
                  : "ml-auto inline-flex items-center rounded-full bg-[var(--color-ink-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-ink-500)]"
              }
            >
              {llmConfig.provider === "offline"
                ? "オフライン"
                : llmReady
                  ? "API 接続準備完了"
                  : "API キー未設定"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-ink-500)]">
            ダッシュボードの AI 質問・インサイトの生成方式を選択します。
          </p>
          <Separator className="my-4" />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="llm-provider" className="text-sm">
                プロバイダ
              </Label>
              <Select
                value={llmConfig.provider}
                onValueChange={(v) =>
                  handleProviderChange((v as LlmProvider | null) ?? null)
                }
              >
                <SelectTrigger id="llm-provider" className="w-full md:w-72">
                  <SelectValue>
                    {LLM_PROVIDER_LABELS[llmConfig.provider]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">
                    {LLM_PROVIDER_LABELS.offline}
                  </SelectItem>
                  <SelectItem value="anthropic">
                    {LLM_PROVIDER_LABELS.anthropic}
                  </SelectItem>
                  <SelectItem value="openai">
                    {LLM_PROVIDER_LABELS.openai}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {llmConfig.provider !== "offline" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="llm-api-key" className="text-sm">
                    API キー
                  </Label>
                  <Input
                    id="llm-api-key"
                    type="password"
                    autoComplete="off"
                    value={apiKeyDraft}
                    onChange={(e) => setApiKeyDraft(e.target.value)}
                    placeholder={
                      llmConfig.provider === "anthropic"
                        ? "sk-ant-..."
                        : "sk-..."
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="llm-model" className="text-sm">
                    モデル
                  </Label>
                  <Input
                    id="llm-model"
                    value={modelDraft}
                    onChange={(e) => setModelDraft(e.target.value)}
                    placeholder={LLM_DEFAULT_MODELS[llmConfig.provider]}
                  />
                </div>
              </>
            ) : null}

            <div className="rounded-md bg-[var(--color-bg-soft)] p-3 text-xs text-[var(--color-ink-700)]">
              ⓘ API キーはブラウザの localStorage にのみ保存され、外部サーバーには送信されません。デモ環境のため実際の API 呼び出しは行わず、応答はキーワードマッチング結果に「{LLM_PROVIDER_LABELS[llmConfig.provider]} 経由」を付記して返します。
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSaveLlm}>保存</Button>
              <Button
                variant="outline"
                onClick={handleTestLlm}
                disabled={testing}
              >
                {testing ? "テスト中..." : "テスト接続"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-[var(--color-ink-950)]">
            データ管理
          </h2>
          <p className="mt-1 text-xs text-[var(--color-ink-500)]">
            最終リセット:{" "}
            {meta.lastResetAt
              ? format(parseISO(meta.lastResetAt), "yyyy-MM-dd HH:mm")
              : "未実施"}
          </p>
          <Separator className="my-4" />
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setResetOpen(true)}
            >
              現在の業種でデータをリセット
            </Button>
            <Button
              variant="destructive"
              onClick={() => setClearOpen(true)}
            >
              全データを削除（オンボーディングへ）
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-[var(--color-ink-950)]">
            デモ情報
          </h2>
          <Separator className="my-4" />
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--color-ink-500)]">
                バージョン
              </dt>
              <dd className="mt-0.5 text-[var(--color-ink-950)]">
                Phase 2 (Demo)
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--color-ink-500)]">
                ソースリポジトリ
              </dt>
              <dd className="mt-0.5">
                <a
                  href="https://github.com/katsuya6152/demo-business-hub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent-600)] underline"
                >
                  github.com/katsuya6152/demo-business-hub
                </a>
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <ConfirmDialog
        open={pendingIndustry !== null}
        onOpenChange={(open) => !open && setPendingIndustry(null)}
        title="業種を切り替えますか？"
        description={
          pendingIndustry ? (
            <>
              現在のデータがすべてリセットされ、
              <strong> {INDUSTRY_LABELS[pendingIndustry]} </strong>
              のサンプルデータに置き換わります。
            </>
          ) : null
        }
        confirmLabel="切り替える"
        variant="destructive"
        onConfirm={confirmIndustrySwitch}
      />
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="現在の業種でデータをリセット"
        description="現在のデータがすべて初期サンプルデータに置き換わります。"
        confirmLabel="リセットする"
        variant="destructive"
        onConfirm={handleReset}
      />
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="全データを削除"
        description="全データが削除され、オンボーディング画面に戻ります。"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleClear}
      />
    </AppShell>
  );
}
