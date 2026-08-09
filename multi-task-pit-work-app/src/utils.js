export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function todayStr(d = new Date()) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysFromToday(dateStr) {
  if (!dateStr) return null;
  return Math.round(
    (parseDate(dateStr) - parseDate(todayStr())) / 86400000
  );
}

export function weekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function nowStamp() {
  const d = new Date();
  return (
    todayStr(d) +
    ' ' +
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0')
  );
}

export function taskMinutes(t) {
  if (t.min > 0) return t.min;
  if (t.est > 0) return t.est * 60;
  return 0;
}

export function formatDateJa(d = new Date()) {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
}

export const PRI_ORDER = { '高': 0, '中': 1, '低': 2 };

export function sortTasks(arr, sortBy) {
  const a = [...arr];
  const cmpDeadline = (x, y) => {
    const dx = x.deadline || '9999-12-31';
    const dy = y.deadline || '9999-12-31';
    return dx < dy ? -1 : dx > dy ? 1 : 0;
  };
  if (sortBy === 'priority') {
    a.sort(
      (x, y) =>
        PRI_ORDER[x.pri] - PRI_ORDER[y.pri] || cmpDeadline(x, y)
    );
  } else {
    a.sort(
      (x, y) =>
        cmpDeadline(x, y) || PRI_ORDER[x.pri] - PRI_ORDER[y.pri]
    );
  }
  return a;
}

export function calcStats(state) {
  const today = todayStr();
  const ws = weekStart();
  const doneTasks = state.tasks.filter((t) => t.done);
  const doneToday = doneTasks.filter(
    (t) => t.doneAt && t.doneAt.slice(0, 10) === today
  );
  const weekMin = doneTasks
    .filter((t) => t.doneAt && parseDate(t.doneAt.slice(0, 10)) >= ws)
    .reduce((s, t) => s + taskMinutes(t), 0);
  const total = state.tasks.length;
  const todayOpen = state.tasks.filter(
    (t) => !t.done && t.bucket === 'today'
  );
  const todayPlanned = todayOpen.reduce((s, t) => s + taskMinutes(t), 0);
  return {
    doneToday: doneToday.length,
    doneTodayMin: doneToday.reduce((s, t) => s + taskMinutes(t), 0),
    weekHours: weekMin / 60,
    rate: total ? Math.round((doneTasks.length / total) * 100) : 0,
    doneCount: doneTasks.length,
    total,
    todayPlanned,
    pomoToday: state.pomo[today] || 0,
    doneTodayList: doneToday,
  };
}

export const PRAISES = [
  'ようやったなぁ！えらいで〜👏',
  'さすがやん！その調子やで🔥',
  'うわ、仕事はやっ！かっこええわ〜✨',
  'ほんまようがんばった、天才ちゃう？🎉',
  'よっしゃ完了！ええ感じやん💪',
  'きっちり終わらせて、ほんまえらい！🌟',
  'また一つ片付いたで！最高やん🙌',
  'あんた、やる時はやるなぁ〜😆',
  'お見事！茶ぁでも飲んで一服しよか☕',
  'ナイスやで！この調子でいこな🚀',
  'はよ終わったやん、腕上げたなぁ👍',
  'ばっちりや！ほんま頼りになるわ〜💯',
];

export function buildReport(state) {
  const st = calcStats(state);
  const d = todayStr();
  const doneList =
    st.doneTodayList
      .map((t) => `- 【${t.anken}】${t.title}（${taskMinutes(t)}分）`)
      .join('\n') || '- （なし）';
  const remainToday = state.tasks.filter(
    (t) => !t.done && t.bucket === 'today'
  ).length;
  return `PIT WORK 日次報告 ${d}

■ 今日のふり返り
- 完了タスク: ${st.doneToday}件
- 消化した時間: ${Math.round(st.doneTodayMin)}分（${(st.doneTodayMin / 60).toFixed(1)}h）
- 集中回数（ポモドーロ）: ${st.pomoToday}回

■ ダッシュボード
- 今日の完了数: ${st.doneToday}件
- 今週の稼働時間: ${st.weekHours.toFixed(1)}h
- 完了率: ${st.rate}%（${st.doneCount}/${st.total}件）

■ 今日完了したタスク
${doneList}

■ 持ち越し
- 「今日やる」の残り: ${remainToday}件`;
}

export function createSampleTasks() {
  const d = new Date();
  const plus = (n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return todayStr(x);
  };
  return [
    {
      id: uid(), title: 'トップページのコーディング',
      anken: 'A社コーポレート', proj: 'リニューアル', pri: '高',
      est: 3, min: 120, target: plus(1), deadline: plus(2),
      bucket: 'today',
      subs: [
        { t: 'ヘッダー実装', done: true },
        { t: 'メインビジュアル', done: false },
        { t: 'レスポンシブ調整', done: false },
      ],
      done: false, doneAt: null, createdAt: todayStr(),
    },
    {
      id: uid(), title: 'バナー3案の初稿提出',
      anken: 'B社ECサイト', proj: '夏セール', pri: '中',
      est: 2, min: 90, target: plus(3), deadline: plus(5),
      bucket: 'today', subs: [],
      done: false, doneAt: null, createdAt: todayStr(),
    },
    {
      id: uid(), title: '請求書の発行（6月分）',
      anken: 'C社保守', proj: '', pri: '低',
      est: 0.5, min: 20, target: plus(6), deadline: plus(8),
      bucket: 'later', subs: [],
      done: false, doneAt: null, createdAt: todayStr(),
    },
  ];
}
