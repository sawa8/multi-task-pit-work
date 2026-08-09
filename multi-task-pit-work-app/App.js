import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  SafeAreaView, Share, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { COLORS, PALETTE } from './src/theme';
import {
  uid, todayStr, nowStamp, taskMinutes, formatDateJa,
  sortTasks, calcStats, PRAISES, buildReport, createSampleTasks,
} from './src/utils';
import Dashboard from './src/components/Dashboard';
import Pomodoro from './src/components/Pomodoro';
import FocusCard from './src/components/FocusCard';
import TaskCard from './src/components/TaskCard';
import TaskModal from './src/components/TaskModal';
import ReviewModal from './src/components/ReviewModal';
import DuplicateModal from './src/components/DuplicateModal';
import DoneList from './src/components/DoneList';
import { pullState, debouncedPush } from './src/sync';
import AnkenSummary from './src/components/AnkenSummary';

const LS_KEY = 'anken_todo_md_v1';

const defaultState = {
  tasks: [],
  ankenColors: {},
  focusId: null,
  sortBy: 'deadline',
  capacity: 360,
  pomo: {},
};

export default function App() {
  const [state, setState] = useState(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [dupVisible, setDupVisible] = useState(false);
  const [praiseMsg, setPraiseMsg] = useState(null);
  const praiseTimer = useRef(null);

  // Persist to AsyncStorage + cloud sync
  const persist = useCallback(async (newState) => {
    setState(newState);
    try {
      await AsyncStorage.setItem(LS_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('保存失敗', e);
    }
    debouncedPush(newState);
  }, []);

  // Load from AsyncStorage, then try cloud sync
  useEffect(() => {
    (async () => {
      // 1. Load local first (instant)
      let localData = null;
      try {
        const raw = await AsyncStorage.getItem(LS_KEY);
        if (raw) localData = JSON.parse(raw);
      } catch (e) {
        console.warn('読込失敗', e);
      }

      // 2. Try pull from cloud
      try {
        const remote = await pullState();
        if (remote && remote.data && remote.data.tasks) {
          const merged = { ...defaultState, ...remote.data };
          setState(merged);
          await AsyncStorage.setItem(LS_KEY, JSON.stringify(merged));
          setLoaded(true);
          return;
        }
      } catch (e) {
        console.warn('Cloud sync failed, using local:', e);
      }

      // 3. Fall back to local
      if (localData) {
        setState({ ...defaultState, ...localData });
      } else {
        const samples = createSampleTasks();
        const colors = {};
        samples.forEach((t) => {
          if (!colors[t.anken]) {
            colors[t.anken] = PALETTE[Object.keys(colors).length % PALETTE.length];
          }
        });
        const initial = {
          ...defaultState,
          tasks: samples,
          ankenColors: colors,
          focusId: samples[0].id,
        };
        setState(initial);
        await AsyncStorage.setItem(LS_KEY, JSON.stringify(initial));
      }
      setLoaded(true);
    })();
  }, []);

  // Get anken color
  const getAnkenColor = useCallback((name) => {
    if (state.ankenColors[name]) return state.ankenColors[name];
    const used = Object.keys(state.ankenColors).length;
    return PALETTE[used % PALETTE.length];
  }, [state.ankenColors]);

  const ensureAnkenColor = (newState, name) => {
    if (!newState.ankenColors[name]) {
      const used = Object.keys(newState.ankenColors).length;
      newState.ankenColors = {
        ...newState.ankenColors,
        [name]: PALETTE[used % PALETTE.length],
      };
    }
  };

  // Show praise toast
  const showPraise = (title) => {
    const msg = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    setPraiseMsg({ msg, title });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearTimeout(praiseTimer.current);
    praiseTimer.current = setTimeout(() => setPraiseMsg(null), 3000);
  };

  // Task actions
  const toggleDone = (id) => {
    const newState = { ...state, tasks: state.tasks.map((t) => ({ ...t })) };
    const t = newState.tasks.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? nowStamp() : null;
    if (t.done && newState.focusId === id) newState.focusId = null;
    persist(newState);
    if (t.done) showPraise(t.title);
  };

  const toggleFocus = (id) => {
    const newState = { ...state };
    newState.focusId = newState.focusId === id ? null : id;
    persist(newState);
  };

  const moveTask = (id) => {
    const newState = { ...state, tasks: state.tasks.map((t) => ({ ...t })) };
    const t = newState.tasks.find((x) => x.id === id);
    if (t) t.bucket = t.bucket === 'today' ? 'later' : 'today';
    persist(newState);
  };

  const deleteTask = (id) => {
    const newState = { ...state };
    newState.tasks = newState.tasks.filter((x) => x.id !== id);
    if (newState.focusId === id) newState.focusId = null;
    persist(newState);
  };

  const toggleSub = (taskId, subIdx) => {
    const newState = { ...state, tasks: state.tasks.map((t) => ({
      ...t, subs: (t.subs || []).map((s2) => ({ ...s2 })),
    }))};
    const t = newState.tasks.find((x) => x.id === taskId);
    if (t && t.subs[subIdx] !== undefined) {
      t.subs[subIdx].done = !t.subs[subIdx].done;
    }
    persist(newState);
  };

  const deleteSub = (taskId, subIdx) => {
    const newState = { ...state, tasks: state.tasks.map((t) => ({
      ...t, subs: [...(t.subs || [])],
    }))};
    const t = newState.tasks.find((x) => x.id === taskId);
    if (t) t.subs.splice(subIdx, 1);
    persist(newState);
  };

  const addSub = (taskId, text) => {
    const newState = { ...state, tasks: state.tasks.map((t) => ({
      ...t, subs: [...(t.subs || [])],
    }))};
    const t = newState.tasks.find((x) => x.id === taskId);
    if (t) t.subs.push({ t: text, done: false });
    persist(newState);
  };

  const undoDone = (id) => {
    const newState = { ...state, tasks: state.tasks.map((t) => ({ ...t })) };
    const t = newState.tasks.find((x) => x.id === id);
    if (t) { t.done = false; t.doneAt = null; }
    persist(newState);
  };

  // Task modal
  const openAddModal = () => {
    setEditingTask(null);
    setTaskModalVisible(true);
  };

  const openEditModal = (id) => {
    const t = state.tasks.find((x) => x.id === id);
    if (t) {
      setEditingTask(t);
      setTaskModalVisible(true);
    }
  };

  const openDuplicateModal = (id) => {
    const t = state.tasks.find((x) => x.id === id);
    if (t) {
      setEditingTask({
        ...t,
        id: null,
        target: '',
        deadline: '',
        subs: (t.subs || []).map((s2) => ({ ...s2, done: false })),
      });
      setTaskModalVisible(true);
    }
  };

  const saveTask = (data) => {
    const newState = { ...state, tasks: [...state.tasks.map((t) => ({ ...t }))] };
    ensureAnkenColor(newState, data.anken);
    if (editingTask && editingTask.id) {
      const idx = newState.tasks.findIndex((t) => t.id === editingTask.id);
      if (idx >= 0) {
        newState.tasks[idx] = { ...newState.tasks[idx], ...data };
      }
    } else {
      newState.tasks.push({
        id: uid(),
        done: false,
        doneAt: null,
        createdAt: todayStr(),
        ...data,
      });
    }
    persist(newState);
    setTaskModalVisible(false);
    setEditingTask(null);
  };

  // Pomodoro complete
  const onPomoComplete = () => {
    const d = todayStr();
    const newState = { ...state, pomo: { ...state.pomo } };
    newState.pomo[d] = (newState.pomo[d] || 0) + 1;
    persist(newState);
  };

  // Share all tasks
  const shareAllTasks = async () => {
    const report = buildReport(state);
    try {
      await Share.share({ message: report, title: 'PIT WORK タスク共有' });
    } catch (e) {}
  };

  // Duplicate picker
  const openDupPicker = () => {
    if (!state.tasks.length) {
      Alert.alert('', '複製できるタスクがまだありません');
      return;
    }
    setDupVisible(true);
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.loadWrap}>
        <Text style={styles.loadText}>読み込み中...</Text>
      </SafeAreaView>
    );
  }

  const open = state.tasks.filter((t) => !t.done);
  const todayTasks = sortTasks(open.filter((t) => t.bucket === 'today'), state.sortBy);
  const laterTasks = sortTasks(open.filter((t) => t.bucket === 'later'), state.sortBy);
  const todayMin = todayTasks.reduce((acc, t) => acc + taskMinutes(t), 0);
  const laterMin = laterTasks.reduce((acc, t) => acc + taskMinutes(t), 0);
  const focusTask = state.tasks.find((t) => t.id === state.focusId && !t.done);
  const ankenList = [...new Set(state.tasks.map((t) => t.anken))];
  const st = calcStats(state);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logoSub}>MULTI-TASK</Text>
            <Text style={styles.logoTitle}><Text style={styles.logoPit}>PIT</Text> WORK</Text>
          </View>
          <Text style={styles.dateLabel}>{formatDateJa()}</Text>
        </View>

        {/* Header buttons */}
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.btn} onPress={shareAllTasks}>
            <Text style={styles.btnText}>📤 共有</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnAccent]} onPress={() => setReviewVisible(true)}>
            <Text style={styles.btnAccentText}>🌙 ふり返り</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={openDupPicker}>
            <Text style={styles.btnText}>⧉ 複製</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={openAddModal}>
            <Text style={styles.btnPriText}>＋ タスク追加</Text>
          </TouchableOpacity>
        </View>

        <Dashboard state={state} />
        <Pomodoro pomoCount={st.pomoToday} onPomoComplete={onPomoComplete} />
        <FocusCard
          task={focusTask}
          ankenColor={focusTask ? getAnkenColor(focusTask.anken) : null}
          onDone={() => focusTask && toggleDone(focusTask.id)}
          onUnpin={() => persist({ ...state, focusId: null })}
        />

        {/* Sort toggle */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>並べ替え:</Text>
          <TouchableOpacity
            style={[styles.sortBtn, state.sortBy === 'deadline' && styles.sortActive]}
            onPress={() => persist({ ...state, sortBy: 'deadline' })}
          >
            <Text style={[styles.sortBtnText, state.sortBy === 'deadline' && styles.sortActiveText]}>締切順</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, state.sortBy === 'priority' && styles.sortActive]}
            onPress={() => persist({ ...state, sortBy: 'priority' })}
          >
            <Text style={[styles.sortBtnText, state.sortBy === 'priority' && styles.sortActiveText]}>優先度順</Text>
          </TouchableOpacity>
        </View>

        {/* Today column */}
        <View style={styles.col}>
          <View style={styles.colHeader}>
            <Text style={styles.colTitle}>☀ 今日やる</Text>
            <View style={styles.cnt}><Text style={styles.cntText}>{todayTasks.length}</Text></View>
            <Text style={styles.colMin}>計 {todayMin}分</Text>
          </View>
          {todayTasks.length === 0 ? (
            <Text style={styles.empty}>今日のタスクはありません</Text>
          ) : (
            todayTasks.map((t) => (
              <TaskCard
                key={t.id} task={t}
                ankenColor={getAnkenColor(t.anken)}
                isFocused={state.focusId === t.id}
                onToggleDone={toggleDone} onToggleFocus={toggleFocus}
                onMove={moveTask} onEdit={openEditModal}
                onDuplicate={openDuplicateModal} onDelete={deleteTask}
                onToggleSub={toggleSub} onDeleteSub={deleteSub} onAddSub={addSub}
              />
            ))
          )}
        </View>

        {/* Later column */}
        <View style={styles.col}>
          <View style={styles.colHeader}>
            <Text style={styles.colTitle}>🌤 あとで</Text>
            <View style={styles.cnt}><Text style={styles.cntText}>{laterTasks.length}</Text></View>
            <Text style={styles.colMin}>計 {laterMin}分</Text>
          </View>
          {laterTasks.length === 0 ? (
            <Text style={styles.empty}>「あとで」は空です</Text>
          ) : (
            laterTasks.map((t) => (
              <TaskCard
                key={t.id} task={t}
                ankenColor={getAnkenColor(t.anken)}
                isFocused={state.focusId === t.id}
                onToggleDone={toggleDone} onToggleFocus={toggleFocus}
                onMove={moveTask} onEdit={openEditModal}
                onDuplicate={openDuplicateModal} onDelete={deleteTask}
                onToggleSub={toggleSub} onDeleteSub={deleteSub} onAddSub={addSub}
              />
            ))
          )}
        </View>

        <DoneList
          tasks={state.tasks}
          getAnkenColor={getAnkenColor}
          onUndo={undoDone}
          onDuplicate={openDuplicateModal}
        />
        <AnkenSummary tasks={state.tasks} getAnkenColor={getAnkenColor} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            データはこの端末に自動保存されます。{'\n'}
            「📤 共有」や「🌙 ふり返り」から報告書を転送できます。
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Praise toast */}
      {praiseMsg && (
        <View style={styles.praise}>
          <Text style={styles.praiseMsg}>{praiseMsg.msg}</Text>
          <Text style={styles.praiseSub}>✔ {praiseMsg.title}</Text>
        </View>
      )}

      <TaskModal
        visible={taskModalVisible}
        task={editingTask}
        ankenList={ankenList}
        onSave={saveTask}
        onClose={() => { setTaskModalVisible(false); setEditingTask(null); }}
      />
      <ReviewModal
        visible={reviewVisible}
        state={state}
        onClose={() => setReviewVisible(false)}
      />
      <DuplicateModal
        visible={dupVisible}
        tasks={state.tasks}
        getAnkenColor={getAnkenColor}
        onSelect={(id) => { setDupVisible(false); openDuplicateModal(id); }}
        onClose={() => setDupVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  loadWrap: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  loadText: { color: COLORS.muted, fontSize: 14 },

  header: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.line2 },
  logoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  logoSub: { fontSize: 10, letterSpacing: 3, color: COLORS.muted },
  logoTitle: { fontSize: 18, letterSpacing: 2, color: COLORS.ink },
  logoPit: { color: COLORS.pinkDeep },
  dateLabel: { fontSize: 12, color: COLORS.ink2, marginTop: 4, letterSpacing: 0.5 },

  headerBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, marginBottom: 14 },
  btn: {
    borderWidth: 1, borderColor: COLORS.line2, backgroundColor: COLORS.card,
    borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12,
  },
  btnText: { fontSize: 12, color: COLORS.ink2 },
  btnAccent: { backgroundColor: COLORS.pink, borderColor: COLORS.pink },
  btnAccentText: { fontSize: 12, color: '#fff' },
  btnPrimary: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  btnPriText: { fontSize: 12, color: '#fff' },

  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sortLabel: { fontSize: 11, color: COLORS.muted },
  sortBtn: {
    borderWidth: 1, borderColor: COLORS.line2, borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 10, backgroundColor: COLORS.card,
  },
  sortActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  sortBtnText: { fontSize: 11, color: COLORS.ink2 },
  sortActiveText: { color: '#fff' },

  col: {
    backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, padding: 12, marginBottom: 12,
  },
  colHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  colTitle: { fontSize: 11, letterSpacing: 2, color: COLORS.ink2 },
  cnt: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 1,
  },
  cntText: { fontSize: 10, color: COLORS.muted },
  colMin: { marginLeft: 'auto', fontSize: 10, color: COLORS.muted },
  empty: { textAlign: 'center', color: COLORS.muted, fontSize: 12, padding: 18 },

  footer: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 12 },
  footerText: { fontSize: 10, color: COLORS.muted, lineHeight: 18 },

  praise: {
    position: 'absolute', bottom: 22, right: 16, left: 16,
    backgroundColor: COLORS.pinkDeep, borderRadius: 12,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
  },
  praiseMsg: { fontSize: 16, color: '#fff', textAlign: 'center', lineHeight: 24 },
  praiseSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});
