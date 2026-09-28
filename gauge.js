// js/render/gauge.js — pure functie die een rijpings-gauge (voortgangsbalk) rendert.
import { berekenRijping } from '../model.js';
import { escapeHtml } from '../utils.js';

export function renderGauge(wijn, { compact = false } = {}) {
  const rijping = berekenRijping(wijn);
  const klasse = {
    jong: 'gauge-jong',
    optimaal: 'gauge-optimaal',
    'over-piek': 'gauge-piek',
    onbekend: 'gauge-onbekend',
  }[rijping.status];

  if (compact) {
    return `
      <div class="gauge gauge-compact ${klasse}" title="${escapeHtml(rijping.label)}">
        <div class="gauge-track"><div class="gauge-fill" style="width:${rijping.percent}%"></div></div>
      </div>
    `;
  }

  return `
    <div class="gauge ${klasse}">
      <div class="gauge-track"><div class="gauge-fill" style="width:${rijping.percent}%"></div></div>
      <p class="gauge-label">${escapeHtml(rijping.label)}</p>
    </div>
  `;
}
