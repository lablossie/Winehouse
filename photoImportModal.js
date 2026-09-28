// js/render/photoImportModal.js — foto-upload + voorgestelde items ter controle.
import { escapeHtml } from '../utils.js';
import { KLEUREN } from '../model.js';

const KLEUR_LABEL = { rood: 'Red', wit: 'White', rosé: 'Rosé', oranje: 'Orange', versterkt: 'Fortified' };

export function renderPhotoImportModal({ status = 'idle', kandidaten = [], foutmelding = '' } = {}) {
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal modal-photo" data-stop-propagation>
        <div class="modal-header">
          <h2>Recognize from photo</h2>
          <button class="icon-btn" data-action="close-modal" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          ${status === 'idle' ? renderUploadZone() : ''}
          ${status === 'bezig' ? renderBezig() : ''}
          ${status === 'fout' ? renderFout(foutmelding) : ''}
          ${status === 'resultaten' ? renderKandidaten(kandidaten) : ''}
        </div>
      </div>
    </div>
  `;
}

function renderUploadZone() {
  return `
    <p class="modal-intro">
      Upload one or more photos — of bottles or of a receipt. Multiple items in
      one photo will be recognized.
    </p>
    <label class="photo-drop">
      <input type="file" id="photo-input" accept="image/*" multiple hidden />
      <span>📷 Choose photos</span>
    </label>
  `;
}

function renderBezig() {
  return `
    <div class="photo-loading">
      <div class="spinner"></div>
      <p>Recognizing photos…</p>
    </div>
  `;
}

function renderFout(foutmelding) {
  return `
    <p class="pin-error">${escapeHtml(foutmelding || 'Something went wrong while recognizing.')}</p>
    <button class="btn btn-secondary" data-action="photo-retry">Try again</button>
  `;
}

function renderKandidaten(kandidaten) {
  if (kandidaten.length === 0) {
    return `
      <p class="detail-empty">No items recognized in the photo(s). Try a clearer photo or add manually.</p>
      <button class="btn btn-secondary" data-action="photo-retry">Try again</button>
    `;
  }

  return `
    <p class="modal-intro">Check the recognized items and adjust as needed before adding.</p>
    <div class="kandidaten-lijst">
      ${kandidaten.map((k, i) => renderKandidaatRij(k, i)).join('')}
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button>
      <button type="button" class="btn btn-primary" data-action="confirm-photo-import">
        Add ${kandidaten.filter((k) => k.opgenomen !== false).length} item(s)
      </button>
    </div>
  `;
}

function renderKandidaatRij(k, i) {
  const kleurOpties = KLEUREN.map(
    (kleur) => `<option value="${kleur}" ${k.kleur === kleur ? 'selected' : ''}>${KLEUR_LABEL[kleur]}</option>`,
  ).join('');

  return `
    <div class="kandidaat-row ${k.opgenomen === false ? 'kandidaat-uitgesloten' : ''}">
      <label class="field-checkbox kandidaat-toggle">
        <input type="checkbox" data-action="toggle-kandidaat" data-index="${i}" ${k.opgenomen !== false ? 'checked' : ''} />
      </label>
      <div class="kandidaat-fields">
        <input type="text" data-action="edit-kandidaat" data-index="${i}" data-field="naam" value="${escapeHtml(k.naam || '')}" placeholder="Name" />
        <input type="text" data-action="edit-kandidaat" data-index="${i}" data-field="domein" value="${escapeHtml(k.domein || '')}" placeholder="Producer" />
        <input type="number" data-action="edit-kandidaat" data-index="${i}" data-field="jaartal" value="${escapeHtml(k.jaartal || '')}" placeholder="Vintage" />
        <select data-action="edit-kandidaat" data-index="${i}" data-field="kleur">${kleurOpties}</select>
        <input type="number" data-action="edit-kandidaat" data-index="${i}" data-field="aantal" value="${escapeHtml(k.aantal || 1)}" placeholder="Quantity" min="1" />
      </div>
    </div>
  `;
}
