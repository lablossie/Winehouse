// api/recognize.js — foto('s) → gestructureerde data via Claude vision.
// Eén of meerdere foto's tegelijk, eventueel meerdere items per foto, of een
// foto van een aankoopbon. Reageert altijd met een JSON-array, ook bij één
// herkend item, zodat de client-afhandeling consistent blijft.
import { roepClaudeAan, parseJsonUitAntwoord } from '../lib/anthropic.js';
import { weigerIndienOngeldig } from '../lib/auth.js';

const SYSTEM_PROMPT = `
You recognize wine bottles and/or wine purchase receipts in photos, for a
personal wine cellar app. There may be multiple bottles in one photo, or
multiple photos of the same or different bottles/receipts.

ALWAYS respond with ONLY a bare JSON array, no introductory text, no
markdown code block, no explanation. One object per recognized item, even if
there's only one item (then an array with one object).

Each object has these fields (use empty string / null where unknown, NEVER
make up information you cannot read):
{
  "naam": string,
  "domein": string,       // producer / château / winery
  "land": string,
  "gebied": string,       // region/appellation
  "jaartal": number | "",
  "druivenras": string,
  "kleur": "rood" | "wit" | "rosé" | "oranje" | "versterkt",
  "mousserend": boolean,
  "kwalificering": string, // e.g. AOC, DOCG, Grand Cru, ...
  "aantal": number,        // number of bottles of this item in the photo, default 1
  "prijs": number | ""     // only fill in if a price is literally visible (e.g. on a receipt)
}

If in doubt whether something is a wine, or if you cannot read the label
well: leave the item out rather than guessing. If nothing can be reliably
recognized, return an empty array [].

Extra strict for "jaartal" (vintage): fill this in ONLY if the vintage is
literally and legibly printed on the label or receipt. Never guess a
vintage, and NEVER use the current year or another "likely" year as a
substitute when it isn't legible — leave the field empty ("") instead.
A wine with no visible vintage (or a non-vintage wine) should get an empty
string, not an estimated year.
`.trim();

export default async function handler(req, res) {
  if (weigerIndienOngeldig(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ fout: 'Method not allowed.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const afbeeldingen = Array.isArray(body?.afbeeldingen) ? body.afbeeldingen : [];
    if (afbeeldingen.length === 0) {
      res.status(400).json({ fout: 'No images sent.' });
      return;
    }

    const imageBlokken = afbeeldingen.map((dataUrl) => naarImageBlock(dataUrl)).filter(Boolean);
    if (imageBlokken.length === 0) {
      res.status(400).json({ fout: 'Could not process any valid images.' });
      return;
    }

    const antwoord = await roepClaudeAan({
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlokken,
            { type: 'text', text: 'Recognize the wine(s) in this photo or these photos, and return the JSON array.' },
          ],
        },
      ],
      maxTokens: 2000,
    });

    const kandidaten = parseJsonUitAntwoord(antwoord);
    res.status(200).json(Array.isArray(kandidaten) ? kandidaten : []);
  } catch (fout) {
    res.status(500).json({ fout: fout.message || 'Recognition failed.' });
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
