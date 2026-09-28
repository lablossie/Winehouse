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
    <p class="tab-intro">The most recently added items, newest first — handy after a batch photo import.</p>
    <div class="card-grid">
      ${onlangs.map(renderItemCard).join('') || renderLegeStaat('Nothing added yet', 'Newly added items appear here first.')}
    </div>
  `;
}

export function renderDrinkBinnenkortTab(state) {
  const items = sorteerItems(state.inventory.filter(isDrinkBinnenkort), 'urgentie');

  return `
    <p class="tab-intro">Items that are at their peak now, or past their estimated window.</p>
    <div class="card-grid">
      ${items.map(renderItemCard).join('') || renderLegeStaat('Nothing urgent', 'Everything in your cellar still has plenty of time.')}
    </div>
  `;
}

export function renderHistorieTab(state) {
  const geschiedenis = [...state.history].sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));

  if (geschiedenis.length === 0) {
    return renderLegeStaat('No history yet', 'Once you mark a bottle as finished, it will show up here.');
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
        <thead><tr><th>Name</th><th>Producer</th><th>Vintage</th><th>Finished on</th></tr></thead>
        <tbody>${rijen}</tbody>
      </table>
    </div>
  `;
}
