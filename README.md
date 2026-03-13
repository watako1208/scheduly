# Scheduly — セットアップ & デプロイ手順

## 概要

Next.js 14 (App Router) + Supabase (PostgreSQL) で動作する日程調整サービスです。
別デバイス・別ブラウザからでもデータが共有されます。

---

## STEP 1 — Supabase のセットアップ（5分）

### 1-1. プロジェクト作成

1. [supabase.com](https://supabase.com) にアクセスしてサインアップ（GitHub連携が楽）
2. 「New project」をクリック
3. プロジェクト名（例：`scheduly`）とデータベースパスワードを設定して作成
4. 作成完了まで1〜2分待つ

### 1-2. テーブル作成

1. 左メニューの「SQL Editor」を開く
2. `supabase/schema.sql` の内容をまるごとコピーして貼り付け
3. 「Run」をクリック → 緑のチェックが出れば成功

### 1-3. 環境変数を取得

1. 左メニューの「Project Settings」→「API」を開く
2. 以下の2つをメモ：
   - **Project URL**（例：`https://xxxx.supabase.co`）
   - **anon public** キー（長い文字列）

---

## STEP 2 — Vercel へデプロイ（5分）

### 2-1. GitHubにコードをアップロード

1. [github.com](https://github.com) でリポジトリを新規作成（例：`scheduly`）
2. このZIPを解凍してできた `scheduly/` フォルダの中身を全部アップロード
   - 「uploading an existing file」からドラッグ&ドロップ

### 2-2. Vercel でインポート

1. [vercel.com](https://vercel.com) にサインアップ（GitHub連携）
2. 「Add New → Project」→ 先ほどのリポジトリを選択 → 「Import」
3. **「Environment Variables」セクションに以下を追加：**

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | STEP 1-3 でコピーした Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | STEP 1-3 でコピーした anon public キー |

4. 「Deploy」をクリック
5. 2〜3分後にデプロイ完了 → URLが発行される（例：`https://scheduly-xxx.vercel.app`）

---

## ローカルで動かす場合

```bash
# 依存パッケージのインストール
npm install

# 環境変数ファイルを作成
cp .env.local.example .env.local
# → .env.local を開いて SUPABASE_URL と ANON_KEY を記入

# 開発サーバー起動
npm run dev
# → http://localhost:3000 で開く
```

---

## ファイル構成

```
scheduly/
├── app/
│   ├── page.tsx                        # イベント作成画面
│   ├── layout.tsx                      # 共通レイアウト
│   ├── globals.css                     # グローバルCSS
│   ├── create/complete/[eventId]/      # 作成完了・共有画面
│   ├── event/[eventId]/                # 参加入力画面
│   │   └── results/                    # 集計確認画面
│   └── api/
│       ├── events/                     # POST: イベント作成
│       ├── events/[eventId]/           # GET: イベント取得
│       ├── participants/               # POST: 参加者登録
│       ├── participants/[id]/          # PUT: 参加者更新
│       └── participants/verify/        # POST: パスワード照合
├── components/
│   └── TimeGrid.tsx                    # 時間帯グリッド
├── lib/
│   ├── supabase.ts                     # Supabaseクライアント
│   ├── utils.ts                        # スロット生成・結合ロジック
│   └── types.ts                        # 型定義
├── supabase/
│   └── schema.sql                      # ← Supabaseで実行するSQL
├── .env.local.example                  # 環境変数テンプレート
└── README.md                           # この手順書
```

---

## トラブルシューティング

| 症状 | 原因と対処 |
|------|-----------|
| イベント作成時に「サーバーエラー」 | 環境変数が正しく設定されているか確認。VercelのProject Settings → Environment Variables |
| 「イベントが見つかりません」 | Supabaseのschema.sqlが正しく実行されているか確認 |
| QRコードが保存できない | iOSのSafariでは動作制限あり。Chrome推奨 |
| デプロイ後に画面が真っ白 | Vercelのビルドログを確認。型エラーがある場合はtsconfig.jsonのstrictをfalseに |
