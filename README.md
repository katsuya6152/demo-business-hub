# 業界横断 統合業務ハブ + AI問い合わせ機能 — Demo

中小企業の経営者が「Excel + メール + 紙の請求書」で管理している業務を、1つのWebアプリに統合したデモシステムです。商談から入金まで（顧客 → 案件 → 見積 → 請求 → 入金）を一気通貫で扱えます。

業種切替（IT受託 / 卸売 / コンサル）で異なるサンプルデータを瞬時に投入でき、AIに自然言語で「今月の売上は？」「未入金一覧」「TOP顧客は？」と尋ねると、localStorage 上の業務データを集計して回答します（実LLM API は使わずキーワードマッチング + 集計）。

## 公開URL

- 本番: https://demo.katsuya-suzuki.dev/business-hub *（Vercel連携後に公開）*

## 技術スタック

| カテゴリ | 採用 |
|---|---|
| フレームワーク | Next.js 16 (App Router) + TypeScript |
| スタイリング | Tailwind CSS v4 + shadcn/ui |
| アイコン | lucide-react |
| グラフ | Recharts |
| 状態管理 | zustand + persist (localStorage) |
| フォーム | react-hook-form + zod |
| 日付 | date-fns |
| Markdown | react-markdown |
| 通知 | sonner |
| テスト | vitest + @testing-library/react + jsdom |
| パッケージ管理 | pnpm |

## 起動方法

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## スクリプト

| コマンド | 用途 |
|---|---|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | 本番ビルド |
| `pnpm start` | 本番サーバー起動 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript 型チェック |
| `pnpm test` | Vitest 単発実行 |
| `pnpm test:watch` | Vitest watch モード |

## 設計書

実装は以下の設計書に準拠しています（リポジトリ外、社内資料）：

- `README.md` — スコープ・MUST/SHOULD/COULD・実装フェーズ
- `ui-spec.md` — 配色トークン・6画面のレイアウト・印刷CSS方針
- `data-model.md` — 6エンティティの型定義・集計ヘルパー・サンプルデータ規模
- `ai-mock-spec.md` — 18パターン・マッチングロジック・回答テンプレ

## データの扱い

- 完全モック。実DB・実LLM・認証なし
- データは localStorage に保存（`zustand persist`）
- 業種切替・データリセットは設定画面から実行可能

## Vercel デプロイ手順

*Phase 4 完了後に追記予定*

## ライセンス

このリポジトリはデモ目的で公開しています。
