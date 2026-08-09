import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Auth
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const result = await client.execute('SELECT data, updated_at FROM app_state WHERE id = 1');
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No data' });
      }
      const row = result.rows[0];
      return res.json({
        data: JSON.parse(row.data),
        updated_at: row.updated_at,
      });
    }

    if (req.method === 'PUT') {
      const { data } = req.body;
      if (!data) return res.status(400).json({ error: 'Missing data' });
      const now = new Date().toISOString();
      await client.execute({
        sql: 'UPDATE app_state SET data = ?, updated_at = ? WHERE id = 1',
        args: [JSON.stringify(data), now],
      });
      return res.json({ ok: true, updated_at: now });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Sync error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
