// js/render/overigeTabs.js — de drie secundaire tabs.
import { escapeHtml, formatteerDatum } from '../utils.js';
import { isDrinkBinnenkort, sorteerItems } from '../model.js';
import { renderItemCard, renderLegeStaat } from './itemCard.js';

export function renderOnlangsTab(state) {
  const onlangs = sorteerItems(
    state.inventory.filter((i) => i.toegevoegdOp),
    'nieuw',
  ).slice(0, 40);

  return `
    <p class="tab-intro">De laatst toegevoegde items, nieuwste eerst — handig na een batch-foto-import.</p>
    <div class="card-grid">
      ${onlangs.map(renderItemCard).join('') || renderLegeStaat('Nog niets toegevoegd', 'Nieuw toegevoegde items verschijnen hier het eerst.')}
    </div>
  `;
}

export function renderDrinkBinnenkortTab(state) {
  const items = sorteerItems(state.inventory.filter(isDrinkBinnenkort), 'urgentie');

  return `
    <p class="tab-intro">Items die nu op hun best zijn of hun geschatte venster voorbij zijn.</p>
    <div class="card-grid">
      ${items.map(renderItemCard).join('') || renderLegeStaat('Niets urgents', 'Alles in je kelder heeft nog rustig de tijd.')}
    </div>
  `;
}

export function renderHistorieTab(state) {
  const geschiedenis = [...state.history].sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));

  if (geschiedenis.length === 0) {
    return renderLegeStaat('Nog geen historie', 'Zodra je een fles als opgedronken markeert, verschijnt die hier.');
  }

  const rijen = geschiedenis.map(
    (entry) => `
      <tr>
        <td>${escapeHtml(entry.naam) || '—'}</td>
        <td>${escapeHtml(entry.domein) || '—'}</td>
        <td>${escapeHtml(entry.jaartal) || '—'}</td>
        <td>${formatteerDatum(entry.datum)}</td>
      </tr>
    `,
  ).join('');

  return `
    <div class="table-wrap">
      <table class="history-table">
        <thead><tr><th>Naam</th><th>Producent</th><th>Jaartal</th><th>Opgedronken op</th></tr></thead>
        <tbody>${rijen}</tbody>
      </table>
    </div>
  `;
}
