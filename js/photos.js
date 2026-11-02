// Kleine flesfoto's: lokaal gecached (geheugen + localStorage) en per wijn op
// de server opgeslagen (/api/photo). De voorraadlijst zelf bevat alleen
// `hasPhoto` en `photoV` (versie), nooit de foto zelf.
import { authHeaders } from './auth.js';

const CACHE_KEY = 'winecellar-photos';
const THUMB_MAX = 360; // px, langste zijde
const THUMB_QUALITY = 0.75;

let cache = {}; // id -> { v, d }
try {
  cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {};
} catch (e) {
  cache = {};
}

const inFlight = new Set();
const failed = new Map(); // id -> tijdstip van mislukte poging
let onChange = () => {};
let notifyTimer = null;

export function onPhotosChanged(fn) {
  onChange = fn;
}

function notify() {
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => onChange(), 120);
}

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    /* vol of geblokkeerd: dan alleen in het geheugen en opnieuw ophalen */
  }
}

/** Geeft de foto (data-URL) van een wijn, of '' als er (nog) geen is. Haalt ontbrekende foto's op de achtergrond op. */
export function photoSrc(wine) {
  if (!wine || !wine.hasPhoto) return '';
  const hit = cache[wine.id];
  if (hit && hit.v === wine.photoV) return hit.d;
  fetchPhoto(wine);
  return hit ? hit.d : ''; // oude versie tonen tot de nieuwe binnen is
}

async function fetchPhoto(wine) {
  const id = wine.id;
  if (inFlight.has(id)) return;
  if (failed.has(id) && Date.now() - failed.get(id) < 60000) return;
  inFlight.add(id);
  try {
    const res = await fetch('/api/photo?id=' + encodeURIComponent(id), { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error('geen foto');
    const { data } = await res.json();
    cache[id] = { v: wine.photoV, d: data };
    failed.delete(id);
    saveCache();
    notify();
  } catch (e) {
    failed.set(id, Date.now());
  } finally {
    inFlight.delete(id);
  }
}

/** Slaat een foto op (cache + server). */
export function savePhoto(id, version, dataUrl) {
  cache[id] = { v: version, d: dataUrl };
  saveCache();
  fetch('/api/photo?id=' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ data: dataUrl }),
  }).catch(() => {
    /* offline: de foto blijft lokaal staan */
  });
}

export function removePhoto(id) {
  if (cache[id]) {
    delete cache[id];
    saveCache();
  }
  fetch('/api/photo?id=' + encodeURIComponent(id), { method: 'DELETE', headers: authHeaders() }).catch(() => {});
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Kon de foto niet openen.'));
    img.src = src;
  });
}

/**
 * Maakt een klein jpeg-plaatje (data-URL). Met `box` ({x,y,w,h} als fracties
 * 0-1) wordt eerst uitgesneden rond de fles, met een beetje marge.
 */
export async function makeThumbnail(src, box) {
  const img = await loadImage(src);
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
  if (box && [box.x, box.y, box.w, box.h].every((n) => typeof n === 'number' && isFinite(n)) && box.w > 0.08 && box.h > 0.08) {
    const padX = box.w * 0.12;
    const padY = box.h * 0.08;
    const x0 = Math.max(0, box.x - padX);
    const y0 = Math.max(0, box.y - padY);
    const x1 = Math.min(1, box.x + box.w + padX);
    const y1 = Math.min(1, box.y + box.h + padY);
    sx = x0 * img.width;
    sy = y0 * img.height;
    sw = (x1 - x0) * img.width;
    sh = (y1 - y0) * img.height;
  }
  const scale = Math.min(1, THUMB_MAX / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', THUMB_QUALITY);
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Kon de foto niet lezen.'));
    r.readAsDataURL(file);
  });
}
