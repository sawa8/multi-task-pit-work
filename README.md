# MULTI-TASK PIT WORK

複数案件を並行管理するTodoアプリ。

## Demo

https://multi-task-pit-work-app.vercel.app

## 主な機能

- Googleアカウントでログイン（ユーザーごとにデータ分離）
- タスク管理（追加・編集・削除・複製）
- 「今日やる」「あとで」の2カラム表示
- ポモドーロタイマー（25分/5分）
- ダッシュボード（完了数・稼働時間・完了率・容量バー）
- フォーカスピン・サブタスク・優先度・締切警告
- 案件別カラー自動割当・稼働集計
- 日次ふり返りレポート・共有機能
- クラウド同期（ログインユーザーごとにデータ保存）
- 管理者によるユーザー管理（一覧・無効化・削除）

## 技術スタック

| 項目 | 技術 |
|------|------|
| モバイル/Web | React Native (Expo SDK 54) |
| ブラウザ版 | 単一HTML（anken-todo.html） |
| 認証 | Google Identity Services + google-auth-library |
| デプロイ | Vercel（PWA対応） |
| API | Vercel Serverless Functions |
| データベース | Turso (LibSQL/SQLite) |
| ローカル保存 | AsyncStorage / localStorage |

## 構成

```
anken-todo.html          … ブラウザ単体版
multi-task-pit-work-app/ … Expo版（モバイル/Web）
  ├── App.js             … メインアプリ（ログインゲート付き）
  ├── api/sync.js        … クラウド同期API（ユーザー別データ）
  ├── api/admin/users.js … 管理者API（ユーザー管理）
  ├── api/lib/auth.js    … サーバー側認証・権限チェック
  ├── src/auth.js        … クライアント側Google認証
  ├── src/components/    … UIコンポーネント群
  ├── src/sync.js        … 同期クライアント
  ├── src/theme.js       … デザインシステム
  └── src/utils.js       … ユーティリティ
```

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd multi-task-pit-work-app
npm install
```

### 2. Google Cloud Console でOAuthクライアントIDを取得

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 「APIとサービス」→「OAuth同意画面」を設定（外部、スコープは email/profile/openid）
3. 「認証情報」→「OAuthクライアントID」を作成（ウェブアプリケーション）
4. 承認済みのJavaScript生成元に以下を追加:
   - `https://multi-task-pit-work-app.vercel.app`
   - `http://localhost:8081`

### 3. 環境変数の設定

`.env.example` を参考に、Vercelの環境変数に以下を設定:

| 変数名 | 説明 |
|--------|------|
| `TURSO_DATABASE_URL` | Turso接続URL |
| `TURSO_AUTH_TOKEN` | Turso認証トークン |
| `GOOGLE_CLIENT_ID` | Google OAuthクライアントID |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | 同上（クライアント側用） |
| `ADMIN_EMAILS` | 管理者メールアドレス（カンマ区切り） |
| `ALLOWED_ORIGIN` | CORS許可オリジン |

### 4. DBマイグレーション

`db/migration.sql` をTurso CLIまたはWeb UIで実行してください。

### 5. 開発サーバー起動

```bash
npx expo start --tunnel   # スマホ実機確認（Expo Go）
npx expo start --web      # Webブラウザ確認
```
