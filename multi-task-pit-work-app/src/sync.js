const API_URL = 'https://multi-task-pit-work-app.vercel.app/api/sync';
const SYNC_TOKEN = '61efb2b85ed07ce45d142237272b474b';

let pushTimer = null;

export async function pullState() {
  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${SYNC_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
  return res.json();
}

export async function pushState(state) {
  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${SYNC_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: state }),
  });
  if (!res.ok) throw new Error(`Push failed: ${res.status}`);
  return res.json();
}

// Debounced push: waits 2 seconds after last call
export function debouncedPush(state) {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushState(state).catch((e) => console.warn('Sync push failed:', e));
  }, 2000);
}
