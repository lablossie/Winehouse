import { authHeaders } from './auth.js';

/**
 * Asks Claude to pick the best-matching wine(s) from the current in-stock
 * inventory for a given dish. Returns an array of {id, reason}.
 * Throws with a user-facing message on failure.
 */
export async function findWinePairing(dish, inventory) {
  const wines = inventory
    .filter((w) => Number(w.quantity) > 0)
    .map((w) => ({
      id: w.id,
      name: w.name,
      estate: w.estate,
      grapeVariety: w.grapeVariety,
      color: w.color,
      sparkling: w.sparkling,
      country: w.country,
      region: w.region,
      vintage: w.vintage,
      classification: w.classification,
      flavorProfile: w.flavorProfile || [],
    }));

  if (wines.length === 0) {
    throw new Error('Je hebt nog geen wijnen op voorraad.');
  }

  const res = await fetch('/api/pairing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ dish, wines }),
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Onverwachte reactie van de server.');
  }

  if (!res.ok) {
    throw new Error(data.error || 'Zoeken naar een passende wijn is mislukt.');
  }

  return Array.isArray(data.matches) ? data.matches : [];
}
