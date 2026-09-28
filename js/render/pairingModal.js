import { escapeHtml } from '../utils.js';

export function pairingModalHTML(ui, state) {
  if (!ui.pairingModalOpen) return '';
  const status = ui.pairingStatus;
  const statusHTML = status ? `<div class="import-status ${status.state}">${escapeHtml(status.message)}</div>` : '';
  const busy = !!(status && status.state === 'busy');

  const resultsHTML = (ui.pairingResults || [])
    .map((m) => {
      const wine = state.inventory.find((w) => w.id === m.id);
      if (!wine) return '';
      return `
        <button class="pairing-result" data-action="open-detail-from-pairing" data-id="${escapeHtml(wine.id)}">
          <div class="pairing-result-name">${escapeHtml(wine.name)}</div>
          <div class="wine-meta-domein">${escapeHtml(wine.estate)} · ${escapeHtml(wine.region)}, ${escapeHtml(wine.country)}</div>
          <p class="pairing-result-reason">${escapeHtml(m.reason)}</p>
        </button>`;
    })
    .join('');

  return `
    <div class="modal-backdrop" data-action="backdrop-close-pairing">
      <div class="modal">
        <h3>Welke wijn past hierbij?</h3>
        <p class="photo-upload-hint" style="margin:0 0 14px;">Typ een gerecht — Claude zoekt de best passende wijn uit je eigen voorraad.</p>
        <div class="field">
          <label>Gerecht</label>
          <input id="pairing-input" placeholder="bv. mosselen, gegrilde zalm, kaasfondue…" value="${escapeHtml(ui.pairingQuery || '')}" ${busy ? 'disabled' : ''}>
        </div>
        <div class="modal-actions" style="margin-top:4px;">
          <button class="btn-secondary" data-action="close-pairing">Sluiten</button>
          <button class="btn-primary" data-action="submit-pairing" ${busy ? 'disabled' : ''}>${busy ? 'Zoeken…' : 'Zoek een wijn'}</button>
        </div>
        ${statusHTML}
        ${resultsHTML ? `<div class="pairing-results">${resultsHTML}</div>` : ''}
      </div>
    </div>`;
}
