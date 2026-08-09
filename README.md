# MULTI-TASK PIT WORK

複数案件を並行管理するTodoアプリ。

## Demo

https://multi-task-pit-work-app.vercel.app

## 主な機能

- タスク管理（追加・編集・削除・複製）
- 「今日やる」「あとで」の2カラム表示
- ポモドーロタイマー（25分/5分）
- ダッシュボード（完了数・稼働時間・完了率・容量バー）
- フォーカスピン・サブタスク・優先度・締切警告
- 案件別カラー自動割当・稼働集計
- 日次ふり返りレポート・共有機能
- クラウド同期（ブラウザ・Web・スマホ間でデータ共有）

## 技術スタック

| 項目 | 技術 |
|------|------|
| モバイル/Web | React Native (Expo SDK 54) |
| ブラウザ版 | 単一HTML（anken-todo.html） |
| デプロイ | Vercel（PWA対応） |
| API | Vercel Serverless Functions |
| データベース | Turso (LibSQL/SQLite) |
| ローカル保存 | AsyncStorage / localStorage |

## 構成

```
anken-todo.html          … ブラウザ単体版
multi-task-pit-work-app/ … Expo版（モバイル/Web）
  ├── App.js             … メインアプリ
  ├── api/sync.js        … クラウド同期API
  ├── src/components/    … UIコンポーネント群
  ├── src/sync.js        … 同期クライアント
  ├── src/theme.js       … デザインシステム
  └── src/utils.js       … ユーティリティ
```

## セットアップ

```bash
cd multi-task-pit-work-app
npm install
npx expo start --tunnel   # スマホ実機確認（Expo Go）
npx expo start --web      # Webブラウザ確認
```

クラウド同期を使う場合は `src/config.example.js` を `src/config.js` にコピーし、Turso/Syncの認証情報を設定してください。
