// js/auth.js — simpele gedeelde pincode voor toegang, serverside gecontroleerd.
// Geen accountsysteem: één pincode per huishouden (env var APP_PIN op de server).

const OPSLAG_SLEUTEL = 'wijnkelder.pin';

export function opgeslagenPin() {
  return sessionStorage.getItem(OPSLAG_SLEUTEL) || '';
}

export function bewaarPin(pin) {
  sessionStorage.setItem(OPSLAG_SLEUTEL, pin);
}

export function wisPin() {
  sessionStorage.removeItem(OPSLAG_SLEUTEL);
}

/** Voegt de pincode-header toe aan elke API-aanroep. */
export function metAuthHeaders(extraHeaders = {}) {
  const pin = opgeslagenPin();
  return {
    ...extraHeaders,
    ...(pin ? { 'x-app-pin': pin } : {}),
  };
}

/**
 * Test of de opgeslagen pincode geldig is door een lichte GET te doen.
 * Retourneert true/false. Bij netwerkfout: null (onbekend — laat de UI dit
 * onderscheiden van "verkeerde pincode").
 */
export async function controleerPin() {
  try {
    const res = await fetch('/api/inventory', { headers: metAuthHeaders() });
    if (res.status === 401) return false;
    if (!res.ok) return null;
    return true;
  } catch {
    return null;
  }
}

export function renderPinScherm({ foutmelding = '', bezig = false } = {}) {
  return `
    <div class="pin-gate">
      <div class="pin-card">
        <p class="pin-eyebrow">Wijnkelder</p>
        <h1 class="pin-title">Welkom terug</h1>
        <p class="pin-sub">Voer de toegangscode van je huishouden in.</p>
        <form id="pin-form" autocomplete="off">
          <input
            type="password"
            inputmode="numeric"
            id="pin-input"
            class="pin-input"
            placeholder="••••"
            autofocus
            ${bezig ? 'disabled' : ''}
          />
          ${foutmelding ? `<p class="pin-error">${foutmelding}</p>` : ''}
          <button type="submit" class="btn btn-primary pin-submit" ${bezig ? 'disabled' : ''}>
            ${bezig ? 'Controleren…' : 'Ontgrendel'}
          </button>
        </form>
      </div>
    </div>
  `;
}
