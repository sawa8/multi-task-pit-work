import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet,
} from 'react-native';
import { COLORS } from '../theme';

export default function DuplicateModal({ visible, tasks, getAnkenColor, onSelect, onClose }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    const sorted = [...tasks].sort((a, b) =>
      (b.doneAt || b.createdAt || '').localeCompare(a.doneAt || a.createdAt || '')
    );
    if (!kw) return sorted;
    return sorted.filter(
      (t) =>
        (t.title + ' ' + t.anken + ' ' + (t.proj || '')).toLowerCase().includes(kw)
    );
  }, [tasks, query]);

  const renderItem = ({ item: t }) => (
    <TouchableOpacity style={s.item} onPress={() => { onSelect(t.id); setQuery(''); }}>
      <View style={[s.dot, { backgroundColor: getAnkenColor(t.anken) }]} />
      <View style={s.itemInfo}>
        <Text style={s.itemTitle} numberOfLines={2}>{t.title}</Text>
        <Text style={s.itemMeta}>
          {t.anken}{t.proj ? '・' + t.proj : ''}
        </Text>
      </View>
      <View style={[s.statusBadge, t.done && s.statusDone]}>
        <Text style={[s.statusText, t.done && s.statusDoneText]}>
          {t.done ? '完了' : '未完了'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.modal}>
          <Text style={s.heading}>⧉ 過去のタスクから複製</Text>
          <TextInput
            style={s.search}
            placeholder="🔍 タスク名・案件で絞り込み"
            placeholderTextColor={COLORS.muted}
            value={query}
            onChangeText={setQuery}
          />
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(t) => t.id}
            style={s.list}
            ListEmptyComponent={
              <Text style={s.empty}>該当するタスクがありません</Text>
            }
          />
          <TouchableOpacity style={s.closeBtn} onPress={() => { onClose(); setQuery(''); }}>
            <Text style={s.closeBtnText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(58,50,48,0.35)',
    justifyContent: 'center', padding: 16,
  },
  modal: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 20,
    maxHeight: '80%', borderWidth: 1, borderColor: COLORS.line2,
  },
  heading: { fontSize: 13, letterSpacing: 1, color: COLORS.ink2, marginBottom: 12 },
  search: {
    borderWidth: 1, borderColor: COLORS.line2, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff',
    fontSize: 14, color: COLORS.ink, marginBottom: 10,
  },
  list: { maxHeight: 380 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 8, padding: 10, marginBottom: 6,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 13, color: COLORS.ink, lineHeight: 18 },
  itemMeta: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.line,
  },
  statusDone: { backgroundColor: '#E4EEE2', borderColor: '#BFD5BB' },
  statusText: { fontSize: 10, color: COLORS.muted },
  statusDoneText: { color: COLORS.ok },
  empty: { textAlign: 'center', color: COLORS.muted, fontSize: 13, padding: 20 },
  closeBtn: {
    borderWidth: 1, borderColor: COLORS.line2, borderRadius: 8,
    paddingVertical: 8, alignItems: 'center', marginTop: 10, backgroundColor: COLORS.card,
  },
  closeBtnText: { fontSize: 13, color: COLORS.ink2 },
});
