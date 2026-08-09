import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, Vibration } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../theme';
import { todayStr } from '../utils';

const FOCUS_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;
const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

export default function Pomodoro({ pomoCount, onPomoComplete }) {
  const [mode, setMode] = useState('focus');
  const [running, setRunning] = useState(false);
  const [remain, setRemain] = useState(FOCUS_SEC);
  const endAtRef = useRef(null);
  const timerRef = useRef(null);

  const total = mode === 'focus' ? FOCUS_SEC : BREAK_SEC;
  const mm = String(Math.floor(remain / 60)).padStart(2, '0');
  const ss = String(remain % 60).padStart(2, '0');
  const offset = (RING_C * (1 - remain / total)).toFixed(1);

  const tick = useCallback(() => {
    if (!endAtRef.current) return;
    const r = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
    setRemain(r);
    if (r <= 0) {
      Vibration.vibrate([0, 300, 200, 300, 200, 300]);
      clearInterval(timerRef.current);
      timerRef.current = null;
      setRunning((prev) => {
        setMode((prevMode) => {
          if (prevMode === 'focus') {
            onPomoComplete();
            setRemain(BREAK_SEC);
            endAtRef.current = Date.now() + BREAK_SEC * 1000;
            timerRef.current = setInterval(tick, 250);
            return 'break';
          } else {
            setRemain(FOCUS_SEC);
            endAtRef.current = null;
            return 'focus';
          }
        });
        return prevMode => prevMode === 'focus';
      });
    }
  }, [onPomoComplete]);

  // Handle app state changes for background timing
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && endAtRef.current) {
        tick();
      }
    });
    return () => sub.remove();
  }, [tick]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startPause = () => {
    if (running) {
      setRunning(false);
      clearInterval(timerRef.current);
      timerRef.current = null;
      endAtRef.current = null;
    } else {
      setRunning(true);
      endAtRef.current = Date.now() + remain * 1000;
      timerRef.current = setInterval(tick, 250);
    }
  };

  const reset = () => {
    setRunning(false);
    clearInterval(timerRef.current);
    timerRef.current = null;
    endAtRef.current = null;
    setMode('focus');
    setRemain(FOCUS_SEC);
  };

  return (
    <View style={[st.wrap, mode === 'break' && st.wrapBreak]}>
      <View style={st.ring}>
        <Svg width={100} height={100} viewBox="0 0 100 100">
          <Circle cx={50} cy={50} r={RING_R} strokeWidth={4} stroke={COLORS.line} fill="none" />
          <Circle
            cx={50} cy={50} r={RING_R} strokeWidth={4}
            stroke={mode === 'focus' ? COLORS.pink : COLORS.blue}
            fill="none" strokeLinecap="round"
            strokeDasharray={RING_C.toFixed(1)}
            strokeDashoffset={offset}
            rotation={-90} origin="50, 50"
          />
        </Svg>
        <View style={st.center}>
          <Text style={st.time}>{mm}:{ss}</Text>
          <Text style={st.modeLabel}>{mode === 'focus' ? 'FOCUS' : 'BREAK'}</Text>
        </View>
      </View>
      <View style={st.info}>
        <Text style={st.label}>Pomodoro 25 / 5</Text>
        <View style={st.btns}>
          <TouchableOpacity style={[st.btn, st.btnPrimary]} onPress={startPause}>
            <Text style={st.btnPriText}>{running ? '⏸ 一時停止' : '▶ 開始'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.btn} onPress={reset}>
            <Text style={st.btnText}>リセット</Text>
          </TouchableOpacity>
        </View>
        <Text style={st.count}>今日の集中 <Text style={st.countNum}>{pomoCount}</Text> 回</Text>
        <Text style={st.hint}>25分集中 → 5分休憩を自動で切替</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 10,
  },
  wrapBreak: {},
  ring: { width: 100, height: 100, position: 'relative' },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  time: { fontSize: 20, letterSpacing: 1, color: COLORS.ink },
  modeLabel: { fontSize: 9, letterSpacing: 3, color: COLORS.muted, marginTop: 2 },
  info: { flex: 1 },
  label: { fontSize: 10, letterSpacing: 2, color: COLORS.muted, marginBottom: 8 },
  btns: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  btn: {
    borderWidth: 1, borderColor: COLORS.line2, backgroundColor: COLORS.card,
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12,
  },
  btnPrimary: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  btnPriText: { fontSize: 12, color: '#fff' },
  btnText: { fontSize: 12, color: COLORS.ink2 },
  count: { fontSize: 12, color: COLORS.ink2 },
  countNum: { color: COLORS.pinkDeep, fontSize: 16 },
  hint: { fontSize: 10, color: COLORS.muted, marginTop: 3 },
});
