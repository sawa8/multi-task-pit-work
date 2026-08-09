import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, PRI_COLORS } from '../theme';
import { taskMinutes, daysFromToday } from '../utils';

export default function FocusCard({ task, ankenColor, onDone, onUnpin }) {
  if (!task) {
    return (
      <View style={s.wrap}>
        <Text style={s.label}>📌 今日のフォーカス</Text>
        <Text style={s.empty}>
          タスクの 📌 を押して、今日いちばん進めたい1件をピン留めしましょう。
        </Text>
      </View>
    );
  }

  const subsDone = (task.subs || []).filter((x) => x.done).length;
  const subsTotal = (task.subs || []).length;
  const pri = PRI_COLORS[task.pri];

  return (
    <View style={s.wrap}>
      <View style={s.accent} />
      <Text style={s.label}>📌 今日のフォーカス</Text>
      <Text style={s.title}>{task.title}</Text>
      <View style={s.badges}>
        <View style={[s.chip, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          <View style={[s.dot, { backgroundColor: ankenColor }]} />
          <Text style={s.chipText}>{task.anken}</Text>
        </View>
        {task.proj ? (
          <View style={s.chip}><Text style={s.chipText}>{task.proj}</Text></View>
        ) : null}
        <View style={[s.chip, { backgroundColor: pri.bg, borderColor: pri.border }]}>
          <Text style={[s.chipText, { color: pri.text }]}>優先 {task.pri}</Text>
        </View>
        {task.min ? (
          <View style={s.chip}><Text style={s.chipText}>⏱ {task.min}分</Text></View>
        ) : task.est ? (
          <View style={s.chip}><Text style={s.chipText}>見積 {task.est}h</Text></View>
        ) : null}
        {subsTotal > 0 && (
          <View style={s.chip}><Text style={s.chipText}>☑ {subsDone}/{subsTotal}</Text></View>
        )}
      </View>
      <View style={s.btns}>
        <TouchableOpacity style={s.btn} onPress={onDone}>
          <Text style={s.btnText}>✔ 完了にする</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btn} onPress={onUnpin}>
          <Text style={s.btnText}>ピン解除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, padding: 16, marginBottom: 10, position: 'relative', overflow: 'hidden',
  },
  accent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: COLORS.pink,
  },
  label: { fontSize: 10, letterSpacing: 2.5, color: COLORS.pinkDeep, marginBottom: 8 },
  title: { fontSize: 18, lineHeight: 26, color: COLORS.ink, marginBottom: 8 },
  empty: { fontSize: 13, color: COLORS.muted, paddingVertical: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9,
    borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card2,
  },
  chipText: { fontSize: 11, color: COLORS.ink2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  btns: { flexDirection: 'row', gap: 8 },
  btn: {
    borderWidth: 1, borderColor: COLORS.line2, backgroundColor: COLORS.card,
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12,
  },
  btnText: { fontSize: 12, color: COLORS.ink2 },
});
