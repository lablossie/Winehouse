// js/app.js — state, render(), event delegation, alle handlers.
// Eén centrale render()-functie herschrijft #app; alle interactie loopt via
// data-action-attributen (zie valkuil #2 in de bouwgids: nooit inline onclick).

import * as authMod from './auth.js';
import * as stateMod from './state.js';
import { exporteerCsv } from './csv.js';
import { bewaarFocus, herstelFocus, scrollActieveInBeeld, debounce } from './utils.js';

import { renderHeader, renderTabbar } from './render/chrome.js';
import { renderVoorraadTab } from './render/voorraad.js';
import { renderOnlangsTab, renderDrinkBinnenkortTab, renderHistorieTab } from './render/overigeTabs.js';
import { renderAddEditModal } from './render/addEditModal.js';
import { renderDetailModal } from './render/detailModal.js';
import { renderPhotoImportModal } from './render/photoImportModal.js';
import { renderPairingModal } from './render/pairingModal.js';

const appEl = document.getElementById('app');

let data = stateMod.leegState();

let ui = {
  authed: false,
  pinBezig: false,
  pinFout: '',
  laden: true,
  activeTab: 'voorraad',
  zoekterm: '',
  kleurFilter: 'alle',
  sortering: 'naam',
  viewMode: 'kleur',
  hierarchyPad: [],
  modal: null, // 'add' | 'edit' | 'detail' | 'photo' | 'pairing'
  modalItem: null,
  verrijkBezig: false,
  photoStatus: 'idle',
  photoKandidaten: [],
  photoFout: '',
  pairingStatus: 'idle',
  pairingVraag: '',
  pairingSuggesties: [],
  pairingFout: '',
};

function render() {
  const saved = bewaarFocus(appEl);
  const scrollY = window.scrollY;

  if (!ui.authed) {
    appEl.innerHTML = authMod.renderPinScherm({ foutmelding: ui.pinFout, bezig: ui.pinBezig });
    herstelFocus(appEl, saved);
    return;
  }

  const tabInhoud = {
    voorraad: () => renderVoorraadTab(data, ui),
    onlangs: () => renderOnlangsTab(data),
    'drink-binnenkort': () => renderDrinkBinnenkortTab(data),
    historie: () => renderHistorieTab(data),
  }[ui.activeTab]();

  let modalHtml = '';
  if (ui.modal === 'add') modalHtml = renderAddEditModal({ item: null });
  if (ui.modal === 'edit') modalHtml = renderAddEditModal({ item: ui.modalItem });
  if (ui.modal === 'detail') modalHtml = renderDetailModal({ item: ui.modalItem, verrijkBezig: ui.verrijkBezig });
  if (ui.modal === 'photo') {
    modalHtml = renderPhotoImportModal({ status: ui.photoStatus, kandidaten: ui.photoKandidaten, foutmelding: ui.photoFout });
  }
  if (ui.modal === 'pairing') {
    modalHtml = renderPairingModal({
      status: ui.pairingStatus, vraag: ui.pairingVraag, suggesties: ui.pairingSuggesties, foutmelding: ui.pairingFout,
    });
  }

  appEl.innerHTML = `
    ${renderHeader(ui)}
    ${renderTabbar(ui)}
    <main class="tab-content">${tabInhoud}</main>
    ${modalHtml}
  `;

  herstelFocus(appEl, saved);
  scrollActieveInBeeld(appEl);
  window.scrollTo(0, ui.modal ? 0 : scrollY);
}

// ---- Persistentie ----

async function bewaar(nieuweData) {
  data = nieuweData;
  render();
  try {
    await stateMod.bewaarNaarServer(data);
  } catch (fout) {
    if (fout.code === 401) {
      ui.authed = false;
      authMod.wisPin();
      render();
    }
  }
}

// ---- Init ----

async function init() {
  const pin = authMod.opgeslagenPin();
  if (pin) {
    ui.authed = true;
  }

  if (ui.authed) {
    await laadData();
  } else {
    ui.laden = false;
  }
  render();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

async function laadData() {
  try {
    data = await stateMod.syncState();
  } catch (fout) {
    if (fout.code === 401) {
      ui.authed = false;
      authMod.wisPin();
    }
  }
  ui.laden = false;
}

// ---- Event delegation ----

appEl.addEventListener('submit', async (e) => {
  if (e.target.id === 'pin-form') {
    e.preventDefault();
    const invoer = document.getElementById('pin-input');
    const pin = invoer.value.trim();
    authMod.bewaarPin(pin);
    ui.pinBezig = true;
    ui.pinFout = '';
    render();
    const geldig = await authMod.controleerPin();
    ui.pinBezig = false;
    if (geldig === false) {
      ui.pinFout = 'Onjuiste pincode, probeer opnieuw.';
      authMod.wisPin();
      render();
      return;
    }
    ui.authed = true;
    await laadData();
    render();
    return;
  }

  if (e.target.id === 'item-form') {
    e.preventDefault();
    const form = e.target;
    const id = form.dataset.id;
    const veldwaarden = {
      naam: form.naam.value.trim(),
      domein: form.domein.value.trim(),
      land: form.land.value.trim(),
      gebied: form.gebied.value.trim(),
      jaartal: form.jaartal.value ? Number(form.jaartal.value) : '',
      druivenras: form.druivenras.value.trim(),
      kwalificering: form.kwalificering.value.trim(),
      aantal: form.aantal.value ? Number(form.aantal.value) : 0,
      prijs: form.prijs.value ? Number(form.prijs.value) : '',
      kleur: form.kleur.value,
      mousserend: form.mousserend.checked,
      opmerkingen: form.opmerkingen.value.trim(),
    };

    const nieuweData = id
      ? stateMod.werkItemBij(data, id, veldwaarden)
      : stateMod.voegItemToe(data, veldwaarden);

    ui.modal = null;
    await bewaar(nieuweData);
    return;
  }

  if (e.target.id === 'pairing-form') {
    e.preventDefault();
    const vraag = document.getElementById('pairing-vraag').value.trim();
    if (!vraag) return;
    ui.pairingVraag = vraag;
    ui.pairingStatus = 'bezig';
    ui.pairingFout = '';
    render();
    await voerPairingUit(vraag);
  }
});

appEl.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const actie = el.dataset.action;
  const id = el.dataset.id;

  switch (actie) {
    case 'switch-tab':
      ui.activeTab = el.dataset.tab;
      render();
      break;

    case 'filter-kleur':
      ui.kleurFilter = el.dataset.kleur;
      render();
      break;

    case 'set-viewmode':
      ui.viewMode = el.dataset.mode;
      ui.hierarchyPad = [];
      render();
      break;

    case 'hier-nav':
      ui.hierarchyPad = [el.dataset.land, el.dataset.gebied, el.dataset.producent].filter(Boolean);
      render();
      break;

    case 'open-add':
      ui.modal = 'add';
      ui.modalItem = null;
      render();
      break;

    case 'open-detail': {
      const item = data.inventory.find((i) => i.id === id);
      if (!item) return;
      ui.modal = 'detail';
      ui.modalItem = item;
      render();
      break;
    }

    case 'edit-item': {
      const item = data.inventory.find((i) => i.id === id);
      if (!item) return;
      ui.modal = 'edit';
      ui.modalItem = item;
      render();
      break;
    }

    case 'close-modal':
      if (e.target !== el) break; // alleen sluiten bij klik op de backdrop zelf
      ui.modal = null;
      ui.modalItem = null;
      ui.photoStatus = 'idle';
      ui.photoKandidaten = [];
      ui.pairingStatus = 'idle';
      ui.pairingSuggesties = [];
      render();
      break;

    case 'adjust': {
      const delta = Number(el.dataset.delta);
      await bewaar(stateMod.pasAantalAan(data, id, delta));
      break;
    }

    case 'drink': {
      const nieuweData = stateMod.markeerOpgedronken(data, id);
      ui.modal = null;
      ui.modalItem = null;
      await bewaar(nieuweData);
      break;
    }

    case 'delete-item': {
      if (!confirm('Dit item definitief verwijderen?')) return;
      const nieuweData = stateMod.verwijderItem(data, id);
      ui.modal = null;
      ui.modalItem = null;
      await bewaar(nieuweData);
      break;
    }

    case 'export-csv':
      exporteerCsv(data.inventory);
      break;

    case 'open-photo-import':
      ui.modal = 'photo';
      ui.photoStatus = 'idle';
      ui.photoKandidaten = [];
      ui.photoFout = '';
      render();
      break;

    case 'photo-retry':
      ui.photoStatus = 'idle';
      ui.photoKandidaten = [];
      ui.photoFout = '';
      render();
      break;

    case 'toggle-kandidaat': {
      const i = Number(el.dataset.index);
      ui.photoKandidaten[i].opgenomen = el.checked;
      render(); // ververst de teller in de "Voeg X item(s) toe"-knop
      break;
    }

    case 'confirm-photo-import': {
      let nieuweData = data;
      for (const k of ui.photoKandidaten) {
        if (k.opgenomen === false) continue;
        nieuweData = stateMod.voegItemToe(nieuweData, {
          naam: k.naam || '', domein: k.domein || '', land: k.land || '', gebied: k.gebied || '',
          jaartal: k.jaartal || '', druivenras: k.druivenras || '', kleur: k.kleur || 'rood',
          mousserend: Boolean(k.mousserend), kwalificering: k.kwalificering || '',
          aantal: Number(k.aantal) || 1, prijs: k.prijs || '',
        });
      }
      ui.modal = null;
      ui.photoStatus = 'idle';
      ui.photoKandidaten = [];
      await bewaar(nieuweData);
      break;
    }

    case 'open-pairing':
      ui.modal = 'pairing';
      ui.pairingStatus = 'idle';
      ui.pairingSuggesties = [];
      ui.pairingFout = '';
      render();
      break;

    case 'enrich-item':
      await verrijkItem(id);
      break;

    default:
      break;
  }
});

// Kleine niet-render-behoeftige input-updates (checkbox, tekstveld) binnen de
// foto-kandidatenlijst, plus de zoekbalk (met debounce + focusbehoud) en de
// sorteer-select (via 'change').
appEl.addEventListener('input', (e) => {
  if (e.target.id === 'search-input') {
    zoekDebounced(e.target.value);
    return;
  }
  if (e.target.dataset.action === 'edit-kandidaat') {
    const i = Number(e.target.dataset.index);
    const veld = e.target.dataset.field;
    ui.photoKandidaten[i][veld] = e.target.value;
  }
});

appEl.addEventListener('change', (e) => {
  if (e.target.id === 'sort-select') {
    ui.sortering = e.target.value;
    render();
  }
  if (e.target.id === 'photo-input') {
    verwerkFotoUpload(e.target);
  }
  if (e.target.dataset.action === 'edit-kandidaat' && e.target.tagName === 'SELECT') {
    const i = Number(e.target.dataset.index);
    ui.photoKandidaten[i].kleur = e.target.value;
  }
});

const zoekDebounced = debounce((waarde) => {
  ui.zoekterm = waarde;
  render();
}, 150);

// ---- AI-aanroepen ----

async function verwerkFotoUpload(input) {
  // Belangrijk: eerst FileList omzetten naar een los array vóórdat input.value
  // wordt gereset — in sommige browsers is .files een levende referentie die
  // leegloopt zodra .value wordt gewist (valkuil #5).
  const bestanden = Array.from(input.files || []);
  input.value = '';
  if (bestanden.length === 0) return;

  ui.photoStatus = 'bezig';
  render();

  try {
    const base64Afbeeldingen = await Promise.all(bestanden.map(verkleinEnEncodeer));
    const res = await fetch('/api/recognize', {
      method: 'POST',
      headers: authMod.metAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ afbeeldingen: base64Afbeeldingen }),
    });
    if (res.status === 401) throw Object.assign(new Error('unauthorized'), { code: 401 });
    if (!res.ok) throw new Error('Herkenning is mislukt.');
    const kandidaten = await res.json();
    ui.photoKandidaten = (Array.isArray(kandidaten) ? kandidaten : []).map((k) => ({ ...k, opgenomen: true }));
    ui.photoStatus = 'resultaten';
  } catch (fout) {
    if (fout.code === 401) {
      ui.authed = false;
      authMod.wisPin();
      ui.modal = null;
      render();
      return;
    }
    ui.photoStatus = 'fout';
    ui.photoFout = fout.message || 'Er ging iets mis.';
  }
  render();
}

function verkleinEnEncodeer(bestand) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const MAX = 1500;
        let { width, height } = img;
        if (width > height && width > MAX) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else if (height > MAX) {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(bestand);
  });
}

async function verrijkItem(id) {
  ui.verrijkBezig = true;
  render();
  try {
    const item = data.inventory.find((i) => i.id === id);
    const res = await fetch('/api/enrich', {
      method: 'POST',
      headers: authMod.metAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ item }),
    });
    if (res.status === 401) throw Object.assign(new Error('unauthorized'), { code: 401 });
    if (!res.ok) throw new Error('Verrijken is mislukt.');
    const resultaat = await res.json();

    const updates = {
      omschrijving: resultaat.omschrijving || item.omschrijving || '',
      smaakprofiel: Array.isArray(resultaat.smaakprofiel) ? resultaat.smaakprofiel : (item.smaakprofiel || []),
    };
    // Prijs alleen toepassen als er nog geen (echte) prijs was ingevuld.
    if ((!item.prijs || Number(item.prijs) === 0) && resultaat.geschattePrijs) {
      updates.prijs = resultaat.geschattePrijs;
    }
    // Druivenras/gebied altijd corrigeren zodra het model een niet-lege waarde teruggeeft.
    if (resultaat.druivenras) updates.druivenras = resultaat.druivenras;
    if (resultaat.gebied) updates.gebied = resultaat.gebied;

    const nieuweData = stateMod.werkItemBij(data, id, updates);
    ui.modalItem = nieuweData.inventory.find((i) => i.id === id);
    ui.verrijkBezig = false;
    await bewaar(nieuweData);
  } catch (fout) {
    ui.verrijkBezig = false;
    if (fout.code === 401) {
      ui.authed = false;
      authMod.wisPin();
      ui.modal = null;
    }
    render();
  }
}

async function voerPairingUit(vraag) {
  try {
    const voorraadSamenvatting = data.inventory
      .filter((i) => Number(i.aantal) > 0)
      .map((i) => ({ id: i.id, naam: i.naam, kleur: i.kleur, druivenras: i.druivenras, land: i.land, jaartal: i.jaartal }));

    const res = await fetch('/api/pairing', {
      method: 'POST',
      headers: authMod.metAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ vraag, voorraad: voorraadSamenvatting }),
    });
    if (res.status === 401) throw Object.assign(new Error('unauthorized'), { code: 401 });
    if (!res.ok) throw new Error('Suggestie ophalen is mislukt.');
    const suggesties = await res.json();

    const geldigeIds = new Set(data.inventory.map((i) => i.id));
    ui.pairingSuggesties = (Array.isArray(suggesties) ? suggesties : [])
      .filter((s) => geldigeIds.has(s.id))
      .map((s) => ({ ...s, naam: data.inventory.find((i) => i.id === s.id)?.naam || s.id }));
    ui.pairingStatus = 'resultaten';
  } catch (fout) {
    if (fout.code === 401) {
      ui.authed = false;
      authMod.wisPin();
      ui.modal = null;
      render();
      return;
    }
    ui.pairingStatus = 'fout';
    ui.pairingFout = fout.message || 'Er ging iets mis.';
  }
  render();
}

init();
