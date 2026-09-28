const CURRENT_YEAR = new Date().getFullYear();

function classify(classification, name) {
  const s = `${classification} ${name}`.toLowerCase();
  if (s.includes('blanc de noir') || s.includes('rosé') || s.includes('rose')) {
    return { label: 'Vroeg drinken', min: 0, max: 3 };
  }
  if (s.includes('grosses gewächs') || s.includes('grosse lage') || s.includes(' gg')) {
    return { label: 'Topwijn, rijpt goed', min: 4, max: 12 };
  }
  if (s.includes('ortswein')) {
    return { label: 'Middellange termijn', min: 2, max: 8 };
  }
  if (s.includes('gutswein') || s.includes('q.b.a') || s.includes('qualitätswein') || s.includes('not specified')) {
    return { label: 'Kan gerust 5 jaar wachten', min: 2, max: 5 };
  }
  return { label: 'Onbekend, schatting', min: 2, max: 5 };
}

export function ripeningInfo(wine) {
  const c = classify(wine.classification, wine.name);
  const age = CURRENT_YEAR - wine.vintage;
  const progress = Math.max(0, Math.min(1, age / c.max));
  const drinkByYear = wine.vintage + c.max;
  let status;
  let statusColor;
  if (age >= c.max) {
    status = 'Nu drinken';
    statusColor = 'var(--urgent)';
  } else if (age >= c.max * 0.7) {
    status = 'Binnenkort';
    statusColor = 'var(--warn)';
  } else {
    status = 'Kan nog wachten';
    statusColor = 'var(--ok)';
  }
  return { ...c, age, progress, drinkByYear, status, color: statusColor };
}
