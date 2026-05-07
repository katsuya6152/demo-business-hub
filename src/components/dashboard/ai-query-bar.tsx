"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const QUICK_QUESTIONS = [
  "今月の売上は？",
  "未入金一覧",
  "商談中の案件",
  "TOP顧客は？",
  "新規顧客",
  "成約率",
];

export function AiQueryBar() {
  const [query, setQuery] = useState("");

  return (
    <Card className="p-5 bg-gradient-to-br from-[var(--color-accent-50)] to-white border-[var(--color-accent-200)]">
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <p className="text-sm font-semibold text-[var(--color-ink-950)]">
          業務データに自然言語で質問できます
        </p>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Phase 3 で実装
        </Badge>
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例: 今月の売上は？"
          className="h-12 bg-white text-base"
          disabled
        />
        <Button type="submit" size="lg" disabled className="h-12">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map((q) => (
          <Badge
            key={q}
            variant="outline"
            className="cursor-not-allowed bg-white text-xs opacity-60"
          >
            {q}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
