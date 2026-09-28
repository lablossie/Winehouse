// js/render/chrome.js — header en tabbalk ("chrome" rond de content).
import { escapeHtml } from '../utils.js';

const TABS = [
  { id: 'voorraad', label: 'Cellar' },
  { id: 'onlangs', label: 'Recently added' },
  { id: 'drink-binnenkort', label: 'Drink soon' },
  { id: 'historie', label: 'History' },
];

export function renderHeader(ui) {
  return `
    <header class="app-header">
      <div class="app-title-row">
        <h1 class="app-title">Wine Cellar</h1>
        <div class="header-actions">
          <button class="icon-btn" data-action="open-pairing" aria-label="What should I drink with this?">🍽</button>
          <button class="icon-btn" data-action="export-csv" aria-label="Export as CSV">⇩</button>
          <button class="icon-btn" data-action="open-photo-import" aria-label="Recognize from photo">📷</button>
          <button class="btn btn-primary btn-add" data-action="open-add">+ Add</button>
        </div>
      </div>
      <div class="search-row">
        <input
          type="search"
          id="search-input"
          data-focus-key="search-input"
          class="search-input"
          placeholder="Search by name, producer or grape…"
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
