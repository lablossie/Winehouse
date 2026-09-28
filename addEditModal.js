// js/render/addEditModal.js — modal voor toevoegen/bewerken van een item.
import { escapeHtml } from '../utils.js';
import { KLEUREN } from '../model.js';

const KLEUR_LABEL = { rood: 'Red', wit: 'White', rosé: 'Rosé', oranje: 'Orange', versterkt: 'Fortified' };

function veld(id, label, waarde, opts = {}) {
  const { type = 'text', required = false, placeholder = '' } = opts;
  return `
    <label class="field">
      <span class="field-label">${escapeHtml(label)}${required ? ' *' : ''}</span>
      <input
        type="${type}"
        id="${id}"
        name="${id}"
        value="${escapeHtml(waarde ?? '')}"
        placeholder="${escapeHtml(placeholder)}"
        ${required ? 'required' : ''}
      />
    </label>
  `;
}

export function renderAddEditModal({ item = null, bezig = false } = {}) {
  const isBewerken = Boolean(item);
  const w = item || {
    land: '', gebied: '', domein: '', naam: '', jaartal: '', druivenras: '',
    kleur: 'rood', mousserend: false, kwalificering: '', aantal: 1, prijs: '', opmerkingen: '',
  };

  const kleurOpties = KLEUREN.map(
    (k) => `<option value="${k}" ${w.kleur === k ? 'selected' : ''}>${KLEUR_LABEL[k]}</option>`,
  ).join('');

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal modal-form" data-stop-propagation>
        <div class="modal-header">
          <h2>${isBewerken ? 'Edit item' : 'New item'}</h2>
          <button class="icon-btn" data-action="close-modal" aria-label="Close">✕</button>
        </div>
        <form id="item-form" class="modal-body" data-id="${escapeHtml(w.id || '')}">
          <div class="field-grid">
            ${veld('naam', 'Name', w.naam, { required: true, placeholder: 'e.g. Château Something' })}
            ${veld('domein', 'Producer / estate', w.domein)}
            ${veld('land', 'Country', w.land)}
            ${veld('gebied', 'Region', w.gebied)}
            ${veld('jaartal', 'Vintage', w.jaartal, { type: 'number', placeholder: '2019' })}
            ${veld('druivenras', 'Grape variety', w.druivenras)}
            ${veld('kwalificering', 'Classification', w.kwalificering, { placeholder: 'e.g. AOC, DOCG, Grand Cru' })}
            ${veld('aantal', 'Number of bottles', w.aantal, { type: 'number' })}
            ${veld('prijs', 'Price per bottle (€)', w.prijs, { type: 'number' })}

            <label class="field">
              <span class="field-label">Color</span>
              <select id="kleur" name="kleur">${kleurOpties}</select>
            </label>

            <label class="field field-checkbox">
              <input type="checkbox" id="mousserend" name="mousserend" ${w.mousserend ? 'checked' : ''} />
              <span class="field-label">Sparkling</span>
            </label>
          </div>

          <label class="field field-full">
            <span class="field-label">Notes</span>
            <textarea id="opmerkingen" name="opmerkingen" rows="2" placeholder="Who gave it to you, the occasion, ...">${escapeHtml(w.opmerkingen || '')}</textarea>
          </label>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button>
            ${isBewerken ? `<button type="button" class="btn btn-danger" data-action="delete-item" data-id="${escapeHtml(w.id)}">Delete</button>` : ''}
            <button type="submit" class="btn btn-primary" ${bezig ? 'disabled' : ''}>${bezig ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
