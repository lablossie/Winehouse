import { state, loadState, refreshFromServer, adjustCount, markDrunk, addWine, updateWine, deleteWine, resetData, setNav, setOwnerName } from './state.js';
import { sumBottles, escapeHtml } from './utils.js';
import { ripeningInfo } from './model.js';
import { renderVoorraad } from './render/voorraad.js';
import { renderRecentlyAdded } from './render/recentlyAdded.js';
import { renderDrinkSoon } from './render/binnenkort.js';
import { renderHistory } from './render/historie.js';
import { renderByPrice } from './render/byPrice.js';
import { modalHTML } from './render/modal.js';
import { batchModalHTML } from './render/batchModal.js';
import { renderWineDetail } from './render/wineDetail.js';
import { pairingModalHTML } from './render/pairingModal.js';
import { toDraftItem } from './wineDraft.js';
import { recognizeFromPhotos } from './photoRecognize.js';
import { findWinePairing } from './winePairing.js';
import { fetchWineEnrichment } from './wineEnrich.js';
import { ensureUnlocked } from './auth.js';
import { OTHER, normalizeRegion, regionOptionsHTML } from './regions.js';

const ui = {
  activeTab: 'stock',
  colorFilter: 'All',
  sortBy: 'name',
  searchQuery: '',
  modalOpen: false,
  modalMode: 'add', // 'add' | 'edit'
  editingId: null,
  formDraft: {},
  photoStatus: null,
  photoPreviews: [],
  batchModalOpen: false,
  batchItems: [],
  detailId: null,
  pairingModalOpen: false,
  pairingQuery: '',
  pairingStatus: null,
  pairingResults: [],
};

const appEl = document.getElementById('app');

function totalBottles() {
  return sumBottles(state.inventory);
}
function urgentCount() {
  return state.inventory.filter((w) => ripeningInfo(w).status !== 'Kan nog wachten').length;
}
function totalValue() {
  return state.inventory.reduce((sum, w) => sum + w.quantity * Number(w.price || 0), 0);
}

// ---------------------------------------------------------------------------
// Terugknop (Android) — elke "stap" in de app (tabblad, land/streek/domein,
// wijn-detail, popups) is een stap in de browsergeschiedenis. Terug = 1 stap
// terug. Op het beginscherm moet je twee keer kort na elkaar terug drukken om
// de app te sluiten.
// ---------------------------------------------------------------------------
let histStack = []; // index 0 = "afsluit-wachtpost", index 1 = beginscherm, daarna dieper
let exitArmedAt = 0;
let toastEl = null;

function currentSnapshot() {
  const modal = ui.modalOpen || ui.batchModalOpen ? (ui.modalMode === 'edit' ? 'edit:' + ui.editingId : 'add') : ui.pairingModalOpen ? 'pairing' : '';
  return {
    activeTab: ui.activeTab,
    level: state.nav.level,
    country: state.nav.country,
    region: state.nav.region,
    estate: state.nav.estate,
    detailId: ui.detailId,
    modal,
  };
}
const snapKey = (sn) => [sn.activeTab, sn.level, sn.country, sn.region, sn.estate, sn.detailId, sn.modal].join('|');

function showExitToast() {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.style.cssText =
      'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(30,30,30,.92);color:#fff;padding:10px 16px;border-radius:20px;font-size:14px;z-index:9999;transition:opacity .2s;pointer-events:none;max-width:90%;text-align:center;';
    toastEl.textContent = 'Druk nog een keer op terug om af te sluiten';
    document.body.appendChild(toastEl);
  }
  toastEl.style.opacity = '1';
  clearTimeout(showExitToast.t);
  showExitToast.t = setTimeout(() => {
    if (toastEl) toastEl.style.opacity = '0';
  }, 2000);
}

function applySnapshot(sn) {
  ui.activeTab = sn.activeTab;
  setNav(sn.level, sn.country, sn.region, sn.estate);
  ui.detailId = sn.detailId;
  ui.modalOpen = false;
  ui.modalMode = 'add';
  ui.editingId = null;
  ui.batchModalOpen = false;
  ui.batchItems = [];
  clearPhotoPreviews();
  ui.pairingModalOpen = false;
  ui.pairingStatus = null;
  ui.pairingResults = [];
}

function syncHistory() {
  const sn = currentSnapshot();
  const key = snapKey(sn);
  if (histStack.length === 0) {
    try {
      history.replaceState({ d: 0 }, '');
      history.pushState({ d: 1 }, '');
    } catch (e) {
      return;
    }
    histStack = [null, sn];
    return;
  }
  const top = histStack.length - 1;
  if (histStack[top] && snapKey(histStack[top]) === key) {
    histStack[top] = sn;
    return;
  }
  // Staat dit scherm al eerder in de stapel? Dan gaan we daar naartoe terug
  // (bv. het sluiten van een popup of terug naar het beginscherm).
  for (let j = top - 1; j >= 1; j--) {
    if (snapKey(histStack[j]) === key) {
      histStack = histStack.slice(0, j + 1);
      histStack[j] = sn;
      history.go(j - top);
      return;
    }
  }
  histStack.push(sn);
  history.pushState({ d: histStack.length - 1 }, '');
}

window.addEventListener('popstate', (e) => {
  if (histStack.length === 0) return;
  const d = e.state && typeof e.state.d === 'number' ? e.state.d : 0;
  const top = histStack.length - 1;
  if (d > top) {
    history.go(top - d); // vooruit-knop: terug naar waar we waren
    return;
  }
  if (d === 0) {
    // Op het beginscherm op terug gedrukt.
    const now = Date.now();
    if (now - exitArmedAt < 2000) {
      exitArmedAt = 0;
      history.back(); // echt afsluiten
      return;
    }
    exitArmedAt = now;
    showExitToast();
    histStack = histStack.slice(0, 2);
    history.pushState({ d: 1 }, '');
    if (snapKey(histStack[1]) !== snapKey(currentSnapshot())) {
      applySnapshot(histStack[1]);
      render();
    }
    return;
  }
  histStack = histStack.slice(0, d + 1);
  const target = histStack[d];
  if (snapKey(target) !== snapKey(currentSnapshot())) {
    applySnapshot(target);
    histStack[d] = currentSnapshot();
    render();
  }
});

function render() {
  const focused = document.activeElement;
  const preserveSearch = focused && focused.id === 'search-input';
  const selStart = preserveSearch ? focused.selectionStart : null;
  const selEnd = preserveSearch ? focused.selectionEnd : null;

  const total = totalBottles();
  const urgent = urgentCount();
  const value = totalValue();
  const valueLabel = value >= 1000 ? `€${(value / 1000).toFixed(1)}k` : `€${value.toFixed(0)}`;

  appEl.innerHTML = `
    <div class="header">
      <p class="eyebrow">Wijncollectie</p>
      <h1 class="title">Wijnkelder</h1>
      <button class="owner-line" data-action="edit-owner">
        ${state.ownerName ? `van ${escapeHtml(state.ownerName)}` : '+ naam toevoegen'}
        <span class="owner-edit-icon">&#9998;</span>
      </button>
      <p class="subtitle">Voorraad, rijpheid en wat je als volgende opent</p>
      <div class="hairline"></div>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-num">${total}</div>
          <div class="stat-label">flessen op voorraad</div>
        </div>
        <div class="stat urgent-stat">
          <div class="stat-num">${urgent}</div>
          <div class="stat-label">vragen aandacht</div>
        </div>
        <button class="stat" data-action="show-by-price">
          <div class="stat-num">${valueLabel}</div>
          <div class="stat-label">kelderwaarde <span class="stat-chevron">&rsaquo;</span></div>
        </button>
      </div>
      <button class="pairing-cta" data-action="open-pairing">
        <span class="pairing-cta-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v7a2 2 0 0 0 4 0V2M10 9v13M16 2c-1.3 1.4-2 3-2 5.5S14.7 11 16 11v11"/></svg>
        </span>
        <span class="pairing-cta-text">
          <span class="pairing-cta-title">Welke wijn past hierbij?</span>
          <span class="pairing-cta-sub">Kies een gerecht, Claude zoekt de match uit je voorraad</span>
        </span>
        <span class="chevron">&rsaquo;</span>
      </button>
    </div>

    <div class="tabs">
      <button class="tab-add-btn" data-action="go-home" title="Terug naar start">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5h2.5a1 1 0 0 0 1-1v-9"/></svg>
      </button>
      <div class="tab-scroll">
        <button class="tab-btn ${ui.activeTab === 'stock' ? 'active' : ''}" data-action="set-tab" data-tab="stock">Voorraad</button>
        <button class="tab-btn ${ui.activeTab === 'recent' ? 'active' : ''}" data-action="set-tab" data-tab="recent">Onlangs toegevoegd</button>
        <button class="tab-btn ${ui.activeTab === 'soon' ? 'active' : ''}" data-action="set-tab" data-tab="soon">Drink binnenkort</button>
        <button class="tab-btn ${ui.activeTab === 'history' ? 'active' : ''}" data-action="set-tab" data-tab="history">Historie</button>
      </div>
      <button class="tab-add-btn primary" data-action="open-modal" title="Wijn toevoegen">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </div>

    <div class="content">
      ${
        ui.detailId
          ? renderWineDetail(state.inventory.find((w) => w.id === ui.detailId))
          : `
        ${ui.activeTab === 'stock' ? renderVoorraad(state, ui.searchQuery, ui.colorFilter, ui.sortBy) : ''}
        ${ui.activeTab === 'recent' ? renderRecentlyAdded(state) : ''}
        ${ui.activeTab === 'soon' ? renderDrinkSoon(state) : ''}
        ${ui.activeTab === 'history' ? renderHistory(state) : ''}
        ${ui.activeTab === 'price' ? renderByPrice(state, ui.colorFilter) : ''}
      `
      }
    </div>

    ${
      !ui.detailId
        ? `
    <div class="footer-note">
      <button class="export-btn" data-action="export-csv">&#8681; Exporteer voorraad naar CSV</button>
      <button data-action="reset-data">Terug naar oorspronkelijke voorraad</button>
    </div>
    `
        : ''
    }

    ${modalHTML(ui, state)}
    ${batchModalHTML(ui)}
    ${pairingModalHTML(ui, state)}
  `;

  if (preserveSearch) {
    const el = document.getElementById('search-input');
    if (el) {
      el.focus();
      try {
        el.setSelectionRange(selStart, selEnd);
      } catch (e) {
        /* ignore */
      }
    }
  }

  const activeTabEl = appEl.querySelector('.tab-btn.active');
  if (activeTabEl) {
    activeTabEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  syncHistory();
}

function clearPhotoPreviews() {
  ui.photoPreviews.forEach((url) => URL.revokeObjectURL(url));
  ui.photoPreviews = [];
}

function openAddModal() {
  ui.modalMode = 'add';
  ui.editingId = null;
  ui.formDraft = {};
  ui.photoStatus = null;
  clearPhotoPreviews();
  ui.modalOpen = true;
  render();
}

function openEditModal(id) {
  ui.modalMode = 'edit';
  ui.editingId = id;
  ui.modalOpen = true;
  render();
}

function closeModal() {
  ui.modalOpen = false;
  ui.modalMode = 'add';
  ui.editingId = null;
  clearPhotoPreviews();
  render();
}

function closeBatch() {
  ui.batchModalOpen = false;
  ui.batchItems = [];
  clearPhotoPreviews();
  render();
}

function openPairingModal() {
  ui.pairingModalOpen = true;
  ui.pairingQuery = '';
  ui.pairingStatus = null;
  ui.pairingResults = [];
  render();
}

function closePairingModal() {
  ui.pairingModalOpen = false;
  ui.pairingStatus = null;
  ui.pairingResults = [];
  render();
}

async function handlePairingSubmit() {
  const inputEl = document.getElementById('pairing-input');
  const dish = inputEl ? inputEl.value.trim() : '';
  if (!dish) return;
  ui.pairingQuery = dish;
  ui.pairingResults = [];
  ui.pairingStatus = { state: 'busy', message: 'Claude zoekt een passende wijn…' };
  render();
  try {
    const matches = await findWinePairing(dish, state.inventory);
    if (matches.length === 0) {
      ui.pairingStatus = { state: 'err', message: 'Geen passende wijn gevonden in je voorraad voor dit gerecht.' };
    } else {
      ui.pairingStatus = null;
    }
    ui.pairingResults = matches;
  } catch (e) {
    ui.pairingStatus = { state: 'err', message: e.message };
  }
  render();
}

function submitWine() {
  const country = document.getElementById('f-country').value || 'Duitsland';
  const region = document.getElementById('f-region').value;
  const estate = document.getElementById('f-estate').value.trim();
  const name = document.getElementById('f-name').value.trim();
  const vintage = document.getElementById('f-vintage').value;
  const quantity = document.getElementById('f-quantity').value;
  const grapeVariety = document.getElementById('f-grape').value.trim();
  const color = document.getElementById('f-color').value;
  const sparkling = document.getElementById('f-sparkling').checked;
  const classification = document.getElementById('f-classification').value;
  const price = document.getElementById('f-price').value;
  const notes = document.getElementById('f-notes').value.trim();

  if (!estate || !name || !vintage) {
    alert('Vul minimaal het domein, de naam en het jaartal in.');
    return;
  }

  const wine = { country, region, estate, name, vintage, grapeVariety, color, sparkling, classification, quantity, price, notes };
  if (ui.modalMode === 'edit') {
    updateWine(ui.editingId, wine);
  } else {
    const { wine: added, isNew } = addWine(wine);
    if (isNew && !added.description) {
      enrichWineAsync(added.id);
    }
  }
  closeModal();
}

// Best-effort background task: looks up general info + flavor profile for a
// newly added wine. Fails silently — the wine just stays without extra info
// if nothing is found or the request fails.
async function enrichWineAsync(id) {
  const wine = state.inventory.find((w) => w.id === id);
  if (!wine) return;
  const data = await fetchWineEnrichment(wine);
  if (!data) return;
  const updates = { description: data.description || '', flavorProfile: data.flavorProfile || [] };
  if ((!wine.price || wine.price === 0) && data.estimatedPrice > 0) {
    updates.price = data.estimatedPrice;
  }
  if (data.grapeVariety) updates.grapeVariety = data.grapeVariety;
  const verified = normalizeRegion(wine.country, data.region);
  if (verified) updates.region = verified;
  updateWine(id, updates);
  render();
}

async function handlePhotoFiles(files, mode) {
  clearPhotoPreviews();
  ui.photoPreviews = Array.from(files).map((f) => URL.createObjectURL(f));
  ui.photoStatus = { state: 'busy', message: mode === 'receipt' ? 'Bon wordt gelezen…' : 'Foto\u2019s worden herkend…' };
  render();
  try {
    const items = await recognizeFromPhotos(files, mode);
    ui.photoStatus = null;
    ui.batchItems = items.map(toDraftItem);
    ui.modalOpen = false;
    ui.batchModalOpen = true;
  } catch (e) {
    ui.photoStatus = { state: 'err', message: e.message };
  }
  render();
}

function exportCSV() {
  const header = ['Land', 'Streek', 'Domein', 'Naam', 'Jaartal', 'Druivenras', 'Kwalificering', 'Aantal', 'Prijs per fles', 'Totaal'];
  const rows = state.inventory.map((w) => [
    w.country,
    w.region,
    w.estate,
    w.name,
    w.vintage,
    w.grapeVariety,
    w.classification,
    w.quantity,
    Number(w.price).toFixed(2),
    (w.quantity * Number(w.price)).toFixed(2),
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wijnvoorraad-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

appEl.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'backdrop-close' || action === 'backdrop-close-batch' || action === 'backdrop-close-pairing') {
    if (e.target !== el) return; // click landed inside the modal, not on the backdrop itself
  }

  switch (action) {
    case 'set-tab':
      ui.activeTab = el.dataset.tab;
      ui.detailId = null;
      render();
      break;
    case 'nav':
      ui.detailId = null;
      setNav(el.dataset.level, el.dataset.country, el.dataset.region, el.dataset.estate);
      render();
      break;
    case 'adjust':
      adjustCount(el.dataset.id, Number(el.dataset.delta));
      render();
      break;
    case 'drink':
      markDrunk(el.dataset.id);
      render();
      break;
    case 'go-home':
      ui.activeTab = 'stock';
      ui.searchQuery = '';
      ui.colorFilter = 'All';
      ui.detailId = null;
      setNav('country');
      render();
      break;
    case 'show-by-price':
      ui.activeTab = 'price';
      ui.colorFilter = 'All';
      ui.searchQuery = '';
      ui.detailId = null;
      render();
      break;
    case 'set-color-filter':
      ui.colorFilter = el.dataset.color;
      render();
      break;
    case 'set-sort':
      ui.sortBy = el.dataset.sort;
      render();
      break;
    case 'edit-owner': {
      const name = window.prompt('Van wie is deze kelder?', state.ownerName || '');
      if (name !== null) {
        setOwnerName(name);
        render();
      }
      break;
    }
    case 'open-modal':
      openAddModal();
      break;
    case 'open-edit':
      openEditModal(el.dataset.id);
      break;
    case 'open-detail':
      ui.detailId = el.dataset.id;
      render();
      break;
    case 'close-detail':
      ui.detailId = null;
      render();
      break;
    case 'close-modal':
    case 'backdrop-close':
      closeModal();
      break;
    case 'submit-wine':
      submitWine();
      break;
    case 'delete-wine':
      if (confirm('Deze wijn volledig uit je voorraad verwijderen?')) {
        deleteWine(el.dataset.id);
        ui.detailId = null;
        closeModal();
      }
      break;
    case 'export-csv':
      exportCSV();
      break;
    case 'reset-data':
      if (confirm('Weet je zeker dat je je voorraad wilt terugzetten naar de oorspronkelijke lijst? De historie wordt ook gewist.')) {
        resetData();
        render();
      }
      break;
    case 'remove-batch-item':
      ui.batchItems.splice(Number(el.dataset.index), 1);
      render();
      break;
    case 'close-batch':
    case 'backdrop-close-batch':
      closeBatch();
      break;
    case 'submit-batch':
      ui.batchItems.forEach((b) => {
        if (!b.estate || !b.name) return;
        const { wine: added, isNew } = addWine(b);
        if (isNew && !added.description) {
          enrichWineAsync(added.id);
        }
      });
      closeBatch();
      break;
    case 'open-pairing':
      openPairingModal();
      break;
    case 'close-pairing':
    case 'backdrop-close-pairing':
      closePairingModal();
      break;
    case 'submit-pairing':
      handlePairingSubmit();
      break;
    case 'open-detail-from-pairing':
      ui.pairingModalOpen = false;
      ui.pairingResults = [];
      ui.pairingStatus = null;
      ui.detailId = el.dataset.id;
      render();
      break;
    default:
      break;
  }
});

appEl.addEventListener('input', (e) => {
  if (e.target.id === 'search-input') {
    ui.searchQuery = e.target.value;
    render();
    return;
  }
  if (e.target.dataset && e.target.dataset.batchField) {
    const idx = Number(e.target.dataset.index);
    if (e.target.tagName === 'SELECT' && (e.target.dataset.batchField === 'country' || e.target.dataset.batchField === 'region')) return; // afgehandeld in 'change'
    ui.batchItems[idx][e.target.dataset.batchField] = e.target.value;
    return;
  }
  if (e.target.dataset && e.target.dataset.batchCheckbox) {
    const idx = Number(e.target.dataset.index);
    ui.batchItems[idx][e.target.dataset.batchCheckbox] = e.target.checked;
  }
});

// Vraagt bij "Anders…" om een eigen streek; geeft de nieuwe waarde of null.
function askCustomRegion() {
  const v = (window.prompt('Welke streek? (bv. een kleine streek die niet in de lijst staat)') || '').trim();
  return v || null;
}

appEl.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'f-country') {
    const region = document.getElementById('f-region');
    region.innerHTML = regionOptionsHTML(t.value, '', escapeHtml);
    return;
  }
  if (t.id === 'f-region' && t.value === OTHER) {
    const custom = askCustomRegion();
    t.innerHTML = regionOptionsHTML(document.getElementById('f-country').value, custom || '', escapeHtml);
    return;
  }
  if (t.dataset && t.dataset.batchField === 'country') {
    const item = ui.batchItems[Number(t.dataset.index)];
    item.country = t.value;
    item.region = normalizeRegion(item.country, item.region);
    render();
    return;
  }
  if (t.dataset && t.dataset.batchField === 'region') {
    const item = ui.batchItems[Number(t.dataset.index)];
    item.region = t.value === OTHER ? askCustomRegion() || '' : t.value;
    render();
    return;
  }
  if (e.target.type === 'file' && e.target.dataset.photoMode) {
    // Snapshot as a plain array before clearing .value — some browsers
    // reuse the same live FileList instance, so clearing .value empties
    // it in place and a captured reference would see 0 files too.
    const files = Array.from(e.target.files || []);
    const mode = e.target.dataset.photoMode;
    e.target.value = '';
    if (files.length > 0) {
      handlePhotoFiles(files, mode);
    }
  }
});

appEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'pairing-input') {
    e.preventDefault();
    handlePairingSubmit();
  }
});

(async function init() {
  await ensureUnlocked(appEl);
  await loadState();
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* not a problem, e.g. during local testing */
    });
  }

  // Refresh the inventory when the app comes back into view or after being
  // open for a while, so changes from a partner trickle in.
  const maybeRefresh = () => {
    if (document.visibilityState !== 'visible') return;
    refreshFromServer().then((changed) => {
      if (changed) render();
    });
  };
  document.addEventListener('visibilitychange', maybeRefresh);
  setInterval(maybeRefresh, 15000);
})();
