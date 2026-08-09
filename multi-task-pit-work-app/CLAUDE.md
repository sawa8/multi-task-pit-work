# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MULTI-TASK PIT WORK — 複数案件を並行管理するTodoアプリ。React Native (Expo SDK 54) のモバイル/Web版と、ブラウザ単体版（anken-todo.html）の2系統が存在し、Tursoクラウド同期で接続されている。UIは日本語。

## Build & Run Commands

```bash
npx expo start              # 開発サーバー起動（Expo Go で実機確認）
npx expo start --tunnel     # トンネルモード（Wi-Fi不一致時）
npx expo start --web        # Web版ローカル起動
npx expo export --platform web  # Web静的ビルド → dist/
vercel deploy --prod --yes  # Vercelプロダクションデプロイ
```

## Architecture

### 2つのクライアント + 1つのAPI

```
anken-todo.html（ブラウザ版・単体HTML）──┐
                                          ├── /api/sync (GET/PUT) ── Turso DB
multi-task-pit-work-app/（Expo版）────────┘
```

- **ブラウザ版** (`../anken-todo.html`): 単一HTMLファイル。localStorage + クラウド同期。
- **Expo版** (`App.js`): React Native。AsyncStorage + クラウド同期。
- **API** (`api/sync.js`): Vercel Serverless Function。Turso (LibSQL) に全状態をJSON 1行で保存。

### State構造（両バージョン共通）

ストレージキー: `anken_todo_md_v1`

```js
{ tasks: [], ankenColors: {}, focusId: null, sortBy: 'deadline', capacity: 360, pomo: {} }
```

タスク: `{ id, title, anken, proj, pri, bucket, est, min, target, deadline, subs:[{t,done}], done, doneAt, createdAt }`

### データフロー

1. 起動時: ローカルロード → クラウドからpull（成功すればクラウド優先）
2. 変更時: ローカル保存 → debounce 2秒後にクラウドへpush
3. オフライン時: ローカルのみで動作（sync失敗は静かに無視）

### コンポーネント構成（src/components/）

App.js が全状態を管理し、各コンポーネントにpropsで渡すフラットな構成。Context/Reduxは不使用。

- `Dashboard` — 統計タイル（完了数・稼働時間・完了率・容量バー）
- `Pomodoro` — 25/5分タイマー（SVGリング）
- `FocusCard` — ピン留めタスク表示
- `TaskCard` — タスク行（サブタスク・バッジ・アクション）
- `TaskModal` — タスク追加/編集フォーム
- `ReviewModal` — 日次ふり返り + Share API
- `DuplicateModal` — 過去タスク検索・複製
- `DoneList` — 完了済みタスク一覧
- `AnkenSummary` — 案件別稼働集計

### 環境変数（Vercel）

- `TURSO_DATABASE_URL` — Turso接続URL
- `TURSO_AUTH_TOKEN` — Turso認証トークン
- `SYNC_SECRET` — API Bearer トークン

### クライアント側の認証情報

- `src/config.js`（gitignore対象）にSyncトークンを保管
- セットアップ時は `src/config.example.js` をコピーして値を設定
- ブラウザ版（anken-todo.html）はlocalStorageにトークンを保管（🔑ボタンで設定）

## デザインシステム（src/theme.js）

クリーム基調: 背景`#F4E9DE`、カード`#FFFCF7`、アクセント: ピンク`#ED8C72` + ブルー`#2987BC`。案件ごとに8色パレットから自動割当。

## 両バージョンの同期ルール

機能変更時は **Expo版（App.js + components）と ブラウザ版（anken-todo.html）の両方** を更新すること。状態構造・ストレージキー・sync APIは共通仕様。

## 注意事項

- Chrome自動翻訳対策済み（`lang="ja"` + `notranslate`メタタグ）。Web向け変更時は維持すること。
- Expo SDK 54 を使用（Expo Go の対応バージョンに合わせるため）。SDK更新時はExpo Goとの互換性を確認。
- Syncトークンはコードにハードコードしないこと（`src/config.js` はgitignore済み）。

## デプロイ先

- **Web版**: https://multi-task-pit-work-app.vercel.app
- **Sync API**: https://multi-task-pit-work-app.vercel.app/api/sync
- **GitHub**: https://github.com/sawa8/multi-task-pit-work
