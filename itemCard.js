// js/render/itemCard.js — kaart voor één wijn-item, hergebruikt in meerdere tabs.
import { escapeHtml, breekbaarLabel, formatteerPrijs } from '../utils.js';
import { renderGauge } from './gauge.js';

const KLEUR_ICOON = { rood: '●', wit: '○', rosé: '◐', oranje: '◑', versterkt: '◆' };

export function renderItemCard(wijn) {
  const icoon = KLEUR_ICOON[wijn.kleur] || '●';
  const subtitel = [wijn.domein, wijn.jaartal].filter(Boolean).map(escapeHtml).join(' · ');
  const herkomst = [wijn.gebied, wijn.land].filter(Boolean).map(escapeHtml).join(', ');

  return `
    <article class="wine-card" data-action="open-detail" data-id="${escapeHtml(wijn.id)}">
      <div class="wine-card-top">
        <span class="wine-color-dot wine-color-${escapeHtml(wijn.kleur)}" aria-hidden="true">${icoon}</span>
        <div class="wine-card-heading">
          <h3 class="wine-name">${escapeHtml(wijn.naam) || 'Unnamed item'}</h3>
          ${subtitel ? `<p class="wine-sub">${subtitel}</p>` : ''}
          ${herkomst ? `<p class="wine-origin">${herkomst}</p>` : ''}
        </div>
        <span class="wine-count-badge">${escapeHtml(wijn.aantal ?? 0)}×</span>
      </div>

      ${wijn.druivenras ? `<p class="wine-meta">${breekbaarLabel(escapeHtml(wijn.druivenras))}</p>` : ''}
      ${wijn.kwalificering ? `<p class="wine-meta wine-meta-mono">${breekbaarLabel(escapeHtml(wijn.kwalificering))}</p>` : ''}

      ${renderGauge(wijn, { compact: true })}

      <div class="wine-card-bottom">
        <span class="wine-price">${formatteerPrijs(wijn.prijs)}</span>
        <div class="wine-card-actions">
          <button class="icon-btn" data-action="adjust" data-id="${escapeHtml(wijn.id)}" data-delta="-1" aria-label="Decrease quantity">−</button>
          <button class="icon-btn" data-action="adjust" data-id="${escapeHtml(wijn.id)}" data-delta="1" aria-label="Increase quantity">+</button>
          <button class="icon-btn" data-action="drink" data-id="${escapeHtml(wijn.id)}" aria-label="Mark as finished">✓</button>
        </div>
      </div>
    </article>
  `;
}

export function renderLegeStaat(titel, tekst, actieLabel = '', actieData = '') {
  return `
    <div class="empty-state">
      <p class="empty-title">${escapeHtml(titel)}</p>
      <p class="empty-text">${escapeHtml(tekst)}</p>
      ${actieLabel ? `<button class="btn btn-secondary" data-action="${escapeHtml(actieData)}">${escapeHtml(actieLabel)}</button>` : ''}
    </div>
  `;
}
