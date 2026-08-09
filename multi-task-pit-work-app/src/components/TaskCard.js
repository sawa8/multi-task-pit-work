import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, Alert,
} from 'react-native';
import { COLORS, PRI_COLORS } from '../theme';
import { daysFromToday, taskMinutes } from '../utils';

function DueChip({ deadline }) {
  const d = daysFromToday(deadline);
  if (d === null) return null;
  if (d < 0)
    return (
      <View style={[st.chip, st.dueOver]}>
        <Text style={st.dueOverText}>⚠ 締切超過 {-d}日</Text>
      </View>
    );
  if (d === 0)
    return (
      <View style={[st.chip, st.dueOver]}>
        <Text style={st.dueOverText}>⏰ 今日締切</Text>
      </View>
    );
  if (d <= 2)
    return (
      <View style={[st.chip, st.dueNear]}>
        <Text style={st.dueNearText}>⏰ 締切まで{d}日</Text>
      </View>
    );
  return (
    <View style={st.chip}>
      <Text style={st.chipText}>締切 {deadline.slice(5).replace('-', '/')}</Text>
    </View>
  );
}

export default function TaskCard({
  task, ankenColor, isFocused,
  onToggleDone, onToggleFocus, onMove, onEdit, onDuplicate, onDelete,
  onToggleSub, onDeleteSub, onAddSub,
}) {
  const [subInput, setSubInput] = useState('');
  const pri = PRI_COLORS[task.pri];
  const subs = task.subs || [];
  const subsDone = subs.filter((x) => x.done).length;
  const stale = !task.done && task.createdAt && daysFromToday(task.createdAt) <= -3;
  const staleDays = stale ? -daysFromToday(task.createdAt) : 0;

  const handleAddSub = () => {
    const v = subInput.trim();
    if (!v) return;
    onAddSub(task.id, v);
    setSubInput('');
  };

  return (
    <View style={st.card}>
      <View style={[st.accent, { backgroundColor: ankenColor }]} />
      <View style={st.topRow}>
        <TouchableOpacity style={st.chk} onPress={() => onToggleDone(task.id)}>
          <Text style={st.chkText}>○</Text>
        </TouchableOpacity>
        <Text style={st.title}>{task.title}</Text>
      </View>

      {/* Action buttons */}
      <View style={st.actions}>
        <TouchableOpacity style={st.actBtn} onPress={() => onToggleFocus(task.id)}>
          <Text style={[st.actIcon, isFocused && { color: COLORS.pinkDeep }]}>📌</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.actBtn} onPress={() => onMove(task.id)}>
          <Text style={st.actIcon}>{task.bucket === 'today' ? '🌤' : '☀'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.actBtn} onPress={() => onEdit(task.id)}>
          <Text style={st.actIcon}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.actBtn} onPress={() => onDuplicate(task.id)}>
          <Text style={st.actIcon}>⧉</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={st.actBtn}
          onPress={() =>
            Alert.alert('削除確認', `「${task.title}」を削除しますか？`, [
              { text: 'キャンセル' },
              { text: '削除', style: 'destructive', onPress: () => onDelete(task.id) },
            ])
          }
        >
          <Text style={st.actIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Badges */}
      <View style={st.badges}>
        <View style={[st.chip, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          <View style={[st.dot, { backgroundColor: ankenColor }]} />
          <Text style={st.chipText}>{task.anken}</Text>
        </View>
        {task.proj ? (
          <View style={st.chip}><Text style={st.chipText}>{task.proj}</Text></View>
        ) : null}
        <View style={[st.chip, { backgroundColor: pri.bg, borderColor: pri.border }]}>
          <Text style={[st.chipText, { color: pri.text }]}>優先 {task.pri}</Text>
        </View>
        {task.est ? (
          <View style={st.chip}><Text style={st.chipText}>見積 {task.est}h</Text></View>
        ) : null}
        {task.min ? (
          <View style={st.chip}><Text style={st.chipText}>⏱ {task.min}分</Text></View>
        ) : null}
        {task.target ? (
          <View style={st.chip}>
            <Text style={st.chipText}>目標 {task.target.slice(5).replace('-', '/')}</Text>
          </View>
        ) : null}
        <DueChip deadline={task.deadline} />
        {stale ? (
          <View style={[st.chip, st.staleChip]}>
            <Text style={st.staleText}>🐌 先延ばし中 {staleDays}日</Text>
          </View>
        ) : null}
      </View>

      {/* Subtasks */}
      {(subs.length > 0 || true) && (
        <View style={st.subsWrap}>
          {subs.map((sub, i) => (
            <View key={i} style={st.subLine}>
              <TouchableOpacity onPress={() => onToggleSub(task.id, i)}>
                <Text style={st.subCheck}>{sub.done ? '☑' : '☐'}</Text>
              </TouchableOpacity>
              <Text style={[st.subText, sub.done && st.subDone]}>{sub.t}</Text>
              <TouchableOpacity onPress={() => onDeleteSub(task.id, i)}>
                <Text style={st.subDel}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          {subs.length > 0 && (
            <Text style={st.subProg}>☑ {subsDone}/{subs.length}</Text>
          )}
          <View style={st.subAddRow}>
            <TextInput
              style={st.subAddInput}
              placeholder="＋ サブタスク追加"
              placeholderTextColor={COLORS.muted}
              value={subInput}
              onChangeText={setSubInput}
              onSubmitEditing={handleAddSub}
              returnKeyType="done"
            />
            <TouchableOpacity style={st.subAddBtn} onPress={handleAddSub}>
              <Text style={st.subAddBtnText}>追加</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 8, padding: 12, paddingLeft: 16, marginBottom: 9,
    position: 'relative', overflow: 'hidden',
  },
  accent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  chk: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: COLORS.line2,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  chkText: { fontSize: 12, color: COLORS.line2 },
  title: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.ink },
  actions: { flexDirection: 'row', gap: 2, marginTop: 6, marginBottom: 4 },
  actBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  actIcon: { fontSize: 14, color: COLORS.muted },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  chip: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9,
    borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card2,
  },
  chipText: { fontSize: 10, color: COLORS.ink2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dueOver: { backgroundColor: COLORS.dangerBg, borderColor: '#E0A899' },
  dueOverText: { fontSize: 10, color: COLORS.danger },
  dueNear: { backgroundColor: COLORS.warnBg, borderColor: '#DEC888' },
  dueNearText: { fontSize: 10, color: COLORS.warn },
  staleChip: { backgroundColor: COLORS.warnBg, borderColor: '#DEC888' },
  staleText: { fontSize: 10, color: COLORS.warn },
  subsWrap: { marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.line, borderStyle: 'dashed', paddingTop: 7 },
  subLine: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  subCheck: { fontSize: 14, color: COLORS.blue },
  subText: { flex: 1, fontSize: 12, color: COLORS.ink2 },
  subDone: { textDecorationLine: 'line-through', color: COLORS.muted },
  subDel: { fontSize: 14, color: COLORS.muted, paddingHorizontal: 4 },
  subProg: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  subAddRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  subAddInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.line, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, backgroundColor: '#fff', color: COLORS.ink,
  },
  subAddBtn: {
    borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card2,
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, justifyContent: 'center',
  },
  subAddBtnText: { fontSize: 11, color: COLORS.ink2 },
});
