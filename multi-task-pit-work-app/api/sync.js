/**
 * api/sync.js
 * タスクデータの同期API。
 *
 * GET  — ログイン中ユーザーのデータを取得
 * PUT  — ログイン中ユーザーのデータを保存
 *
 * 認証: Authorization ヘッダーに Google IDトークンを載せる。
 * 旧方式の SYNC_SECRET は廃止。
 */
import { handleCors, authenticate, getTursoClient } from './lib/auth.js';

export default async function handler(req, res) {
  // CORS処理（OPTIONSならここで終了）
  if (handleCors(req, res)) return;

  try {
    // Google IDトークンを検証し、ユーザー情報を取得
    const user = await authenticate(req);
    const db = getTursoClient();

    if (req.method === 'GET') {
      // ── ユーザー自身のデータを取得 ──
      const result = await db.execute({
        sql: 'SELECT data, updated_at FROM app_state WHERE user_id = ?',
        args: [user.id],
      });

      // 新規ユーザーはデータが無い → 空の状態を返す（404ではない）
      const row = result.rows[0] || null;
      return res.json({
        data: row ? JSON.parse(row.data) : null,
        updated_at: row ? row.updated_at : null,
        user: { email: user.email, name: user.name, picture: user.picture, role: user.role },
      });
    }

    if (req.method === 'PUT') {
      // ── ユーザー自身のデータを保存 ──
      const { data } = req.body;
      if (!data) return res.status(400).json({ error: 'データが必要です' });

      const now = new Date().toISOString();
      // UPSERT: 既存なら更新、無ければ新規挿入
      await db.execute({
        sql: `INSERT INTO app_state (user_id, data, updated_at)
              VALUES (?, ?, ?)
              ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
        args: [user.id, JSON.stringify(data), now],
      });

      return res.json({ ok: true, updated_at: now });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    // authenticate() が投げる認証エラー（status プロパティを持つ）
    if (e.status) {
      return res.status(e.status).json({ error: e.message });
    }
    // 予期しないエラー（詳細はサーバーログにのみ出力）
    console.error('Sync error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
