// js/render/pairingModal.js — "wat drink ik hierbij?" contextuele suggestie.
import { escapeHtml } from '../utils.js';

export function renderPairingModal({ status = 'idle', vraag = '', suggesties = [], foutmelding = '' } = {}) {
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal modal-pairing" data-stop-propagation>
        <div class="modal-header">
          <h2>Wat drink ik hierbij?</h2>
          <button class="icon-btn" data-action="close-modal" aria-label="Sluiten">✕</button>
        </div>
        <div class="modal-body">
          <form id="pairing-form">
            <label class="field field-full">
              <span class="field-label">Beschrijf de gelegenheid of het gerecht</span>
              <textarea id="pairing-vraag" rows="2" placeholder="bv. 'dit eten we vanavond: gegrilde zalm met citroen'">${escapeHtml(vraag)}</textarea>
            </label>
            <button type="submit" class="btn btn-primary" ${status === 'bezig' ? 'disabled' : ''}>
              ${status === 'bezig' ? 'Zoeken in je kelder…' : 'Suggereer'}
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
    return '<p class="detail-empty">Geen goede match gevonden in je huidige voorraad.</p>';
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
