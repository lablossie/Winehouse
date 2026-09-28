// js/render/chrome.js — header en tabbalk ("chrome" rond de content).
import { escapeHtml } from '../utils.js';

const TABS = [
  { id: 'voorraad', label: 'Voorraad' },
  { id: 'onlangs', label: 'Onlangs toegevoegd' },
  { id: 'drink-binnenkort', label: 'Drink binnenkort' },
  { id: 'historie', label: 'Historie' },
];

export function renderHeader(ui) {
  return `
    <header class="app-header">
      <div class="app-title-row">
        <h1 class="app-title">Wijnkelder</h1>
        <div class="header-actions">
          <button class="icon-btn" data-action="open-pairing" aria-label="Wat drink ik hierbij?">🍽</button>
          <button class="icon-btn" data-action="export-csv" aria-label="Exporteer als CSV">⇩</button>
          <button class="icon-btn" data-action="open-photo-import" aria-label="Herken via foto">📷</button>
          <button class="btn btn-primary btn-add" data-action="open-add">+ Toevoegen</button>
        </div>
      </div>
      <div class="search-row">
        <input
          type="search"
          id="search-input"
          data-focus-key="search-input"
          class="search-input"
          placeholder="Zoek op naam, producent of druivenras…"
          value="${escapeHtml(ui.zoekterm)}"
        />
      </div>
    </header>
  `;
}

export function renderTabbar(ui) {
  const items = TABS.map(
    (tab) => `
      <button
        class="tab-btn ${ui.activeTab === tab.id ? 'active' : ''}"
        data-action="switch-tab"
        data-tab="${tab.id}"
      >${escapeHtml(tab.label)}</button>
    `,
  ).join('');

  return `
    <nav class="tabbar-wrap">
      <div class="tabbar-scroll">${items}</div>
    </nav>
  `;
}
