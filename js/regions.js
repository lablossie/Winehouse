// Vaste keuzelijst van landen en wijnstreken. Alles wat de gebruiker of de AI
// invoert wordt hierop teruggebracht, zodat "Chianti", "Chianti Classico" en
// "Tuscany" allemaal gewoon "Toscane" worden.
//
// Per streek: [naam, [trefwoorden...]]. Een trefwoord (zonder accenten, kleine
// letters) dat in de ingevoerde tekst voorkomt wijst naar die streek.

export const OTHER = 'Anders…';

export const REGIONS = {
  Duitsland: [
    ['Ahr', ['ahr', 'walporzheim', 'dernau', 'marienthal']],
    ['Baden', ['baden', 'kaiserstuhl', 'ortenau']],
    ['Franken', ['franken', 'franconia', 'wurzburg']],
    ['Mosel', ['mosel', 'moselle', 'saar', 'ruwer', 'piesport', 'bernkastel']],
    ['Nahe', ['nahe']],
    ['Pfalz', ['pfalz', 'palatinate']],
    ['Rheingau', ['rheingau']],
    ['Rheinhessen', ['rheinhessen', 'rhinehessen']],
    ['Württemberg', ['wurttemberg', 'wuerttemberg']],
  ],
  Frankrijk: [
    ['Alsace', ['alsace', 'elzas']],
    ['Beaujolais', ['beaujolais', 'morgon', 'fleurie', 'brouilly', 'moulin-a-vent']],
    ['Bordeaux', ['bordeaux', 'medoc', 'margaux', 'pauillac', 'saint-emilion', 'st-emilion', 'st emilion', 'saint emilion', 'pomerol', 'pessac', 'sauternes', 'graves', 'saint-julien', 'saint-estephe']],
    ['Bourgogne', ['bourgogne', 'burgundy', 'chablis', 'cote de', 'meursault', 'puligny', 'chassagne', 'gevrey', 'nuits', 'beaune', 'pommard', 'volnay', 'macon', 'chalonnaise']],
    ['Champagne', ['champagne']],
    ['Corsica', ['corsica', 'corse']],
    ['Jura & Savoie', ['jura', 'savoie', 'arbois']],
    ['Languedoc-Roussillon', ['languedoc', 'roussillon', 'minervois', 'corbieres', 'faugeres', 'pic saint-loup', "pays d'oc", 'pays d oc']],
    ['Loire', ['loire', 'sancerre', 'muscadet', 'vouvray', 'chinon', 'pouilly', 'anjou', 'saumur', 'touraine', 'bourgueil']],
    ['Provence', ['provence', 'bandol', 'cassis', 'cotes de provence']],
    ['Rhône', ['rhone', 'chateauneuf', 'hermitage', 'cote-rotie', 'cote rotie', 'gigondas', 'vacqueyras', 'condrieu', 'crozes', 'cornas', 'saint-joseph', 'tavel', 'ventoux']],
    ['Zuidwest-Frankrijk', ['sud-ouest', 'sud ouest', 'zuidwest', 'southwest', 'south west', 'cahors', 'madiran', 'bergerac', 'jurancon', 'gaillac', 'irouleguy']],
  ],
  Italië: [
    ['Abruzzen', ['abruzz', 'montepulciano d']],
    ['Apulië', ['apulie', 'puglia', 'apulia', 'primitivo', 'salento']],
    ['Campania', ['campania', 'campanie', 'taurasi', 'fiano', 'greco di tufo']],
    ['Emilia-Romagna', ['emilia', 'romagna', 'lambrusco']],
    ['Friuli-Venezia Giulia', ['friuli', 'venezia giulia', 'collio']],
    ['Lazio', ['lazio', 'latium']],
    ['Lombardije', ['lombard', 'franciacorta', 'valtellina']],
    ['Marche', ['marche', 'verdicchio']],
    ['Piemonte', ['piemont', 'piedmont', 'barolo', 'barbaresco', 'langhe', 'roero', 'asti', 'gavi', 'barbera', 'dolcetto']],
    ['Sardinië', ['sardin', 'sardegna', 'cannonau']],
    ['Sicilië', ['sicil', 'etna', 'marsala', 'nero d']],
    ['Toscane', ['toscan', 'tuscan', 'chianti', 'brunello', 'montalcino', 'montepulciano', 'bolgheri', 'maremma', 'vino nobile', 'carmignano', 'supertuscan', 'super tuscan']],
    ['Trentino-Zuid-Tirol', ['trentino', 'alto adige', 'sudtirol', 'zuid-tirol', 'south tyrol', 'sudtyrol']],
    ['Umbrië', ['umbri', 'orvieto', 'montefalco']],
    ['Veneto', ['veneto', 'valpolicella', 'amarone', 'soave', 'prosecco', 'bardolino', 'ripasso']],
  ],
  Spanje: [
    ['Andalusië', ['andalus', 'jerez', 'sherry', 'montilla', 'malaga']],
    ['Castilla y León', ['castilla y leon', 'castilla-leon', 'ribera del duero', 'toro', 'rueda', 'bierzo']],
    ['Catalonië', ['catalon', 'cataluna', 'penedes', 'priorat', 'cava', 'montsant', 'terra alta', 'empordà', 'emporda']],
    ['Galicië', ['galic', 'rias baixas', 'ribeiro', 'albarino', 'ribeira sacra']],
    ['La Mancha', ['la mancha', 'valdepenas']],
    ['Navarra', ['navarra']],
    ['Rioja', ['rioja']],
    ['Valencia', ['valencia', 'utiel', 'jumilla', 'yecla', 'alicante']],
  ],
  Portugal: [
    ['Alentejo', ['alentejo']],
    ['Bairrada', ['bairrada']],
    ['Dão', ['dao']],
    ['Douro', ['douro', 'port', 'porto']],
    ['Lisboa', ['lisboa', 'lisbon', 'colares', 'bucelas']],
    ['Madeira', ['madeira']],
    ['Vinho Verde', ['vinho verde', 'minho']],
  ],
  Oostenrijk: [
    ['Burgenland', ['burgenland', 'neusiedl']],
    ['Neder-Oostenrijk', ['niederosterreich', 'neder-oostenrijk', 'lower austria', 'wachau', 'kamptal', 'kremstal', 'wagram', 'traisental', 'weinviertel', 'carnuntum']],
    ['Stiermarken', ['steiermark', 'stiermarken', 'styria']],
    ['Wenen', ['wien', 'wenen', 'vienna']],
  ],
  Zwitserland: [
    ['Wallis', ['wallis', 'valais']],
    ['Waadt', ['waadt', 'vaud', 'lavaux']],
    ['Genève', ['geneve', 'geneva']],
    ['Ticino', ['ticino', 'tessin']],
  ],
  'Verenigde Staten': [
    ['Californië', ['californ', 'napa', 'sonoma', 'paso robles', 'central coast', 'lodi', 'santa barbara']],
    ['Oregon', ['oregon', 'willamette']],
    ['Washington', ['washington', 'columbia valley', 'walla walla']],
    ['New York', ['new york', 'finger lakes']],
  ],
  Argentinië: [
    ['Mendoza', ['mendoza', 'uco', 'lujan', 'maipu']],
    ['Salta', ['salta', 'cafayate']],
    ['Patagonië', ['patagon', 'neuquen', 'rio negro']],
  ],
  Chili: [
    ['Aconcagua', ['aconcagua', 'casablanca', 'san antonio', 'leyda']],
    ['Centrale Vallei', ['central valley', 'centrale vallei', 'maipo', 'colchagua', 'rapel', 'curico', 'maule']],
    ['Zuid-Chili', ['bio-bio', 'biobio', 'itata', 'malleco', 'zuid-chili']],
  ],
  'Zuid-Afrika': [
    ['Stellenbosch', ['stellenbosch']],
    ['Swartland', ['swartland']],
    ['Paarl & Franschhoek', ['paarl', 'franschhoek']],
    ['Walker Bay & Hemel-en-Aarde', ['walker bay', 'hemel', 'elgin', 'overberg']],
    ['Western Cape', ['western cape', 'constantia', 'robertson', 'breede']],
  ],
  Australië: [
    ['Barossa Valley', ['barossa', 'eden valley']],
    ['McLaren Vale', ['mclaren']],
    ['Margaret River', ['margaret river', 'western australia']],
    ['Victoria', ['victoria', 'yarra', 'mornington']],
    ['Zuid-Australië', ['south australia', 'clare', 'coonawarra', 'adelaide', 'zuid-australie']],
    ['Tasmanië', ['tasman']],
  ],
  'Nieuw-Zeeland': [
    ['Marlborough', ['marlborough']],
    ["Hawke's Bay", ['hawke']],
    ['Central Otago', ['otago']],
    ['Martinborough', ['martinborough', 'wairarapa']],
  ],
  Griekenland: [
    ['Macedonië', ['macedon', 'naoussa', 'amyndeon']],
    ['Peloponnesos', ['peloponn', 'nemea', 'mantinia']],
    ['Santorini & eilanden', ['santorini', 'crete', 'kreta', 'cycladen', 'samos']],
  ],
  Hongarije: [
    ['Tokaj', ['tokaj', 'tokaji']],
    ['Eger', ['eger', 'bikaver']],
    ['Villány', ['villany']],
  ],
  Nederland: [
    ['Limburg', ['limburg']],
    ['Gelderland', ['gelderland']],
    ['Noord-Brabant', ['brabant']],
  ],
};

export const COUNTRIES = [...Object.keys(REGIONS), 'Overig'];

const COUNTRY_ALIASES = {
  Duitsland: ['duitsland', 'germany', 'deutschland', 'allemagne'],
  Frankrijk: ['frankrijk', 'france'],
  'Italië': ['italie', 'italy', 'italia', 'italien'],
  Spanje: ['spanje', 'spain', 'espana'],
  Portugal: ['portugal'],
  Oostenrijk: ['oostenrijk', 'austria', 'osterreich'],
  Zwitserland: ['zwitserland', 'switzerland', 'schweiz', 'suisse'],
  'Verenigde Staten': ['verenigde staten', 'usa', 'united states', 'amerika', 'america', 'vs'],
  'Argentinië': ['argentin'],
  Chili: ['chili', 'chile'],
  'Zuid-Afrika': ['zuid-afrika', 'zuid afrika', 'south africa'],
  'Australië': ['australi'],
  'Nieuw-Zeeland': ['nieuw-zeeland', 'nieuw zeeland', 'new zealand'],
  Griekenland: ['griekenland', 'greece'],
  Hongarije: ['hongarije', 'hungary'],
  Nederland: ['nederland', 'netherlands', 'holland'],
};

function fold(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** Brengt een land (vrije tekst) terug op een land uit de lijst, of '' als het niet past. */
export function normalizeCountry(input) {
  const t = fold(input);
  if (!t) return '';
  for (const c of COUNTRIES) if (fold(c) === t) return c;
  for (const [c, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (aliases.some((a) => (a.length <= 3 ? t === a : t.includes(a)))) return c;
  }
  return '';
}

/**
 * Brengt een streek (vrije tekst) terug op een streek uit de lijst van het land.
 * Geeft '' terug als er geen match is (dan blijft de streek leeg i.p.v. rommel).
 */
export function normalizeRegion(country, input) {
  const list = REGIONS[country];
  const t = fold(input);
  if (!list || !t) return '';
  for (const [name] of list) if (fold(name) === t) return name;
  let best = null;
  for (const [name, keys] of list) {
    for (const k of keys) {
      const kk = fold(k);
      if (t.includes(kk) && (!best || kk.length > best.len)) best = { name, len: kk.length };
    }
  }
  return best ? best.name : '';
}

export function regionNames(country) {
  return (REGIONS[country] || []).map((r) => r[0]);
}

/**
 * Normaliseert een wijn in place. Een streek die nergens op past blijft staan
 * (er gaat geen informatie verloren) zodat de gebruiker die zelf kan kiezen.
 * Geeft true terug als er iets veranderd is.
 */
export function cleanWineRegion(w) {
  let changed = false;
  const country = normalizeCountry(w.country) || (w.country ? 'Overig' : '');
  if (country && country !== w.country) {
    w.country = country;
    changed = true;
  }
  if (REGIONS[w.country] && w.region) {
    const region = normalizeRegion(w.country, w.region);
    if (region && region !== w.region) {
      w.region = region;
      changed = true;
    }
  }
  return changed;
}

/** Opties voor het land-keuzemenu. */
export function countryOptionsHTML(current, esc) {
  const list = [...COUNTRIES];
  if (current && !list.includes(current)) list.push(current);
  return list.map((c) => `<option ${c === current ? 'selected' : ''}>${esc(c)}</option>`).join('');
}

/** Opties voor het streek-keuzemenu van een land (met lege keuze en "Anders…"). */
export function regionOptionsHTML(country, current, esc) {
  const names = regionNames(country);
  const extra = current && !names.includes(current) ? [current] : [];
  return (
    `<option value="" ${!current ? 'selected' : ''}>— kies streek —</option>` +
    [...names, ...extra].map((r) => `<option ${r === current ? 'selected' : ''}>${esc(r)}</option>`).join('') +
    `<option value="${OTHER}">${OTHER}</option>`
  );
}

/** Tekst voor in AI-prompts: toegestane streken per land. */
export function regionListForPrompt(country) {
  const c = normalizeCountry(country);
  if (c && REGIONS[c]) return `${c}: ${regionNames(c).join(', ')}`;
  return Object.entries(REGIONS).map(([k, v]) => `${k}: ${v.map((r) => r[0]).join(', ')}`).join('\n');
}
