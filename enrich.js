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
You are a wine researcher for a personal wine cellar app. You get data for
one wine (possibly incomplete or partly incorrect, since it comes from photo
recognition of a label). Look it up and provide:

1. "omschrijving": 2-4 sentences of general background information about this
   wine (producer, style, reputation) — in English.
2. "smaakprofiel": an array of 3-6 short tasting notes (e.g. "cherry",
   "vanilla", "firm tannins").
3. "druivenras": the corrected/verified grape variety, ONLY if you can
   determine this with reasonable confidence — otherwise an empty string.
   Photo recognition often misreads this field, so actively correct it if you
   find something different from what was supplied.
4. "gebied": same logic as grape variety — corrected/verified region or
   sub-region, empty string if uncertain.
5. "geschattePrijs": a realistic average retail price in euros as a number
   (without currency symbol), ONLY if you're confident about this — otherwise
   leave empty. Only fill this in as a supplement, never to overwrite an
   existing price.

As your VERY LAST message, respond with ONLY a bare JSON object, no
introductory text, no markdown code block, and no source citations or
citation formatting in the text fields themselves:
{ "omschrijving": string, "smaakprofiel": string[], "druivenras": string, "gebied": string, "geschattePrijs": number | "" }

Fill in empty strings/arrays if you find nothing reliable online — never make
up information.
`.trim();

export default async function handler(req, res) {
  if (weigerIndienOngeldig(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ fout: 'Method not allowed.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const item = body?.item;
    if (!item || !item.naam) {
      res.status(400).json({ fout: 'No (valid) item sent.' });
      return;
    }

    const itemBeschrijving = [
      `Name: ${item.naam}`,
      item.domein && `Producer: ${item.domein}`,
      item.land && `Country: ${item.land}`,
      item.gebied && `Region: ${item.gebied}`,
      item.jaartal && `Vintage: ${item.jaartal}`,
      item.druivenras && `Grape variety: ${item.druivenras}`,
      item.kwalificering && `Classification: ${item.kwalificering}`,
    ].filter(Boolean).join('\n');

    const antwoord = await roepClaudeAan({
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Look up this wine and provide the requested JSON:\n\n${itemBeschrijving}`,
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
    res.status(500).json({ fout: fout.message || 'Enrichment failed.' });
  }
}
