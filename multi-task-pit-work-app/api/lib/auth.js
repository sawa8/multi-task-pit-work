/**
 * api/lib/auth.js
 * サーバー側の共通処理をまとめたモジュール。
 * - CORS制御
 * - Turso (libSQL) クライアント生成
 * - Google IDトークンの検証とユーザー登録/更新
 * - 管理者権限チェック
 */
import { createClient } from '@libsql/client';
import { OAuth2Client } from 'google-auth-library';

// ───────── Turso クライアント（モジュールスコープで使い回す） ─────────
let _tursoClient = null;

/**
 * Turso (libSQL) のクライアントを取得する。
 * 一度生成したら使い回すことで、接続の無駄を省く。
 */
export function getTursoClient() {
  if (!_tursoClient) {
    _tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _tursoClient;
}

// ───────── CORS ─────────

/**
 * CORSヘッダーを設定する。
 * ALLOWED_ORIGIN に指定されたオリジンのみ許可する（* は使わない）。
 * OPTIONSリクエスト（プリフライト）には 204 を返して終了する。
 *
 * @returns {boolean} OPTIONSリクエストで終了した場合 true
 */
export function handleCors(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || 'https://multi-task-pit-work-app.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // リクエスト処理を終了したことを呼び出し元に伝える
  }
  return false;
}

// ───────── Google IDトークン検証 ─────────

// Google OAuth2 クライアント（IDトークンの署名検証に使う）
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * リクエストの Authorization ヘッダーから Google IDトークンを取り出し、
 * 署名を検証してユーザー情報を返す。
 *
 * 新規ユーザーは自動でDBに登録される。
 * ADMIN_EMAILS に含まれるメールアドレスは管理者（admin）として登録される。
 * status が 'disabled' のユーザーはアクセスを拒否される。
 *
 * @returns {Object} { id, email, name, picture, role, status }
 * @throws {Object} { status: number, message: string } 認証失敗時
 */
export async function authenticate(req) {
  // 1. Authorization ヘッダーからトークンを取り出す
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.replace('Bearer ', '');
  if (!idToken) {
    throw { status: 401, message: 'IDトークンが必要です' };
  }

  // 2. Google の公開鍵でIDトークンの署名を検証する
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (e) {
    console.error('IDトークン検証失敗:', e.message);
    throw { status: 401, message: 'IDトークンが無効です' };
  }

  // 3. メールアドレスが確認済みかチェック
  if (!payload.email_verified) {
    throw { status: 403, message: 'メールアドレスが未確認です' };
  }

  const db = getTursoClient();
  const sub = payload.sub;          // GoogleのユニークID
  const email = payload.email;
  const name = payload.name || '';
  const picture = payload.picture || '';
  const now = new Date().toISOString();

  // 4. DBにユーザーが存在するか確認
  const existing = await db.execute({
    sql: 'SELECT id, email, name, picture, role, status FROM users WHERE id = ?',
    args: [sub],
  });

  if (existing.rows.length === 0) {
    // ── 新規ユーザーの登録 ──
    // ADMIN_EMAILS（カンマ区切り）に含まれるメールなら admin、それ以外は user
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase());
    const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

    await db.execute({
      sql: `INSERT INTO users (id, email, name, picture, role, status, created_at, last_login_at)
            VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
      args: [sub, email, name, picture, role, now, now],
    });

    return { id: sub, email, name, picture, role, status: 'active' };
  }

  // ── 既存ユーザーの情報を更新 ──
  await db.execute({
    sql: `UPDATE users SET email = ?, name = ?, picture = ?, last_login_at = ? WHERE id = ?`,
    args: [email, name, picture, now, sub],
  });

  const user = existing.rows[0];

  // 5. 無効化されたユーザーはアクセス拒否
  if (user.status === 'disabled') {
    throw { status: 403, message: '管理者によって利用が停止されています' };
  }

  return {
    id: user.id,
    email,
    name,
    picture,
    role: user.role,
    status: user.status,
  };
}

// ───────── 管理者権限チェック ─────────

/**
 * ユーザーが管理者（admin）であることを確認する。
 * admin でなければ 403 エラーを投げる。
 */
export function requireAdmin(user) {
  if (user.role !== 'admin') {
    throw { status: 403, message: '管理者権限が必要です' };
  }
}
