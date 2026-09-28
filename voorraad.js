// js/render/voorraad.js — hoofdtab: kleurfilters + sortering, of hiërarchie-navigatie.
import { escapeHtml } from '../utils.js';
import { KLEUREN, telPerKleur, sorteerItems, bouwHierarchie } from '../model.js';
import { renderItemCard, renderLegeStaat } from './itemCard.js';

const KLEUR_LABEL = { rood: 'Rood', wit: 'Wit', rosé: 'Rosé', oranje: 'Oranje', versterkt: 'Versterkt' };
const SORT_OPTIES = [
  { id: 'naam', label: 'A-Z' },
  { id: 'jaartal', label: 'Jaartal' },
  { id: 'prijs-hoog', label: 'Prijs (hoog-laag)' },
  { id: 'prijs-laag', label: 'Prijs (laag-hoog)' },
  { id: 'urgentie', label: 'Urgentie' },
];

function pasZoektermToe(items, zoekterm) {
  if (!zoekterm.trim()) return items;
  const q = zoekterm.trim().toLowerCase();
  return items.filter((item) =>
    [item.naam, item.domein, item.druivenras, item.land, item.gebied, item.kleur]
      .filter(Boolean)
      .some((veld) => String(veld).toLowerCase().includes(q)));
}

function renderKleurFilters(items, actieveKleur) {
  const tellingen = telPerKleur(items);
  const alleChip = `
    <button class="filter-chip ${actieveKleur === 'alle' ? 'active' : ''}" data-action="filter-kleur" data-kleur="alle">
      Alle <span class="chip-count">${items.length}</span>
    </button>
  `;
  const chips = KLEUREN.map(
    (kleur) => `
      <button class="filter-chip ${actieveKleur === kleur ? 'active' : ''}" data-action="filter-kleur" data-kleur="${kleur}">
        ${KLEUR_LABEL[kleur]} <span class="chip-count">${tellingen[kleur]}</span>
      </button>
    `,
  ).join('');

  return `<div class="filter-row">${alleChip}${chips}</div>`;
}

function renderSortSelect(sortering) {
  const opties = SORT_OPTIES.map(
    (optie) => `<option value="${optie.id}" ${sortering === optie.id ? 'selected' : ''}>${optie.label}</option>`,
  ).join('');
  return `
    <select class="sort-select" id="sort-select" data-action-change="set-sortering">${opties}</select>
  `;
}

function renderHierarchieNav(items, pad) {
  const boom = bouwHierarchie(items);
  const [land, gebied, producent] = pad;

  if (!land) {
    const landen = Object.keys(boom).sort((a, b) => a.localeCompare(b, 'nl'));
    return `
      <div class="hier-crumbs"></div>
      <div class="hier-list">
        ${landen.map((l) => `
          <button class="hier-row" data-action="hier-nav" data-land="${escapeHtml(l)}">
            <span>${escapeHtml(l)}</span>
            <span class="hier-count">${Object.values(boom[l]).reduce((s, g) => s + Object.values(g).reduce((s2, p) => s2 + p.length, 0), 0)} items</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  if (land && !gebied) {
    const gebieden = Object.keys(boom[land] || {}).sort((a, b) => a.localeCompare(b, 'nl'));
    return `
      ${renderCrumbs(pad)}
      <div class="hier-list">
        ${gebieden.map((g) => `
          <button class="hier-row" data-action="hier-nav" data-land="${escapeHtml(land)}" data-gebied="${escapeHtml(g)}">
            <span>${escapeHtml(g)}</span>
            <span class="hier-count">${Object.values(boom[land][g]).reduce((s, p) => s + p.length, 0)} items</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  if (land && gebied && !producent) {
    const producenten = Object.keys((boom[land] || {})[gebied] || {}).sort((a, b) => a.localeCompare(b, 'nl'));
    return `
      ${renderCrumbs(pad)}
      <div class="hier-list">
        ${producenten.map((p) => `
          <button class="hier-row" data-action="hier-nav" data-land="${escapeHtml(land)}" data-gebied="${escapeHtml(gebied)}" data-producent="${escapeHtml(p)}">
            <span>${escapeHtml(p)}</span>
            <span class="hier-count">${boom[land][gebied][p].length} items</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  const bladItems = (((boom[land] || {})[gebied] || {})[producent] || []);
  return `
    ${renderCrumbs(pad)}
    <div class="card-grid">${bladItems.map(renderItemCard).join('') || renderLegeStaat('Geen items', 'Deze producent heeft nog geen items in voorraad.')}</div>
  `;
}

function renderCrumbs(pad) {
  const [land, gebied, producent] = pad;
  const delen = [
    { label: 'Landen', land: '', gebied: '', producent: '' },
    land && { label: land, land, gebied: '', producent: '' },
    gebied && { label: gebied, land, gebied, producent: '' },
    producent && { label: producent, land, gebied, producent },
  ].filter(Boolean);

  return `
    <div class="hier-crumbs">
      ${delen.map((d, i) => `
        ${i > 0 ? '<span class="crumb-sep">›</span>' : ''}
        <button class="crumb-btn" data-action="hier-nav" data-land="${escapeHtml(d.land)}" data-gebied="${escapeHtml(d.gebied)}" data-producent="${escapeHtml(d.producent)}">
          ${escapeHtml(d.label)}
        </button>
      `).join('')}
    </div>
  `;
}

export function renderVoorraadTab(state, ui) {
  const alles = pasZoektermToe(state.inventory, ui.zoekterm);

  const viewToggle = `
    <div class="view-toggle">
      <button class="toggle-btn ${ui.viewMode === 'kleur' ? 'active' : ''}" data-action="set-viewmode" data-mode="kleur">Per kleur</button>
      <button class="toggle-btn ${ui.viewMode === 'hierarchie' ? 'active' : ''}" data-action="set-viewmode" data-mode="hierarchie">Per herkomst</button>
    </div>
  `;

  if (ui.zoekterm.trim()) {
    // Tijdens zoeken: altijd platte lijst, ongeacht viewMode.
    const gevonden = sorteerItems(alles, ui.sortering);
    return `
      ${viewToggle}
      <div class="filter-row-placeholder"></div>
      <p class="result-count">${gevonden.length} resultaat${gevonden.length === 1 ? '' : 'en'} voor "${escapeHtml(ui.zoekterm)}"</p>
      <div class="card-grid">${gevonden.map(renderItemCard).join('') || renderLegeStaat('Niets gevonden', 'Probeer een andere zoekterm.')}</div>
    `;
  }

  if (ui.viewMode === 'hierarchie') {
    return `${viewToggle}${renderHierarchieNav(alles, ui.hierarchyPad)}`;
  }

  const gefilterd = ui.kleurFilter === 'alle' ? alles : alles.filter((i) => i.kleur === ui.kleurFilter);
  const gesorteerd = sorteerItems(gefilterd, ui.sortering);

  return `
    ${viewToggle}
    ${renderKleurFilters(alles, ui.kleurFilter)}
    <div class="sort-row">${renderSortSelect(ui.sortering)}</div>
    <div class="card-grid">
      ${gesorteerd.map(renderItemCard).join('') || renderLegeStaat('Nog geen wijn', 'Voeg je eerste fles toe met de + knop of via een foto.', 'Item toevoegen', 'open-add')}
    </div>
  `;
}
