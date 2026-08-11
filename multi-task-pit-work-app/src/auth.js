/**
 * src/auth.js
 * クライアント側の Google 認証モジュール（Web専用）。
 *
 * Google Identity Services (GIS) を使い、IDトークンを取得する。
 * IDトークンは AsyncStorage（Webではlocalstorageと同等）に保存し、
 * API呼び出し時に Authorization ヘッダーに載せる。
 *
 * トークンの有効期限は約1時間。期限切れなら null を返し、
 * アプリ側でログイン画面に戻す。
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage に保存するキー
const TOKEN_KEY = 'pitwork_id_token';

// Google Client ID（環境変数から取得。Expo では EXPO_PUBLIC_ プレフィックス付き）
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

// ───────── GIS スクリプト読み込み ─────────

let scriptLoaded = false;

/**
 * Google Identity Services のスクリプトを動的に読み込む。
 * index.html を編集せず、JavaScriptだけで完結する。
 * すでに読み込み済みなら何もしない。
 */
export function loadGoogleScript() {
  if (Platform.OS !== 'web') {
    throw new Error('Google認証はWeb版のみ対応しています');
    // TODO: expo-auth-session でネイティブ対応
  }

  return new Promise((resolve, reject) => {
    // すでに読み込み済み
    if (scriptLoaded && window.google?.accounts?.id) {
      resolve();
      return;
    }

    // すでに <script> タグが存在するか確認
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => { scriptLoaded = true; resolve(); });
      if (window.google?.accounts?.id) { scriptLoaded = true; resolve(); }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Google認証スクリプトの読み込みに失敗しました'));
    document.head.appendChild(script);
  });
}

// ───────── GIS 初期化・ボタン描画 ─────────

/**
 * Google Identity Services を初期化する。
 * ログイン成功時に onCredential コールバックが呼ばれる。
 *
 * @param {Function} onCredential - (response) => void。response.credential に IDトークンが入る
 */
export function initGoogleAuth(onCredential) {
  if (Platform.OS !== 'web') {
    throw new Error('Google認証はWeb版のみ対応しています');
    // TODO: expo-auth-session でネイティブ対応
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: onCredential,
  });
}

/**
 * 指定したDOM要素に Google ログインボタンを描画する。
 *
 * @param {HTMLElement} element - ボタンを描画する要素
 */
export function renderGoogleButton(element) {
  if (Platform.OS !== 'web') return;

  google.accounts.id.renderButton(element, {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'pill',
    width: 280,
  });
}

/**
 * ログアウト。保存済みトークンを破棄し、自動ログインを無効化する。
 */
export async function signOut() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  if (Platform.OS === 'web' && window.google?.accounts?.id) {
    google.accounts.id.disableAutoSelect();
  }
}

// ───────── トークン管理 ─────────

/**
 * IDトークンを AsyncStorage に保存する。
 */
export async function saveIdToken(token) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

/**
 * 保存済みの IDトークンを取得する。
 * 期限切れの場合は null を返す（再ログインが必要）。
 *
 * JWTの構造: ヘッダー.ペイロード.署名
 * ペイロード部分を base64 デコードして exp（有効期限）を確認する。
 * ※クライアント側では署名の検証は行わない（サーバー側で検証する）
 */
export async function getIdToken() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    // JWTのペイロード部分（2番目のパート）をデコード
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    // exp（秒単位のUNIXタイムスタンプ）と現在時刻を比較
    if (payload.exp && payload.exp < now) {
      // 期限切れ → トークンを削除
      await AsyncStorage.removeItem(TOKEN_KEY);
      return null;
    }

    return token;
  } catch (e) {
    // デコード失敗 → 不正なトークンとして削除
    await AsyncStorage.removeItem(TOKEN_KEY);
    return null;
  }
}
