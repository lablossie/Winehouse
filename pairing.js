// api/pairing.js — tekst-vraag + eigen voorraad → 1-3 aanbevelingen.
// Serverside gevalideerd: alleen ID's die letterlijk in de meegestuurde
// voorraadlijst voorkomen worden geaccepteerd, de rest wordt uitgefilterd.
// Dit voorkomt dat het model een niet-bestaand item aanraadt.
import { roepClaudeAan, parseJsonUitAntwoord } from '../lib/anthropic.js';
import { weigerIndienOngeldig } from '../lib/auth.js';

const SYSTEM_PROMPT = `
Je bent een sommelier-assistent voor een persoonlijke wijnkelder-app. Je krijgt
een beschrijving van een gelegenheid of gerecht, plus een lijst van wijnen die
op dit moment op voorraad zijn (met hun ID).

Kies 1 tot 3 wijnen UITSLUITEND uit de meegestuurde lijst die het beste
passen. Verzin nooit een wijn die niet in de lijst staat, en gebruik altijd
het letterlijke "id"-veld uit de lijst.

Geef ALTIJD alleen een kaal JSON-array terug, zonder inleidende tekst en
zonder markdown-codeblok. Eén object per aanbeveling:
{ "id": string, "reden": string }
De "reden" is een korte, concrete onderbouwing (max. ~20 woorden) waarom deze
wijn past bij de gevraagde gelegenheid.

Als niets uit de lijst goed past, geef dan een lege array [] terug — verzin
geen zwakke match.
`.trim();

export default async function handler(req, res) {
  if (weigerIndienOngeldig(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ fout: 'Methode niet toegestaan.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const vraag = (body?.vraag || '').trim();
    const voorraad = Array.isArray(body?.voorraad) ? body.voorraad : [];

    if (!vraag) {
      res.status(400).json({ fout: 'Geen vraag meegestuurd.' });
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
          content: `Gelegenheid/gerecht: ${vraag}\n\nVoorraad (JSON):\n${JSON.stringify(voorraad)}`,
        },
      ],
      maxTokens: 800,
    });

    const ruweSuggesties = parseJsonUitAntwoord(antwoord) || [];
    const geldigeIds = new Set(voorraad.map((w) => w.id));
    const suggesties = ruweSuggesties.filter((s) => s && geldigeIds.has(s.id));

    res.status(200).json(suggesties);
  } catch (fout) {
    res.status(500).json({ fout: fout.message || 'Suggestie ophalen is mislukt.' });
  }
}
