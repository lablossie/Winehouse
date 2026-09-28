import { cardHTML } from './card.js';
import { colorFilterRowHTML, matchesFilter } from './colorFilter.js';

export function renderByPrice(state, colorFilter) {
  const back = `<button class="back-btn" data-action="set-tab" data-tab="stock">&lsaquo; Terug</button>`;
  const heading = `
    <div class="domain-header">
      <div class="domain-name">Alle wijnen · prijs hoog naar laag</div>
    </div>`;
  const filterRow = colorFilterRowHTML(state.inventory, colorFilter);

  const items = state.inventory
    .filter((w) => matchesFilter(w, colorFilter))
    .slice()
    .sort((a, b) => Number(b.price || 0) - Number(a.price || 0));

  if (items.length === 0) {
    return (
      back +
      heading +
      filterRow +
      `<div class="empty-state"><div class="glyph">&#127863;</div><p>Geen wijnen gevonden voor dit filter.</p></div>`
    );
  }

  return back + heading + filterRow + items.map((w) => cardHTML(w, true)).join('');
}
