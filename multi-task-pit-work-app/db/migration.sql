-- ============================================================
-- PIT WORK: ユーザー認証・データ分離マイグレーション
-- 実行方法: Turso CLI または Turso Web UI でコピペ実行
-- ============================================================

-- 1. 既存の app_state テーブルを退避（旧データを保持）
ALTER TABLE app_state RENAME TO app_state_legacy;

-- 2. ユーザーテーブルを作成
--    Google ログインで取得できる情報を保存する
CREATE TABLE users (
  id            TEXT PRIMARY KEY,                    -- Google の subject ID (sub)
  email         TEXT UNIQUE NOT NULL,                -- メールアドレス
  name          TEXT,                                -- 表示名
  picture       TEXT,                                -- プロフィール画像URL
  role          TEXT NOT NULL DEFAULT 'user',         -- 'user' または 'admin'
  status        TEXT NOT NULL DEFAULT 'active',       -- 'active' または 'disabled'
  created_at    TEXT NOT NULL,                        -- 登録日時 (ISO 8601)
  last_login_at TEXT                                  -- 最終ログイン日時
);

-- 3. ユーザーごとのアプリ状態テーブルを作成
--    ユーザーが削除されたら紐づくデータも自動で削除される (CASCADE)
CREATE TABLE app_state (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,                          -- タスクデータ (JSON)
  updated_at TEXT NOT NULL                           -- 最終更新日時 (ISO 8601)
);

-- ============================================================
-- 4. 旧データを自分のアカウントへ移行する手順（ログイン後に実行）
--
-- ログイン後、Turso CLI で以下を実行してください。
-- <YOUR_GOOGLE_SUB_ID> は、最初にログインした際に users テーブルに
-- 作成される自分の id（Google sub）に置き換えてください。
--
--   INSERT INTO app_state (user_id, data, updated_at)
--   SELECT '<YOUR_GOOGLE_SUB_ID>', data, updated_at
--   FROM app_state_legacy
--   WHERE id = 1;
--
-- 移行が確認できたら、旧テーブルを削除できます:
--   DROP TABLE app_state_legacy;
-- ============================================================
