// lib/kv.js — kleine REST-client voor Upstash Redis (of Vercel KV, wat
// dezelfde REST-API gebruikt).
//
// Belangrijk (valkuil #3 uit de bouwgids): Vercel's eigen "KV"-product en de
// Upstash-marketplace-integratie geven ANDERE env-varnamen voor dezelfde
// REST-API. Check op beide, anders werkt de setup niet betrouwbaar voor
// iedere gebruiker.
function kvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      'No KV environment variables found. Connect a Vercel KV or Upstash Redis database to this project.',
    );
  }
  return { url, token };
}

async function kvCommand(...command) {
  const { url, token } = kvConfig();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    throw new Error(`KV request failed (${res.status})`);
  }
  const data = await res.json();
  return data.result;
}

const STATE_KEY = 'wijnkelder:state';

export async function haalState() {
  const raw = await kvCommand('GET', STATE_KEY);
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export async function bewaarState(state) {
  await kvCommand('SET', STATE_KEY, JSON.stringify(state));
}
