/**
 * src/sync.js
 * クラウド同期クライアント。
 *
 * 旧方式（SYNC_TOKEN）を廃止し、Google IDトークンを Authorization ヘッダーに載せる。
 * 401 レスポンスは SessionExpiredError として投げ、App.js でログイン画面に戻す。
 *
 * 重要: 同期に失敗してもローカル（AsyncStorage）のデータは消さない。
 */
import { SYNC_API_URL } from './config';
import { getIdToken } from './auth';

const API_URL = SYNC_API_URL;

let pushTimer = null;

/**
 * セッション切れエラー。
 * IDトークンが期限切れまたは無効な場合にスローされる。
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('セッションが切れました。再ログインしてください。');
    this.name = 'SessionExpiredError';
  }
}

/**
 * クラウドからデータを取得する（pull）。
 * レスポンスにはユーザー情報（user）も含まれる。
 */
export async function pullState() {
  const token = await getIdToken();
  if (!token) throw new SessionExpiredError();

  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);

  return res.json();
}

/**
 * クラウドにデータを保存する（push）。
 */
export async function pushState(state) {
  const token = await getIdToken();
  if (!token) throw new SessionExpiredError();

  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: state }),
  });

  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error(`Push failed: ${res.status}`);

  return res.json();
}

/**
 * デバウンス付きプッシュ。最後の呼び出しから2秒後にクラウドへ保存。
 * SessionExpiredError はコンソール警告のみ（ローカルデータは保持される）。
 *
 * @param {Function} onSessionExpired - セッション切れ時のコールバック（任意）
 */
export function debouncedPush(state, onSessionExpired) {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushState(state).catch((e) => {
      if (e instanceof SessionExpiredError && onSessionExpired) {
        onSessionExpired();
      } else {
        console.warn('Sync push failed:', e);
      }
    });
  }, 2000);
}
