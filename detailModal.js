// js/render/detailModal.js — detailscherm per item, met AI-research-verrijking.
import { escapeHtml, breekbaarLabel, formatteerPrijs } from '../utils.js';
import { renderGauge } from './gauge.js';

export function renderDetailModal({ item, verrijkBezig = false }) {
  if (!item) return '';

  const kenmerken = Array.isArray(item.smaakprofiel) ? item.smaakprofiel : [];

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal modal-detail" data-stop-propagation>
        <div class="modal-header">
          <h2>${escapeHtml(item.naam) || 'Unnamed item'}</h2>
          <button class="icon-btn" data-action="close-modal" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <p class="detail-sub">${[item.domein, item.jaartal].filter(Boolean).map(escapeHtml).join(' · ')}</p>
          <p class="detail-origin">${[item.gebied, item.land].filter(Boolean).map(escapeHtml).join(', ')}</p>

          <div class="detail-tags">
            ${item.druivenras ? `<span class="tag">${breekbaarLabel(escapeHtml(item.druivenras))}</span>` : ''}
            ${item.kwalificering ? `<span class="tag tag-mono">${breekbaarLabel(escapeHtml(item.kwalificering))}</span>` : ''}
            ${item.mousserend ? '<span class="tag">Sparkling</span>' : ''}
          </div>

          ${renderGauge(item)}

          <div class="detail-stats">
            <div><span class="stat-label">Quantity</span><span class="stat-value">${escapeHtml(item.aantal ?? 0)}</span></div>
            <div><span class="stat-label">Price</span><span class="stat-value">${formatteerPrijs(item.prijs)}</span></div>
          </div>

          ${item.opmerkingen ? `<p class="detail-notes"><strong>Notes:</strong> ${escapeHtml(item.opmerkingen)}</p>` : ''}

          <div class="detail-research">
            <div class="detail-research-header">
              <h3>Background information</h3>
              <button class="btn btn-secondary btn-small" data-action="enrich-item" data-id="${escapeHtml(item.id)}" ${verrijkBezig ? 'disabled' : ''}>
                ${verrijkBezig ? 'Researching…' : (item.omschrijving ? 'Enrich again' : 'Enrich with AI')}
              </button>
            </div>
            ${item.omschrijving ? `<p class="detail-description">${escapeHtml(item.omschrijving)}</p>` : '<p class="detail-empty">No research done for this item yet.</p>'}
            ${kenmerken.length ? `
              <ul class="detail-profile">
                ${kenmerken.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" data-action="edit-item" data-id="${escapeHtml(item.id)}">Edit</button>
            <button type="button" class="btn btn-primary" data-action="drink" data-id="${escapeHtml(item.id)}">Mark as finished</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
