const PIN_KEY = 'winecellar-pin';

export function getStoredPin() {
  try {
    return localStorage.getItem(PIN_KEY) || '';
  } catch (e) {
    return '';
  }
}

function setStoredPin(pin) {
  try {
    localStorage.setItem(PIN_KEY, pin);
  } catch (e) {
    /* ignore */
  }
}

export function authHeaders() {
  const pin = getStoredPin();
  return pin ? { 'X-App-Pin': pin } : {};
}

async function probePin(pin) {
  try {
    const res = await fetch('/api/inventory', { headers: pin ? { 'X-App-Pin': pin } : {} });
    return res.status === 401 ? 'locked' : 'ok';
  } catch (e) {
    return 'offline';
  }
}

function renderLockScreen(appEl, onSubmit, error) {
  appEl.innerHTML = `
    <div class="lock-screen">
      <div class="lock-box">
        <p class="eyebrow">Wijncollectie</p>
        <h1 class="title">Wijnkelder</h1>
        <p class="lock-text">Voer de pincode in om je voorraad te zien.</p>
        <input id="pin-input" class="lock-input" type="password" autocomplete="off" placeholder="PIN">
        ${error ? `<p class="lock-error">${error}</p>` : ''}
        <button id="pin-submit" class="btn-primary lock-submit">Ontgrendelen</button>
      </div>
    </div>`;

  const input = appEl.querySelector('#pin-input');
  const submit = appEl.querySelector('#pin-submit');
  input.focus();

  const trySubmit = () => {
    const pin = input.value.trim();
    if (!pin) return;
    onSubmit(pin);
  };
  submit.addEventListener('click', trySubmit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') trySubmit();
  });
}

/**
 * Blocks the app until it's clear no PIN is needed, or until a valid PIN
 * has been entered. Does not block on a network error (offline, the
 * locally stored inventory stays usable).
 */
export async function ensureUnlocked(appEl) {
  const stored = getStoredPin();
  const initial = await probePin(stored);
  if (initial !== 'locked') return;

  await new Promise((resolve) => {
    const attempt = (error) => {
      renderLockScreen(
        appEl,
        async (pin) => {
          const submit = appEl.querySelector('#pin-submit');
          submit.disabled = true;
          submit.textContent = 'Controleren…';
          const result = await probePin(pin);
          if (result === 'locked') {
            attempt('Onjuiste pincode, probeer opnieuw.');
            return;
          }
          // 'ok' or 'offline': we can't verify with certainty without a
          // network connection, but we don't block in that case — the PIN
          // is remembered locally.
          setStoredPin(pin);
          resolve();
        },
        error
      );
    };
    attempt(null);
  });
}
