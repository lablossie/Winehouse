// api/enrich.js — optionele research-verrijking per item, met een
// zoekmachine-tool. Kost meer per aanroep dan de andere twee endpoints
// (zoekopdrachten worden apart gefactureerd) — daarom hier een expliciete
// knop i.p.v. automatisch bij elke toevoeging (zie §5b van de bouwgids).
//
// Let op valkuil #10: het antwoord van een model met een zoek-tool is geen
// kaal JSON — er staat vaak inleidende tekst vóór een codeblok, en
// <cite>-tags middenin de tekstvelden zelf. parseJsonUitAntwoord() verwerkt
// dit defensief (fence-eerst, dan brace-matching, dan cite-tags strippen).
import { roepClaudeAan, parseJsonUitAntwoord } from '../lib/anthropic.js';
import { weigerIndienOngeldig } from '../lib/auth.js';

const SYSTEM_PROMPT = `
Je bent een wijn-researcher voor een persoonlijke wijnkelder-app. Je krijgt
gegevens van één wijn (mogelijk onvolledig of deels onjuist, want afkomstig
uit foto-herkenning van een etiket). Zoek het op en lever:

1. "omschrijving": 2-4 zinnen algemene achtergrondinformatie over deze wijn
   (producent, stijl, bekendheid) — in het Nederlands.
2. "smaakprofiel": een array van 3-6 korte kenmerken (bv. "kersen", "vanille",
   "stevige tannines").
3. "druivenras": het gecorrigeerde/geverifieerde druivenras, ALLEEN als je dit
   met redelijke zekerheid kunt vaststellen — anders een lege string. Foto-
   herkenning leest dit veld vaak verkeerd; corrigeer het dus actief als je
   iets anders vindt dan wat is meegegeven.
4. "gebied": dezelfde logica als druivenras — gecorrigeerd/geverifieerd gebied
   of subregio, lege string als onzeker.
5. "geschattePrijs": een realistische gemiddelde winkelprijs in euro's als
   getal (zonder valutateken), ALLEEN als je hier vertrouwen in hebt — anders
   leeg laten. Vul dit sowieso alleen in ter aanvulling, nooit om een
   bestaande prijs te overschrijven.

Geef als ALLERLAATSTE bericht UITSLUITEND een kaal JSON-object terug, zonder
inleidende tekst, zonder markdown-codeblok, en zonder enige bronvermelding of
citatie-opmaak in de tekstvelden zelf:
{ "omschrijving": string, "smaakprofiel": string[], "druivenras": string, "gebied": string, "geschattePrijs": number | "" }

Vul lege strings/arrays in als je online niets betrouwbaars vindt — verzin
nooit informatie.
`.trim();

export default async function handler(req, res) {
  if (weigerIndienOngeldig(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ fout: 'Methode niet toegestaan.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const item = body?.item;
    if (!item || !item.naam) {
      res.status(400).json({ fout: 'Geen (geldig) item meegestuurd.' });
      return;
    }

    const itemBeschrijving = [
      `Naam: ${item.naam}`,
      item.domein && `Producent: ${item.domein}`,
      item.land && `Land: ${item.land}`,
      item.gebied && `Gebied: ${item.gebied}`,
      item.jaartal && `Jaartal: ${item.jaartal}`,
      item.druivenras && `Druivenras: ${item.druivenras}`,
      item.kwalificering && `Kwalificering: ${item.kwalificering}`,
    ].filter(Boolean).join('\n');

    const antwoord = await roepClaudeAan({
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Zoek deze wijn op en lever de gevraagde JSON:\n\n${itemBeschrijving}`,
        },
      ],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      maxTokens: 2000,
    });

    const resultaat = parseJsonUitAntwoord(antwoord) || {};
    res.status(200).json({
      omschrijving: resultaat.omschrijving || '',
      smaakprofiel: Array.isArray(resultaat.smaakprofiel) ? resultaat.smaakprofiel : [],
      druivenras: resultaat.druivenras || '',
      gebied: resultaat.gebied || '',
      geschattePrijs: resultaat.geschattePrijs || '',
    });
  } catch (fout) {
    res.status(500).json({ fout: fout.message || 'Verrijken is mislukt.' });
  }
}
