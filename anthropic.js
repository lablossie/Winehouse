// lib/anthropic.js — kleine wrapper rond de Anthropic Messages API.
// De sleutel wordt uitsluitend hier, serverside, uit een env var gelezen —
// komt NOOIT in de browser-JS terecht (valkuil #9).

const API_URL = 'https://api.anthropic.com/v1/messages';

// Cheapste/snelste beschikbare model — ruim voldoende voor extractie- en
// matching-werk, kosten in centen per aanroep (zie §5 van de bouwgids).
export const MODEL = 'claude-haiku-4-5-20251001';

export async function roepClaudeAan({ system, messages, tools, maxTokens = 1500 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing from the environment variables.');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages,
      ...(tools ? { tools } : {}),
    }),
  });

  if (!res.ok) {
    const tekst = await res.text().catch(() => '');
    throw new Error(`Claude API error (${res.status}): ${tekst.slice(0, 300)}`);
  }

  const data = await res.json();
  const tekstBlokken = (data.content || [])
    .filter((blok) => blok.type === 'text')
    .map((blok) => blok.text);
  return tekstBlokken.join('\n');
}

/**
 * Verwerkt een modelantwoord defensief tot JSON — nodig omdat een model met
 * een zoek-tool geen kaal JSON teruggeeft: er staat vaak inleidende tekst
 * vóór een ```json-codeblok, én <cite>-tags middenin de tekstvelden zelf
 * (valkuil #10). Volgorde: eerst codeblok proberen, anders het eerste
 * {...}/[...]-blok zoeken via brace-matching, dan <cite>-tags strippen uit
 * alle stringwaarden vóór het opslaan.
 */
export function parseJsonUitAntwoord(tekst) {
  if (!tekst) return null;

  let kandidaat = null;

  const fenceMatch = tekst.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    kandidaat = fenceMatch[1].trim();
  } else {
    kandidaat = eersteBlokViaAccolades(tekst);
  }

  if (!kandidaat) return null;

  try {
    const parsed = JSON.parse(kandidaat);
    return stripCiteTags(parsed);
  } catch {
    return null;
  }
}

function eersteBlokViaAccolades(tekst) {
  const openTekens = ['{', '['];
  let startIndex = -1;
  let openTeken = null;
  let sluitTeken = null;

  for (let i = 0; i < tekst.length; i += 1) {
    if (openTekens.includes(tekst[i])) {
      startIndex = i;
      openTeken = tekst[i];
      sluitTeken = openTeken === '{' ? '}' : ']';
      break;
    }
  }
  if (startIndex === -1) return null;

  let diepte = 0;
  for (let i = startIndex; i < tekst.length; i += 1) {
    if (tekst[i] === openTeken) diepte += 1;
    if (tekst[i] === sluitTeken) diepte -= 1;
    if (diepte === 0) {
      return tekst.slice(startIndex, i + 1);
    }
  }
  return null;
}

function stripCiteTags(waarde) {
  if (typeof waarde === 'string') {
    return waarde.replace(/<\/?cite[^>]*>/gi, '').trim();
  }
  if (Array.isArray(waarde)) {
    return waarde.map(stripCiteTags);
  }
  if (waarde && typeof waarde === 'object') {
    const resultaat = {};
    for (const [sleutel, sub] of Object.entries(waarde)) {
      resultaat[sleutel] = stripCiteTags(sub);
    }
    return resultaat;
  }
  return waarde;
}
