// api/pairing.js — tekst-vraag + eigen voorraad → 1-3 aanbevelingen.
// Serverside gevalideerd: alleen ID's die letterlijk in de meegestuurde
// voorraadlijst voorkomen worden geaccepteerd, de rest wordt uitgefilterd.
// Dit voorkomt dat het model een niet-bestaand item aanraadt.
import { roepClaudeAan, parseJsonUitAntwoord } from '../lib/anthropic.js';
import { weigerIndienOngeldig } from '../lib/auth.js';

const SYSTEM_PROMPT = `
You are a sommelier assistant for a personal wine cellar app. You get a
description of an occasion or dish, plus a list of wines currently in stock
(with their ID).

Choose 1 to 3 wines EXCLUSIVELY from the supplied list that fit best. Never
invent a wine that isn't in the list, and always use the literal "id" field
from the list.

ALWAYS respond with ONLY a bare JSON array, no introductory text and no
markdown code block. One object per recommendation:
{ "id": string, "reden": string }
The "reden" (reason) is a short, concrete justification (max. ~20 words) for
why this wine fits the requested occasion.

If nothing in the list fits well, return an empty array [] — don't invent a
weak match.
`.trim();

export default async function handler(req, res) {
  if (weigerIndienOngeldig(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ fout: 'Method not allowed.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const vraag = (body?.vraag || '').trim();
    const voorraad = Array.isArray(body?.voorraad) ? body.voorraad : [];

    if (!vraag) {
      res.status(400).json({ fout: 'No question sent.' });
      return;
    }
    if (voorraad.length === 0) {
      res.status(200).json([]);
      return;
    }

    const antwoord = await roepClaudeAan({
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Occasion/dish: ${vraag}\n\nStock (JSON):\n${JSON.stringify(voorraad)}`,
        },
      ],
      maxTokens: 800,
    });

    const ruweSuggesties = parseJsonUitAntwoord(antwoord) || [];
    const geldigeIds = new Set(voorraad.map((w) => w.id));
    const suggesties = ruweSuggesties.filter((s) => s && geldigeIds.has(s.id));

    res.status(200).json(suggesties);
  } catch (fout) {
    res.status(500).json({ fout: fout.message || 'Could not fetch a suggestion.' });
  }
}
