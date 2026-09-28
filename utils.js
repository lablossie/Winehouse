// js/utils.js — kleine, afhankelijkheidsvrije hulpfuncties

/**
 * Escaped een string voor veilig gebruik in innerHTML.
 * ALTIJD gebruiken voor elk stuk gebruikersdata dat in een template string
 * terechtkomt — voorkomt zowel XSS als gebroken markup door bv. apostrofs
 * in wijnnamen ("L'Ecole", "Château d'Yquem").
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Voegt een spatie toe na een puntvoorvoegsel in labels zoals "VDP.Ortswein"
 * zodat ze niet lelijk midden in het woord afbreken in kleine badges.
 * (zie valkuil #6 in de bouwgids)
 */
export function breekbaarLabel(value) {
  if (!value) return '';
  return String(value).replace(/\.(?=\S)/g, '. ');
}

export function formatteerPrijs(bedrag) {
  const n = Number(bedrag);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

export function formatteerDatum(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function nieuwId(prefix, bestaandeIds) {
  let n = bestaandeIds.length;
  let id = `${prefix}${n}`;
  const idSet = new Set(bestaandeIds);
  while (idSet.has(id)) {
    n += 1;
    id = `${prefix}${n}`;
  }
  return id;
}

export function debounce(fn, wait = 150) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Slaat de huidige focus + cursorpositie op zodat die na een re-render kan
 * worden hersteld (zie valkuil #1 — render() herschrijft de hele container,
 * wat anders elke input-focus zou breken tijdens typen).
 */
export function bewaarFocus(containerEl) {
  const active = document.activeElement;
  if (!active || !containerEl.contains(active)) return null;
  return {
    id: active.id || null,
    dataset: { ...active.dataset },
    tagName: active.tagName,
    selectionStart: 'selectionStart' in active ? active.selectionStart : null,
    selectionEnd: 'selectionEnd' in active ? active.selectionEnd : null,
  };
}

export function herstelFocus(containerEl, saved) {
  if (!saved) return;
  let target = null;
  if (saved.id) {
    target = containerEl.querySelector(`#${CSS.escape(saved.id)}`);
  } else if (saved.dataset && saved.dataset.focusKey) {
    target = containerEl.querySelector(`[data-focus-key="${CSS.escape(saved.dataset.focusKey)}"]`);
  }
  if (!target) return;
  target.focus();
  if (saved.selectionStart !== null && typeof target.setSelectionRange === 'function') {
    try {
      target.setSelectionRange(saved.selectionStart, saved.selectionEnd);
    } catch {
      /* input type ondersteunt geen selection range (bv. type=number) — negeren */
    }
  }
}

/**
 * Herstelt de scrollpositie van elk horizontaal scrollbaar element met een
 * actief kind (bv. de tabbalk) na een re-render. Goedkoop om elke render aan
 * te roepen — doet niets als het element al zichtbaar is. (valkuil #11)
 */
export function scrollActieveInBeeld(containerEl) {
  const active = containerEl.querySelector('.tab-btn.active, .filter-chip.active');
  if (active) {
    active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
