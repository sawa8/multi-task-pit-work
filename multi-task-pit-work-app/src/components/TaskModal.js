import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { COLORS } from '../theme';

const PRIORITIES = ['高', '中', '低'];
const BUCKETS = [
  { value: 'today', label: '今日やる' },
  { value: 'later', label: 'あとで' },
];

export default function TaskModal({ visible, task, ankenList, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [anken, setAnken] = useState('');
  const [proj, setProj] = useState('');
  const [pri, setPri] = useState('中');
  const [bucket, setBucket] = useState('today');
  const [est, setEst] = useState('');
  const [min, setMin] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [subsText, setSubsText] = useState('');

  useEffect(() => {
    if (visible) {
      if (task) {
        setTitle(task.title || '');
        setAnken(task.anken || '');
        setProj(task.proj || '');
        setPri(task.pri || '中');
        setBucket(task.bucket || 'today');
        setEst(task.est ? String(task.est) : '');
        setMin(task.min ? String(task.min) : '');
        setTarget(task.target || '');
        setDeadline(task.deadline || '');
        setSubsText((task.subs || []).map((s) => s.t).join('\n'));
      } else {
        setTitle(''); setAnken(''); setProj(''); setPri('中'); setBucket('today');
        setEst(''); setMin(''); setTarget(''); setDeadline(''); setSubsText('');
      }
    }
  }, [visible, task]);

  const handleSave = () => {
    if (!title.trim() || !anken.trim()) {
      Alert.alert('入力エラー', 'タスク名と案件は必須です。');
      return;
    }
    const subsRaw = subsText.split('\n').map((s) => s.trim()).filter(Boolean);
    const oldSubs = task?.subs || [];
    const subs = subsRaw.map((txt) => {
      const prev = oldSubs.find((s) => s.t === txt);
      return { t: txt, done: prev ? prev.done : false };
    });
    onSave({
      title: title.trim(),
      anken: anken.trim(),
      proj: proj.trim(),
      pri,
      bucket,
      est: parseFloat(est) || 0,
      min: parseInt(min) || 0,
      target: target.trim(),
      deadline: deadline.trim(),
      subs,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={st.overlay}
      >
        <View style={st.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={st.heading}>{task ? 'タスク編集' : 'タスク追加'}</Text>

            <Text style={st.label}>タスク名 *</Text>
            <TextInput style={st.input} value={title} onChangeText={setTitle}
              placeholder="例：トップページのコーディング" placeholderTextColor={COLORS.muted} />

            <View style={st.row}>
              <View style={st.half}>
                <Text style={st.label}>案件 *</Text>
                <TextInput style={st.input} value={anken} onChangeText={setAnken}
                  placeholder="例：A社コーポレート" placeholderTextColor={COLORS.muted} />
              </View>
              <View style={st.half}>
                <Text style={st.label}>プロジェクト</Text>
                <TextInput style={st.input} value={proj} onChangeText={setProj}
                  placeholder="例：リニューアル" placeholderTextColor={COLORS.muted} />
              </View>
            </View>

            <View style={st.row}>
              <View style={st.half}>
                <Text style={st.label}>優先度</Text>
                <View style={st.segRow}>
                  {PRIORITIES.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[st.seg, pri === p && st.segActive]}
                      onPress={() => setPri(p)}
                    >
                      <Text style={[st.segText, pri === p && st.segTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={st.half}>
                <Text style={st.label}>区分</Text>
                <View style={st.segRow}>
                  {BUCKETS.map((b) => (
                    <TouchableOpacity
                      key={b.value}
                      style={[st.seg, bucket === b.value && st.segActive]}
                      onPress={() => setBucket(b.value)}
                    >
                      <Text style={[st.segText, bucket === b.value && st.segTextActive]}>{b.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={st.row}>
              <View style={st.half}>
                <Text style={st.label}>見積工数 (h)</Text>
                <TextInput style={st.input} value={est} onChangeText={setEst}
                  keyboardType="decimal-pad" placeholder="2" placeholderTextColor={COLORS.muted} />
              </View>
              <View style={st.half}>
                <Text style={st.label}>所要時間 (分)</Text>
                <TextInput style={st.input} value={min} onChangeText={setMin}
                  keyboardType="number-pad" placeholder="90" placeholderTextColor={COLORS.muted} />
              </View>
            </View>

            <View style={st.row}>
              <View style={st.half}>
                <Text style={st.label}>目標日 (YYYY-MM-DD)</Text>
                <TextInput style={st.input} value={target} onChangeText={setTarget}
                  placeholder="2026-08-15" placeholderTextColor={COLORS.muted} />
              </View>
              <View style={st.half}>
                <Text style={st.label}>締切 (YYYY-MM-DD)</Text>
                <TextInput style={st.input} value={deadline} onChangeText={setDeadline}
                  placeholder="2026-08-20" placeholderTextColor={COLORS.muted} />
              </View>
            </View>

            <Text style={st.label}>サブタスク（1行1件）</Text>
            <TextInput
              style={[st.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={subsText} onChangeText={setSubsText}
              multiline placeholder={'ワイヤー確認\n素材受領\n実装'}
              placeholderTextColor={COLORS.muted}
            />

            {ankenList.length > 0 && (
              <View style={st.suggestions}>
                <Text style={st.sugLabel}>最近の案件:</Text>
                <View style={st.sugRow}>
                  {ankenList.slice(0, 5).map((a) => (
                    <TouchableOpacity key={a} style={st.sugChip} onPress={() => setAnken(a)}>
                      <Text style={st.sugText}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={st.btns}>
              <TouchableOpacity style={st.btnCancel} onPress={onClose}>
                <Text style={st.btnCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.btnSave} onPress={handleSave}>
                <Text style={st.btnSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(58,50,48,0.35)',
    justifyContent: 'center', padding: 16,
  },
  modal: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 20,
    maxHeight: '90%', borderWidth: 1, borderColor: COLORS.line2,
  },
  heading: {
    fontSize: 13, letterSpacing: 2, color: COLORS.ink2, marginBottom: 16,
  },
  label: {
    fontSize: 10, letterSpacing: 1.5, color: COLORS.muted, marginBottom: 4, marginTop: 8,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.line2, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff',
    fontSize: 14, color: COLORS.ink,
  },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  segRow: { flexDirection: 'row', gap: 4 },
  seg: {
    flex: 1, borderWidth: 1, borderColor: COLORS.line2, borderRadius: 8,
    paddingVertical: 7, alignItems: 'center', backgroundColor: COLORS.card,
  },
  segActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  segText: { fontSize: 12, color: COLORS.ink2 },
  segTextActive: { color: '#fff' },
  suggestions: { marginTop: 10 },
  sugLabel: { fontSize: 10, color: COLORS.muted, marginBottom: 4 },
  sugRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sugChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line,
  },
  sugText: { fontSize: 11, color: COLORS.ink2 },
  btns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 18 },
  btnCancel: {
    borderWidth: 1, borderColor: COLORS.line2, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 16, backgroundColor: COLORS.card,
  },
  btnCancelText: { fontSize: 13, color: COLORS.ink2 },
  btnSave: {
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 20,
    backgroundColor: COLORS.blue,
  },
  btnSaveText: { fontSize: 13, color: '#fff' },
});
