/**
 * src/components/AdminPanel.js
 * 管理者専用のユーザー管理画面。
 *
 * - ユーザー一覧をテーブル形式で表示
 * - 各ユーザーの無効化/有効化・削除が可能
 * - 管理者本人の行にはボタンを表示しない
 * - 削除時は確認ダイアログを表示
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image,
} from 'react-native';
import { COLORS } from '../theme';
import { SYNC_API_URL } from '../config';
import { getIdToken } from '../auth';

// 管理者APIのベースURL（sync APIと同じホスト）
const ADMIN_API_URL = SYNC_API_URL.replace('/api/sync', '/api/admin/users');

export default function AdminPanel({ currentUser, onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── ユーザー一覧の取得 ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const res = await fetch(ADMIN_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      setError('ユーザー一覧の取得に失敗しました');
      console.error('Admin fetch error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── ユーザーの有効化/無効化 ──
  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const token = await getIdToken();
      const res = await fetch(ADMIN_API_URL, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        Alert.alert('エラー', data.error || '操作に失敗しました');
        return;
      }
      await fetchUsers();
    } catch (e) {
      Alert.alert('エラー', '通信に失敗しました');
    }
  };

  // ── ユーザーの削除（確認ダイアログ付き） ──
  const deleteUser = (userId, email) => {
    Alert.alert(
      'ユーザー削除',
      `${email} を削除しますか？\nこのユーザーのタスクデータもすべて削除されます。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getIdToken();
              const res = await fetch(`${ADMIN_API_URL}?userId=${encodeURIComponent(userId)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) {
                const data = await res.json();
                Alert.alert('エラー', data.error || '削除に失敗しました');
                return;
              }
              await fetchUsers();
            } catch (e) {
              Alert.alert('エラー', '通信に失敗しました');
            }
          },
        },
      ]
    );
  };

  // ── 日時のフォーマット ──
  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      {/* ヘッダー */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={onBack}>
          <Text style={st.backBtnText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={st.title}>ユーザー管理</Text>
      </View>

      {loading && <Text style={st.msg}>読み込み中...</Text>}
      {error && <Text style={st.errorMsg}>{error}</Text>}

      {!loading && users.map((u) => {
        const isMe = currentUser && u.id === currentUser.id;
        const isAdmin = u.role === 'admin';
        const isDisabled = u.status === 'disabled';

        return (
          <View key={u.id} style={[st.card, isDisabled && st.cardDisabled]}>
            <View style={st.cardTop}>
              {u.picture ? (
                <Image source={{ uri: u.picture }} style={st.avatar} />
              ) : (
                <View style={[st.avatar, st.avatarPlaceholder]}>
                  <Text style={st.avatarText}>{(u.name || u.email || '?')[0]}</Text>
                </View>
              )}
              <View style={st.userInfo}>
                <Text style={st.name} numberOfLines={1}>{u.name || '(名前未設定)'}</Text>
                <Text style={st.email} numberOfLines={1}>{u.email}</Text>
              </View>
              <View style={st.badges}>
                <View style={[st.badge, isAdmin ? st.badgeAdmin : st.badgeUser]}>
                  <Text style={st.badgeText}>{isAdmin ? '管理者' : 'ユーザー'}</Text>
                </View>
                <View style={[st.badge, isDisabled ? st.badgeDisabled : st.badgeActive]}>
                  <Text style={st.badgeText}>{isDisabled ? '無効' : '有効'}</Text>
                </View>
              </View>
            </View>

            <View style={st.meta}>
              <Text style={st.metaText}>登録: {formatDate(u.created_at)}</Text>
              <Text style={st.metaText}>最終ログイン: {formatDate(u.last_login_at)}</Text>
              <Text style={st.metaText}>最終同期: {formatDate(u.last_sync_at)}</Text>
            </View>

            {/* 管理者本人の行にはボタンを表示しない */}
            {!isMe && !isAdmin && (
              <View style={st.actions}>
                <TouchableOpacity
                  style={[st.actionBtn, isDisabled ? st.enableBtn : st.disableBtn]}
                  onPress={() => toggleStatus(u.id, u.status)}
                >
                  <Text style={st.actionBtnText}>
                    {isDisabled ? '有効化' : '無効化'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[st.actionBtn, st.deleteBtn]}
                  onPress={() => deleteUser(u.id, u.email)}
                >
                  <Text style={st.deleteBtnText}>削除</Text>
                </TouchableOpacity>
              </View>
            )}
            {isMe && (
              <Text style={st.meLabel}>（あなた）</Text>
            )}
          </View>
        );
      })}

      {!loading && users.length === 0 && (
        <Text style={st.msg}>ユーザーがいません</Text>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: {
    borderWidth: 1, borderColor: COLORS.line2, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 12, backgroundColor: COLORS.card,
  },
  backBtnText: { fontSize: 12, color: COLORS.ink2 },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.ink, letterSpacing: 1 },

  msg: { textAlign: 'center', color: COLORS.muted, fontSize: 13, padding: 20 },
  errorMsg: { textAlign: 'center', color: COLORS.danger, fontSize: 13, padding: 20 },

  card: {
    backgroundColor: COLORS.card, borderRadius: 10, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.line,
  },
  cardDisabled: { opacity: 0.6 },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { backgroundColor: COLORS.line2, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, color: COLORS.card, fontWeight: '600' },
  userInfo: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  email: { fontSize: 11, color: COLORS.muted, marginTop: 1 },

  badges: { flexDirection: 'row', gap: 4 },
  badge: { borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 },
  badgeAdmin: { backgroundColor: COLORS.warn },
  badgeUser: { backgroundColor: COLORS.blue },
  badgeActive: { backgroundColor: COLORS.ok },
  badgeDisabled: { backgroundColor: COLORS.danger },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '600' },

  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  metaText: { fontSize: 10, color: COLORS.muted },

  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { borderRadius: 6, paddingVertical: 5, paddingHorizontal: 12 },
  enableBtn: { backgroundColor: COLORS.ok },
  disableBtn: { backgroundColor: COLORS.warn },
  deleteBtn: { backgroundColor: COLORS.dangerBg, borderWidth: 1, borderColor: COLORS.danger },
  actionBtnText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  deleteBtnText: { fontSize: 11, color: COLORS.danger, fontWeight: '600' },

  meLabel: { fontSize: 10, color: COLORS.muted, marginTop: 8, fontStyle: 'italic' },
});
