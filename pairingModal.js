// js/render/pairingModal.js — "wat drink ik hierbij?" contextuele suggestie.
import { escapeHtml } from '../utils.js';

export function renderPairingModal({ status = 'idle', vraag = '', suggesties = [], foutmelding = '' } = {}) {
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal modal-pairing" data-stop-propagation>
        <div class="modal-header">
          <h2>What should I drink with this?</h2>
          <button class="icon-btn" data-action="close-modal" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <form id="pairing-form">
            <label class="field field-full">
              <span class="field-label">Describe the occasion or the dish</span>
              <textarea id="pairing-vraag" rows="2" placeholder="e.g. 'having grilled salmon with lemon tonight'">${escapeHtml(vraag)}</textarea>
            </label>
            <button type="submit" class="btn btn-primary" ${status === 'bezig' ? 'disabled' : ''}>
              ${status === 'bezig' ? 'Searching your cellar…' : 'Suggest'}
            </button>
          </form>

          ${status === 'fout' ? `<p class="pin-error">${escapeHtml(foutmelding)}</p>` : ''}

          ${status === 'resultaten' ? renderSuggesties(suggesties) : ''}
        </div>
      </div>
    </div>
  `;
}

function renderSuggesties(suggesties) {
  if (suggesties.length === 0) {
    return '<p class="detail-empty">No good match found in your current stock.</p>';
  }
  return `
    <div class="suggestie-lijst">
      ${suggesties.map((s) => `
        <button class="suggestie-card" data-action="open-detail" data-id="${escapeHtml(s.id)}">
          <span class="suggestie-naam">${escapeHtml(s.naam)}</span>
          <span class="suggestie-reden">${escapeHtml(s.reden || '')}</span>
        </button>
      `).join('')}
    </div>
  `;
}
