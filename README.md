# Wijnkelder

Een installeerbare, mobielvriendelijke wijnkelder-tracker: voorraadbeheer,
foto-herkenning, een "wat drink ik hierbij?"-suggestie, en optionele
AI-research-verrijking per fles. Vanilla JavaScript, geen framework, geen
build-stap — de volledige specificatie staat in
[`docs/BUILD_GUIDE.nl.md`](docs/BUILD_GUIDE.nl.md).

## Setup

1. Maak een GitHub-repo aan met deze code en koppel 'm aan een nieuw
   Vercel-project.
2. Voeg in het Vercel-dashboard een **Vercel KV**- of **Upstash Redis**-
   database toe aan het project — de env vars worden automatisch gezet.
3. Zet in Vercel → Settings → Environment Variables:
   - `APP_PIN` — de gewenste toegangscode (leeg = geen slot).
   - `ANTHROPIC_API_KEY` — eigen sleutel van console.anthropic.com.
4. Deploy (automatisch bij git push). Open de app en ontgrendel met de
   pincode.
5. Installeer de app op je startscherm via de "Toevoegen aan beginscherm"-
   optie van je browser — daarna werkt hij als een gewone app, ook offline
   met de laatst geziene data.

Lokaal ontwikkelen: `npm i -g vercel`, kopieer `.env.example` naar `.env`,
vul 'm in, en start met `vercel dev`.

## Structuur

```
index.html, manifest.json, sw.js   PWA-shell
css/styles.css                     al het design (CSS-variabelen)
js/app.js                          state, render(), event delegation
js/state.js                        laden/opslaan, CRUD, offline-sync
js/auth.js                         pincode-scherm
js/model.js                        rijpingsberekening, sortering, hiërarchie
js/render/                         één module per view, elk een pure functie
api/                                inventory (KV), recognize/pairing/enrich (AI)
lib/                                gedeelde serverless-helpers (kv, auth, anthropic)
```

## Functionaliteit

- Voorraadbeheer met aantallen, "opgedronken"-historie, filters per kleur met
  live tellers, sortering, en navigatie per herkomst (land → gebied →
  producent).
- Zoeken op naam/producent/druivenras, met focusbehoud tijdens typen.
- Rijpings-/houdbaarheidsindicator per fles, gebaseerd op kleur, mousserend
  en kwalificering.
- "Onlangs toegevoegd" en "Drink binnenkort" tabs.
- CSV-export van de volledige voorraad.
- Foto-herkenning (fles of aankoopbon, ook meerdere items per foto) ter
  controle vóór toevoegen.
- "Wat drink ik hierbij?" — contextuele suggestie uit je eigen voorraad.
- Optionele AI-research-verrijking per item (achtergrondinfo, smaakprofiel,
  correctie van druivenras/gebied, geschatte prijs).
- Installeerbaar als PWA, werkt offline met laatst bekende data.
- Gedeelde toegang via één pincode voor het hele huishouden.

Wil je dit patroon hergebruiken voor een andere verzameling (bier, whisky,
boeken, ...) of het ontwerp aanpassen? Zie de startprompt bovenaan
`docs/BUILD_GUIDE.nl.md`.
