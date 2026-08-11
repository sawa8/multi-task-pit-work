/**
 * api/admin/users.js
 * 管理者専用のユーザー管理API。
 *
 * GET    — ユーザー一覧を取得（最終同期日時付き）
 * PATCH  — ユーザーの status を変更（active / disabled）
 * DELETE — ユーザーとそのデータを削除
 *
 * すべてのリクエストに管理者権限（role = 'admin'）が必要。
 */
import { handleCors, authenticate, requireAdmin, getTursoClient } from '../lib/auth.js';

export default async function handler(req, res) {
  // CORS処理
  if (handleCors(req, res)) return;

  try {
    // 認証 + 管理者権限チェック
    const user = await authenticate(req);
    requireAdmin(user);

    const db = getTursoClient();

    // ── GET: ユーザー一覧 ──
    if (req.method === 'GET') {
      const result = await db.execute(`
        SELECT
          u.id, u.email, u.name, u.picture, u.role, u.status,
          u.created_at, u.last_login_at,
          a.updated_at AS last_sync_at
        FROM users u
        LEFT JOIN app_state a ON u.id = a.user_id
        ORDER BY u.created_at ASC
      `);
      return res.json({ users: result.rows });
    }

    // ── PATCH: ユーザーの有効化/無効化 ──
    if (req.method === 'PATCH') {
      const { userId, status } = req.body;

      // status は 'active' か 'disabled' のみ許可
      if (!userId || !['active', 'disabled'].includes(status)) {
        return res.status(400).json({ error: 'userId と status（active/disabled）が必要です' });
      }

      // 安全装置: 自分自身の無効化を禁止
      if (user.id === userId) {
        return res.status(400).json({ error: '自分自身のステータスは変更できません' });
      }

      // 安全装置: 管理者の無効化を禁止
      const target = await db.execute({
        sql: 'SELECT role FROM users WHERE id = ?',
        args: [userId],
      });
      if (target.rows.length === 0) {
        return res.status(404).json({ error: 'ユーザーが見つかりません' });
      }
      if (target.rows[0].role === 'admin') {
        return res.status(400).json({ error: '管理者のステータスは変更できません' });
      }

      await db.execute({
        sql: 'UPDATE users SET status = ? WHERE id = ?',
        args: [status, userId],
      });
      return res.json({ ok: true });
    }

    // ── DELETE: ユーザー削除 ──
    if (req.method === 'DELETE') {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId クエリパラメータが必要です' });
      }

      // 安全装置: 自分自身の削除を禁止
      if (user.id === userId) {
        return res.status(400).json({ error: '自分自身は削除できません' });
      }

      // 安全装置: 管理者の削除を禁止
      const target = await db.execute({
        sql: 'SELECT role FROM users WHERE id = ?',
        args: [userId],
      });
      if (target.rows.length === 0) {
        return res.status(404).json({ error: 'ユーザーが見つかりません' });
      }
      if (target.rows[0].role === 'admin') {
        return res.status(400).json({ error: '管理者は削除できません' });
      }

      // CASCADE により app_state のデータも自動削除される
      await db.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [userId],
      });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({ error: e.message });
    }
    console.error('Admin API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
