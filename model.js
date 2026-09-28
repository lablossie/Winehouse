// js/model.js — domeinlogica specifiek voor wijn (rijpingsberekening, kleuren, sortering)

export const KLEUREN = ['rood', 'wit', 'rosé', 'oranje', 'versterkt'];

// Substrings (lowercase) in het kwalificatieveld die wijzen op hoger
// verouderingspotentieel. Simpele, best-effort heuristiek — geen exacte wetenschap.
const HOGE_KWALIFICATIE_SIGNALEN = [
  'grand cru', '1er cru', 'premier cru', 'riserva', 'gran reserva', 'reserva',
  'docg', 'grosses gewächs', 'gg', 'cru classé', 'cru classe', 'vendange tardive',
  'trockenbeerenauslese', 'beerenauslese', 'sélection de grains nobles',
];

function heeftHogeKwalificatie(kwalificering = '') {
  const laag = kwalificering.toLowerCase();
  return HOGE_KWALIFICATIE_SIGNALEN.some((signaal) => laag.includes(signaal));
}

/**
 * Schat een drinkvenster (in jaren sinds jaartal) op basis van kleur,
 * mousserend en kwalificatie. Geeft { minJaren, maxJaren } terug.
 */
export function schatDrinkvenster(wijn) {
  const hoog = heeftHogeKwalificatie(wijn.kwalificering);

  if (wijn.mousserend) {
    return hoog ? { minJaren: 2, maxJaren: 8 } : { minJaren: 0, maxJaren: 3 };
  }
  if (wijn.kleur === 'rosé') {
    return { minJaren: 0, maxJaren: 2 };
  }
  if (wijn.kleur === 'wit' || wijn.kleur === 'oranje') {
    return hoog ? { minJaren: 2, maxJaren: 10 } : { minJaren: 0, maxJaren: 4 };
  }
  if (wijn.kleur === 'versterkt') {
    return { minJaren: 1, maxJaren: 20 };
  }
  // rood (default)
  return hoog ? { minJaren: 3, maxJaren: 15 } : { minJaren: 1, maxJaren: 5 };
}

/**
 * Berekent de rijpingsstatus van een wijn op basis van het huidige jaar.
 * Retourneert een object klaar voor de gauge-render.
 */
export function berekenRijping(wijn, referentiejaar = new Date().getFullYear()) {
  if (!wijn.jaartal) {
    return { percent: 0, status: 'onbekend', label: 'Vintage unknown', ageJaren: null };
  }
  const ageJaren = Math.max(0, referentiejaar - Number(wijn.jaartal));
  const { minJaren, maxJaren } = schatDrinkvenster(wijn);

  let status;
  let label;
  let percent;

  if (ageJaren < minJaren) {
    status = 'jong';
    label = `Still young — ${minJaren - ageJaren} yr until its window`;
    percent = maxJaren > 0 ? Math.round((ageJaren / minJaren) * 33) : 0;
  } else if (ageJaren <= maxJaren) {
    status = 'optimaal';
    const resterend = maxJaren - ageJaren;
    label = resterend <= 1 ? 'At its best now — drink soon' : 'In its optimal drinking window';
    const spanne = Math.max(1, maxJaren - minJaren);
    percent = 33 + Math.round(((ageJaren - minJaren) / spanne) * 50);
  } else {
    status = 'over-piek';
    label = `${ageJaren - maxJaren} yr past its estimated window`;
    percent = 90 + Math.min(10, (ageJaren - maxJaren) * 2);
  }

  return { percent: Math.min(100, percent), status, label, ageJaren, minJaren, maxJaren };
}

/** Items die binnen ~1 jaar hun venster uitlopen of er al voorbij zijn. */
export function isDrinkBinnenkort(wijn) {
  const rijping = berekenRijping(wijn);
  if (rijping.status === 'over-piek') return true;
  if (rijping.status === 'optimaal' && rijping.maxJaren - rijping.ageJaren <= 1) return true;
  return false;
}

export function sorteerItems(items, sortering) {
  const kopie = [...items];
  switch (sortering) {
    case 'naam':
      return kopie.sort((a, b) => a.naam.localeCompare(b.naam, 'en'));
    case 'prijs-hoog':
      return kopie.sort((a, b) => (Number(b.prijs) || 0) - (Number(a.prijs) || 0));
    case 'prijs-laag':
      return kopie.sort((a, b) => (Number(a.prijs) || 0) - (Number(b.prijs) || 0));
    case 'urgentie':
      return kopie.sort((a, b) => berekenRijping(b).percent - berekenRijping(a).percent);
    case 'jaartal':
      return kopie.sort((a, b) => (Number(a.jaartal) || 0) - (Number(b.jaartal) || 0));
    case 'nieuw':
      return kopie.sort((a, b) => (b.toegevoegdOp || '').localeCompare(a.toegevoegdOp || ''));
    default:
      return kopie;
  }
}

export function telPerKleur(items) {
  const telling = Object.fromEntries(KLEUREN.map((k) => [k, 0]));
  for (const item of items) {
    if (telling[item.kleur] !== undefined) telling[item.kleur] += 1;
  }
  return telling;
}

/** Bouwt de hiërarchie land → gebied → producent → item voor de navigatieweergave. */
export function bouwHierarchie(items) {
  const boom = {};
  for (const item of items) {
    const land = item.land || 'Unknown country';
    const gebied = item.gebied || 'Unknown region';
    const producent = item.domein || 'Unknown producer';
    boom[land] ??= {};
    boom[land][gebied] ??= {};
    boom[land][gebied][producent] ??= [];
    boom[land][gebied][producent].push(item);
  }
  return boom;
}
