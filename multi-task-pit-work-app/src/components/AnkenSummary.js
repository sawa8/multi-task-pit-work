import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import { taskMinutes } from '../utils';

export default function AnkenSummary({ tasks, getAnkenColor }) {
  const map = {};
  for (const t of tasks) {
    const m = map[t.anken] || (map[t.anken] = { done: 0, open: 0, min: 0 });
    if (t.done) { m.done++; m.min += taskMinutes(t); }
    else m.open++;
  }
  const rows = Object.entries(map).sort((a, b) => b[1].min - a[1].min);
  const maxMin = Math.max(1, ...rows.map(([, m]) => m.min));

  return (
    <View style={s.panel}>
      <Text style={s.heading}>◧ 案件別 稼働集計（完了ベース）</Text>
      {rows.length === 0 ? (
        <Text style={s.empty}>タスクを追加すると案件別に集計されます</Text>
      ) : (
        rows.map(([name, m]) => {
          const color = getAnkenColor(name);
          const pct = Math.round((m.min / maxMin) * 100);
          return (
            <View key={name} style={s.row}>
              <View style={[s.dot, { backgroundColor: color }]} />
              <Text style={s.aname} numberOfLines={1}>{name}</Text>
              <View style={s.bar}>
                <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
              <Text style={s.hours}>{(m.min / 60).toFixed(1)}h</Text>
              <Text style={s.counts}>完了{m.done}/残{m.open}</Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, padding: 12, marginBottom: 10,
  },
  heading: { fontSize: 11, letterSpacing: 2, color: COLORS.ink2, marginBottom: 10 },
  empty: { textAlign: 'center', color: COLORS.muted, fontSize: 12, padding: 18 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 7, padding: 9, marginBottom: 6,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  aname: { flex: 1, fontSize: 12, color: COLORS.ink },
  bar: {
    flex: 1.2, height: 4, borderRadius: 2, backgroundColor: COLORS.card2,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.line,
  },
  barFill: { height: '100%', borderRadius: 2 },
  hours: { fontSize: 12, color: COLORS.blueDeep, minWidth: 36, textAlign: 'right' },
  counts: { fontSize: 10, color: COLORS.muted, minWidth: 60 },
});
