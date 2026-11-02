import { regionListForPrompt } from '../js/regions.js';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5';
const MAX_IMAGES = 6;

const LABEL_PROMPT =
  'These are one or more photos of wine bottles or wine labels. Multiple different bottles can appear in one photo, and the same bottle can appear in multiple photos. Return ONLY a valid JSON array, with no explanation and no markdown formatting. For each distinct wine you recognize, provide an object with exactly these fields: country (in Dutch, e.g. "Duitsland" or "Frankrijk"), region (wine region/appellation), estate (name of the winery/producer), name (name of the cuvée/wine, without producer and without vintage), vintage (number, or null for a non-vintage wine), grapeVariety (grape or blend), color (exactly "White", "Rosé" or "Red"), sparkling (true or false — is it a sparkling wine), classification (quality classification, or "not stated on label" if not visible), quantity (always 1, regardless of how many photos of the same bottle there are), price (always 0), photoIndex (0-based number of the photo in which this specific bottle is most clearly visible), bottleBox (a bounding box around the whole bottle in that photo as an object {"x":..,"y":..,"w":..,"h":..} with values between 0 and 1 relative to the photo width/height, x and y being the top-left corner; use null if you cannot locate the bottle, e.g. when only a loose label is shown). If the same wine appears in multiple photos, include it only once. Return an empty array [] if you cannot recognize any wine.';

const RECEIPT_PROMPT =
  'These are one or more photos of (parts of) the same receipt or invoice for a wine purchase, possibly listing multiple wines. Return ONLY a valid JSON array, with no explanation and no markdown formatting, with an object for each wine line on the receipt with these fields: country (in Dutch, guess based on shop/wine name if not explicitly stated), region (wine region, or "" if unknown), estate (name of the winery/producer, or "" if not distinguishable from the wine name), name (name of the wine/cuvée), vintage (number, or null if not stated), grapeVariety (if it can be inferred, otherwise ""), color (exactly "White", "Rosé" or "Red", estimated as best you can), sparkling (true or false), classification ("not stated on receipt" if this isn\'t on the receipt), quantity (number of bottles on this line), price (price PER BOTTLE — divide a total price by the quantity). Include every distinct wine line as a separate object in the array. Skip non-wine items (deposit, bags, discounts). Return an empty array [] if no wine lines can be recognized.';

function isAuthorized(req) {
  const requiredPin = process.env.APP_PIN;
  if (!requiredPin) return true; // not set yet: no lock active
  return req.headers['x-app-pin'] === requiredPin;
}

function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '')
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Methode niet toegestaan.' });
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Onjuiste of ontbrekende pincode.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'De Claude API-sleutel is nog niet ingesteld (ANTHROPIC_API_KEY ontbreekt in Vercel).' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    res.status(400).json({ error: 'Ongeldig verzoek.' });
    return;
  }

  const images = body && Array.isArray(body.images) ? body.images : [];
  const mode = body && body.mode === 'receipt' ? 'receipt' : 'label';

  if (images.length === 0) {
    res.status(400).json({ error: 'Geen foto ontvangen.' });
    return;
  }
  if (images.length > MAX_IMAGES) {
    res.status(400).json({ error: `Maximaal ${MAX_IMAGES} foto's tegelijk.` });
    return;
  }
  for (const img of images) {
    if (!img || typeof img.data !== 'string' || !img.data) {
      res.status(400).json({ error: 'Een van de foto\'s kon niet worden gelezen.' });
      return;
    }
  }

  const REGION_RULE =
    '\n\nIMPORTANT for country and region: use the exact Dutch country name from the list below. For region you MUST pick exactly one name from the list for that country (e.g. Chianti, Chianti Classico and Brunello all belong to "Toscane"; Sancerre belongs to "Loire"). If none of the listed regions fits or you are unsure, use "" for region. Never invent a region name or put an appellation in the region field. Allowed regions per country:\n' +
    regionListForPrompt('');
  const promptText = (mode === 'receipt' ? RECEIPT_PROMPT : LABEL_PROMPT) + REGION_RULE;
  const content = [
    ...images.map((img) => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType || 'image/jpeg', data: img.data },
    })),
    { type: 'text', text: promptText },
  ];

  try {
    const claudeRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content }],
      }),
    });

    const claudeData = await claudeRes.json();

    if (!claudeRes.ok) {
      const message = (claudeData && claudeData.error && claudeData.error.message) || `Claude API error (${claudeRes.status})`;
      res.status(claudeRes.status === 401 ? 503 : 502).json({ error: message });
      return;
    }

    const textBlock = (claudeData.content || []).find((b) => b.type === 'text');
    if (!textBlock) {
      res.status(502).json({ error: 'Onverwachte reactie van Claude.' });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(stripCodeFences(textBlock.text));
    } catch (e) {
      res.status(502).json({ error: 'Kon de reactie van Claude niet lezen. Probeer het opnieuw met een duidelijkere foto.' });
      return;
    }

    if (!Array.isArray(parsed)) {
      res.status(502).json({ error: 'Onverwacht formaat van Claude \u2014 een lijst met wijnen werd verwacht.' });
      return;
    }

    res.status(200).json({ items: parsed });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Er ging iets mis bij het herkennen van de foto\'s.' });
  }
}
