import React from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Share,
} from 'react-native';
import { COLORS } from '../theme';
import { calcStats, todayStr, buildReport } from '../utils';

export default function ReviewModal({ visible, state, onClose }) {
  const st2 = calcStats(state);
  const report = buildReport(state);

  const handleShare = async () => {
    try {
      await Share.share({ message: report, title: 'PIT WORK 日次報告' });
    } catch (e) {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.heading}>🌙 1日のふり返り — {todayStr()}</Text>

            <View style={s.tileRow}>
              <View style={s.tile}>
                <Text style={s.tileLabel}>完了数</Text>
                <Text style={s.tileNum}>{st2.doneToday}<Text style={s.tileUnit}> 件</Text></Text>
              </View>
              <View style={s.tile}>
                <Text style={s.tileLabel}>消化時間</Text>
                <Text style={s.tileNum}>{Math.round(st2.doneTodayMin)}<Text style={s.tileUnit}> 分</Text></Text>
              </View>
              <View style={s.tile}>
                <Text style={s.tileLabel}>集中回数</Text>
                <Text style={s.tileNum}>{st2.pomoToday}<Text style={s.tileUnit}> 回</Text></Text>
              </View>
            </View>

            <View style={s.reportBox}>
              <Text style={s.reportText}>{report}</Text>
            </View>

            <View style={s.btns}>
              <TouchableOpacity style={s.btn} onPress={onClose}>
                <Text style={s.btnText}>閉じる</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={handleShare}>
                <Text style={s.btnPriText}>📤 共有・転送</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    maxHeight: '85%', borderWidth: 1, borderColor: COLORS.line2,
  },
  heading: { fontSize: 13, letterSpacing: 1, color: COLORS.ink2, marginBottom: 14 },
  tileRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tile: {
    flex: 1, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 8, padding: 10,
  },
  tileLabel: { fontSize: 9, letterSpacing: 1.5, color: COLORS.muted, marginBottom: 4 },
  tileNum: { fontSize: 22, color: COLORS.ink },
  tileUnit: { fontSize: 11, color: COLORS.muted },
  reportBox: {
    backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 8, padding: 14, maxHeight: 250,
  },
  reportText: { fontSize: 12, lineHeight: 20, color: COLORS.ink2 },
  btns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  btn: {
    borderWidth: 1, borderColor: COLORS.line2, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 14, backgroundColor: COLORS.card,
  },
  btnText: { fontSize: 13, color: COLORS.ink2 },
  btnPrimary: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  btnPriText: { fontSize: 13, color: '#fff' },
});
