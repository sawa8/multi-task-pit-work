import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function DoneList({ tasks, getAnkenColor, onUndo, onDuplicate }) {
  const done = tasks
    .filter((t) => t.done)
    .sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));

  return (
    <View style={s.panel}>
      <View style={s.header}>
        <Text style={s.heading}>✔ 完了済み</Text>
        <View style={s.cnt}><Text style={s.cntText}>{done.length}</Text></View>
      </View>
      {done.length === 0 ? (
        <Text style={s.empty}>まだ完了タスクはありません</Text>
      ) : (
        done.map((t) => (
          <View key={t.id} style={s.item}>
            <View style={[s.dot, { backgroundColor: getAnkenColor(t.anken) }]} />
            <Text style={s.title} numberOfLines={1}>{t.title}</Text>
            <Text style={s.meta}>{t.anken}・{t.doneAt || ''}</Text>
            <TouchableOpacity onPress={() => onDuplicate(t.id)} style={s.iconBtn}>
              <Text style={s.icon}>⧉</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onUndo(t.id)} style={s.iconBtn}>
              <Text style={s.icon}>↩</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, padding: 12, marginBottom: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  heading: { fontSize: 11, letterSpacing: 2, color: COLORS.ink2 },
  cnt: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 1,
  },
  cntText: { fontSize: 10, color: COLORS.muted },
  empty: { textAlign: 'center', color: COLORS.muted, fontSize: 12, padding: 18 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 7, padding: 8, marginBottom: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: {
    flex: 1, fontSize: 12, color: COLORS.muted,
    textDecorationLine: 'line-through',
  },
  meta: { fontSize: 9, color: COLORS.muted },
  iconBtn: { paddingHorizontal: 4 },
  icon: { fontSize: 14, color: COLORS.muted },
});
