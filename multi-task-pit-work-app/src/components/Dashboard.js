import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../theme';
import { calcStats, taskMinutes } from '../utils';

function GaugeSvg({ pct }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, pct / 100));
  return (
    <Svg width={68} height={68} viewBox="0 0 68 68">
      <Circle cx={34} cy={34} r={r} strokeWidth={4} stroke={COLORS.line} fill="none" />
      <Circle
        cx={34} cy={34} r={r} strokeWidth={4}
        stroke={COLORS.blue} fill="none" strokeLinecap="round"
        strokeDasharray={c.toFixed(1)}
        strokeDashoffset={off.toFixed(1)}
        rotation={-90} origin="34, 34"
      />
      <SvgText x={34} y={38} textAnchor="middle" fontSize={13} fill={COLORS.ink}>
        {pct}%
      </SvgText>
    </Svg>
  );
}

export default function Dashboard({ state }) {
  const st = calcStats(state);
  const cap = state.capacity;
  const pctCap = cap ? Math.round(st.todayPlanned / cap * 100) : 0;
  const isOver = pctCap > 100;
  const isWarn = pctCap >= 80 && !isOver;
  const capMsg = isOver
    ? `⚠ 詰め込みすぎ（超過 ${st.todayPlanned - cap}分）`
    : isWarn
    ? `△ 余裕少なめ（残り ${cap - st.todayPlanned}分）`
    : `残り容量 ${cap - st.todayPlanned}分`;

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <View style={s.tile}>
          <Text style={s.label}>今日の完了数</Text>
          <Text style={s.num}>{st.doneToday}<Text style={s.unit}> 件</Text></Text>
          <Text style={s.sub}>消化 {Math.round(st.doneTodayMin)}分</Text>
        </View>
        <View style={s.tile}>
          <Text style={s.label}>今週の稼働</Text>
          <Text style={s.num}>{st.weekHours.toFixed(1)}<Text style={s.unit}> h</Text></Text>
          <Text style={s.sub}>月曜起点・完了実績</Text>
        </View>
        <View style={[s.tile, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
          <GaugeSvg pct={st.rate} />
          <View>
            <Text style={s.label}>完了率</Text>
            <Text style={s.sub}>{st.doneCount} / {st.total} 件</Text>
          </View>
        </View>
      </View>
      <View style={s.row}>
        <View style={[s.tile, { flex: 1 }]}>
          <Text style={s.label}>今日の合計  {st.todayPlanned}/{cap}分</Text>
          <View style={s.capBar}>
            <View
              style={[
                s.capFill,
                { width: `${Math.min(100, pctCap)}%` },
                isOver && { backgroundColor: COLORS.danger },
                isWarn && { backgroundColor: COLORS.warn },
              ]}
            />
          </View>
          <Text style={[s.sub, isOver && { color: COLORS.danger }, isWarn && { color: COLORS.warn }]}>
            {capMsg}
          </Text>
        </View>
        <View style={s.tile}>
          <Text style={s.label}>集中回数</Text>
          <Text style={s.num}>{st.pomoToday}<Text style={s.unit}> 回</Text></Text>
          <Text style={s.sub}>25分 × {st.pomoToday}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tile: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, padding: 12,
  },
  label: { fontSize: 10, letterSpacing: 1.5, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 6 },
  num: { fontSize: 26, color: COLORS.ink },
  unit: { fontSize: 12, color: COLORS.muted },
  sub: { fontSize: 11, color: COLORS.ink2, marginTop: 4 },
  capBar: {
    height: 7, borderRadius: 4, backgroundColor: COLORS.card2,
    borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden', marginTop: 6,
  },
  capFill: { height: '100%', backgroundColor: COLORS.blue, borderRadius: 3 },
});
