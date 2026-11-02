// Kleine flesfoto per wijn, apart opgeslagen zodat de voorraadlijst licht blijft.
const PREFIX = 'winecellar:photo:';
const MAX_LENGTH = 250000; // tekens (ca. 180 KB) — een flesfoto is normaal ~15-30 KB

async function kvCommand(command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw Object.assign(new Error('Vercel KV is nog niet gekoppeld aan dit project.'), { code: 'NO_KV' });
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`KV request failed (${res.status})`);
  return res.json();
}

function isAuthorized(req) {
  const requiredPin = process.env.APP_PIN;
  if (!requiredPin) return true;
  return req.headers['x-app-pin'] === requiredPin;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Onjuiste of ontbrekende pincode.' });
    return;
  }

  const id = String((req.query && req.query.id) || '');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    res.status(400).json({ error: 'Ongeldig wijn-id.' });
    return;
  }
  const key = PREFIX + id;

  try {
    if (req.method === 'GET') {
      const { result } = await kvCommand(['GET', key]);
      if (!result) {
        res.status(404).json({ error: 'Geen foto.' });
        return;
      }
      res.status(200).json({ data: result });
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const data = body && body.data;
      if (typeof data !== 'string' || !/^data:image\/jpeg;base64,/.test(data) || data.length > MAX_LENGTH) {
        res.status(400).json({ error: 'Ongeldige of te grote foto.' });
        return;
      }
      await kvCommand(['SET', key, data]);
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === 'DELETE') {
      await kvCommand(['DEL', key]);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Methode niet toegestaan.' });
  } catch (e) {
    res.status(e.code === 'NO_KV' ? 503 : 500).json({ error: e.message });
  }
}
