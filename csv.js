// js/csv.js — CSV-export van de volledige voorraad.

const KOLOMMEN = [
  ['naam', 'Naam'], ['domein', 'Producent'], ['land', 'Land'], ['gebied', 'Gebied'],
  ['jaartal', 'Jaartal'], ['druivenras', 'Druivenras'], ['kleur', 'Kleur'],
  ['mousserend', 'Mousserend'], ['kwalificering', 'Kwalificering'],
  ['aantal', 'Aantal'], ['prijs', 'Prijs'], ['opmerkingen', 'Opmerkingen'],
];

function csvVeld(waarde) {
  const s = waarde === null || waarde === undefined ? '' : String(waarde);
  if (/[",\n;]/.test(s)) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export function exporteerCsv(inventory) {
  const header = KOLOMMEN.map(([, label]) => csvVeld(label)).join(',');
  const rijen = inventory.map((item) =>
    KOLOMMEN.map(([sleutel]) => csvVeld(item[sleutel])).join(','));
  const csv = [header, ...rijen].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wijnkelder-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
