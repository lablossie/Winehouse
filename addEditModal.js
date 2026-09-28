// js/render/addEditModal.js — modal voor toevoegen/bewerken van een item.
import { escapeHtml } from '../utils.js';
import { KLEUREN } from '../model.js';

const KLEUR_LABEL = { rood: 'Rood', wit: 'Wit', rosé: 'Rosé', oranje: 'Oranje', versterkt: 'Versterkt' };

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
          <h2>${isBewerken ? 'Item bewerken' : 'Nieuw item'}</h2>
          <button class="icon-btn" data-action="close-modal" aria-label="Sluiten">✕</button>
        </div>
        <form id="item-form" class="modal-body" data-id="${escapeHtml(w.id || '')}">
          <div class="field-grid">
            ${veld('naam', 'Naam', w.naam, { required: true, placeholder: 'bv. Château Something' })}
            ${veld('domein', 'Producent / domein', w.domein)}
            ${veld('land', 'Land', w.land)}
            ${veld('gebied', 'Gebied', w.gebied)}
            ${veld('jaartal', 'Jaartal', w.jaartal, { type: 'number', placeholder: '2019' })}
            ${veld('druivenras', 'Druivenras', w.druivenras)}
            ${veld('kwalificering', 'Kwalificering', w.kwalificering, { placeholder: 'bv. AOC, DOCG, Grand Cru' })}
            ${veld('aantal', 'Aantal flessen', w.aantal, { type: 'number' })}
            ${veld('prijs', 'Prijs per fles (€)', w.prijs, { type: 'number' })}

            <label class="field">
              <span class="field-label">Kleur</span>
              <select id="kleur" name="kleur">${kleurOpties}</select>
            </label>

            <label class="field field-checkbox">
              <input type="checkbox" id="mousserend" name="mousserend" ${w.mousserend ? 'checked' : ''} />
              <span class="field-label">Mousserend</span>
            </label>
          </div>

          <label class="field field-full">
            <span class="field-label">Opmerkingen</span>
            <textarea id="opmerkingen" name="opmerkingen" rows="2" placeholder="Van wie gekregen, gelegenheid, ...">${escapeHtml(w.opmerkingen || '')}</textarea>
          </label>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" data-action="close-modal">Annuleren</button>
            ${isBewerken ? `<button type="button" class="btn btn-danger" data-action="delete-item" data-id="${escapeHtml(w.id)}">Verwijderen</button>` : ''}
            <button type="submit" class="btn btn-primary" ${bezig ? 'disabled' : ''}>${bezig ? 'Opslaan…' : 'Opslaan'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
