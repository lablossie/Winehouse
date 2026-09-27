// js/state.js — data-laag: laden/opslaan, CRUD, sync met de server.
// Bevat de fix voor valkuil #4: een lege server-response mag nooit een
// gevulde lokale voorraad overschrijven.

import { metAuthHeaders } from './auth.js';
import { nieuwId } from './utils.js';

const LOCAL_SLEUTEL = 'wijnkelder.state.v1';

export function leegState() {
  return { inventory: [], history: [], ownerName: '' };
}

export function laadLokaal() {
  try {
    const raw = localStorage.getItem(LOCAL_SLEUTEL);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.inventory)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function bewaarLokaal(state) {
  try {
    localStorage.setItem(LOCAL_SLEUTEL, JSON.stringify(state));
  } catch {
    /* opslag vol of geblokkeerd — de app blijft werken zonder offline-cache */
  }
}

/**
 * Haalt state op van de server. Als de server een lege voorraad teruggeeft
 * terwijl er al lokale data is, wordt die lokale data juist omhoog gestuurd
 * (i.p.v. blind overschreven) — zie valkuil #4 in de bouwgids.
 */
export async function syncState() {
  const lokaal = laadLokaal();

  let serverState = null;
  try {
    const res = await fetch('/api/inventory', { headers: metAuthHeaders() });
    if (res.status === 401) {
      const err = new Error('unauthorized');
      err.code = 401;
      throw err;
    }
    if (res.ok) {
      serverState = await res.json();
    }
  } catch (fout) {
    if (fout.code === 401) throw fout;
    // Netwerkfout: geen server bereikbaar, val terug op lokale data hieronder.
  }

  const serverIsLeeg = !serverState || !Array.isArray(serverState.inventory) || serverState.inventory.length === 0;
  const lokaalHeeftData = lokaal && lokaal.inventory && lokaal.inventory.length > 0;

  if (serverIsLeeg && lokaalHeeftData) {
    // Bescherm lokale data: stuur die naar de server i.p.v. de lege state te accepteren.
    await bewaarNaarServer(lokaal).catch(() => {});
    return lokaal;
  }

  const finaleState = serverState || lokaal || leegState();
  bewaarLokaal(finaleState);
  return finaleState;
}

export async function bewaarNaarServer(state) {
  bewaarLokaal(state);
  const res = await fetch('/api/inventory', {
    method: 'PUT',
    headers: metAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(state),
  });
  if (res.status === 401) {
    const err = new Error('unauthorized');
    err.code = 401;
    throw err;
  }
  return res.ok;
}

// ---- CRUD-helpers op het state-object (muteren niet, geven nieuwe state terug) ----

export function voegItemToe(state, veldwaarden) {
  const id = nieuwId('w', state.inventory.map((i) => i.id));
  const item = {
    id,
    land: '', gebied: '', domein: '', naam: '',
    jaartal: '', druivenras: '',
    kleur: 'rood', mousserend: false, kwalificering: '',
    aantal: 1, prijs: '',
    opmerkingen: '', omschrijving: '', smaakprofiel: [],
    toegevoegdOp: new Date().toISOString(),
    ...veldwaarden,
  };
  return { ...state, inventory: [...state.inventory, item] };
}

export function werkItemBij(state, id, veldwaarden) {
  return {
    ...state,
    inventory: state.inventory.map((item) => (item.id === id ? { ...item, ...veldwaarden } : item)),
  };
}

export function pasAantalAan(state, id, delta) {
  return {
    ...state,
    inventory: state.inventory.map((item) => {
      if (item.id !== id) return item;
      const nieuwAantal = Math.max(0, (Number(item.aantal) || 0) + delta);
      return { ...item, aantal: nieuwAantal };
    }),
  };
}

export function verwijderItem(state, id) {
  return { ...state, inventory: state.inventory.filter((item) => item.id !== id) };
}

export function markeerOpgedronken(state, id) {
  const item = state.inventory.find((i) => i.id === id);
  if (!item) return state;
  const historyEntry = {
    id: item.id,
    domein: item.domein,
    naam: item.naam,
    jaartal: item.jaartal,
    datum: new Date().toISOString(),
  };
  const nieuwAantal = Math.max(0, (Number(item.aantal) || 0) - 1);
  const nieuweInventory = nieuwAantal === 0
    ? state.inventory.filter((i) => i.id !== id)
    : state.inventory.map((i) => (i.id === id ? { ...i, aantal: nieuwAantal } : i));

  return {
    ...state,
    inventory: nieuweInventory,
    history: [historyEntry, ...state.history],
  };
}
