// api/recognize.js — foto('s) → gestructureerde data via Claude vision.
// Eén of meerdere foto's tegelijk, eventueel meerdere items per foto, of een
// foto van een aankoopbon. Reageert altijd met een JSON-array, ook bij één
// herkend item, zodat de client-afhandeling consistent blijft.
import { roepClaudeAan, parseJsonUitAntwoord } from '../lib/anthropic.js';
import { weigerIndienOngeldig } from '../lib/auth.js';

const SYSTEM_PROMPT = `
Je herkent wijnflessen en/of aankoopbonnen van wijn op foto's, voor een
persoonlijke wijnkelder-app. Er kunnen meerdere flessen op één foto staan, of
meerdere foto's van dezelfde of verschillende flessen/bonnen.

Geef ALTIJD alleen een kaal JSON-array terug, zonder inleidende tekst, zonder
markdown-codeblok, zonder uitleg. Eén object per herkend item, ook als er maar
één item is (dan een array met één object).

Elk object heeft deze velden (gebruik lege string / null waar onbekend, verzin
NOOIT informatie die je niet kunt lezen):
{
  "naam": string,
  "domein": string,       // producent / château / wijnhuis
  "land": string,
  "gebied": string,       // regio/appellatie
  "jaartal": number | "",
  "druivenras": string,
  "kleur": "rood" | "wit" | "rosé" | "oranje" | "versterkt",
  "mousserend": boolean,
  "kwalificering": string, // bv. AOC, DOCG, Grand Cru, ...
  "aantal": number,        // aantal flessen van dit item op de foto, standaard 1
  "prijs": number | ""     // alleen invullen als een prijs letterlijk zichtbaar is (bv. op een bon)
}

Bij twijfel over of iets een wijn is, of als je het etiket niet goed kunt
lezen: laat het item liever weg dan te gokken. Als er niets betrouwbaar te
herkennen is, geef dan een lege array [] terug.

Extra streng voor "jaartal": vul dit UITSLUITEND in als het jaartal
letterlijk en leesbaar op het etiket of de bon staat. Gok nooit een jaartal,
en gebruik NOOIT het huidige jaar of een ander "waarschijnlijk" jaartal als
vervanging wanneer het niet leesbaar is — laat het veld dan gewoon leeg ("").
Een wijn zonder zichtbaar jaartal (of een niet-vintage wijn) hoort een lege
string te krijgen, niet een geschat jaartal.
`.trim();

export default async function handler(req, res) {
  if (weigerIndienOngeldig(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ fout: 'Methode niet toegestaan.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const afbeeldingen = Array.isArray(body?.afbeeldingen) ? body.afbeeldingen : [];
    if (afbeeldingen.length === 0) {
      res.status(400).json({ fout: 'Geen afbeeldingen meegestuurd.' });
      return;
    }

    const imageBlokken = afbeeldingen.map((dataUrl) => naarImageBlock(dataUrl)).filter(Boolean);
    if (imageBlokken.length === 0) {
      res.status(400).json({ fout: 'Kon geen geldige afbeeldingen verwerken.' });
      return;
    }

    const antwoord = await roepClaudeAan({
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlokken,
            { type: 'text', text: 'Herken de wijn(en) op deze foto of fotos, en geef het JSON-array terug.' },
          ],
        },
      ],
      maxTokens: 2000,
    });

    const kandidaten = parseJsonUitAntwoord(antwoord);
    res.status(200).json(Array.isArray(kandidaten) ? kandidaten : []);
  } catch (fout) {
    res.status(500).json({ fout: fout.message || 'Herkenning is mislukt.' });
  }
}

function naarImageBlock(dataUrl) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  const [, mediaType, base64Data] = match;
  return {
    type: 'image',
    source: { type: 'base64', media_type: mediaType, data: base64Data },
  };
}
