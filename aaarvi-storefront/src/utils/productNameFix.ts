/** Correct known scraper/OCR name artifacts without altering already-valid names. */

import nameOverrides from '../data/product-name-overrides.json';

const SCRAPER_ARTIFACT =
  /Setof|Cupsin|Actionlid|Brandingpanels|\bTand\b|notebookin|withBamboo|Blackcover|Texturedb|Ocolored|Steelcontainers|With2|Ingiftbox|Desktopmug|Tweedtansetof|ORtIS/i;

const PDF_NAME_OVERRIDES: Record<string, string> = nameOverrides as Record<string, string>;

function insertWordBoundaries(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function needsScraperFix(name: string): boolean {
  if (SCRAPER_ARTIFACT.test(name)) return true;
  if (/withBamboo|PlantCare|Blackcover|3IN1/.test(name)) return true;
  if (
    /[a-z][A-Z]/.test(name) &&
    /(Setof|mug|lid|panel|cola|flask|notebook|stylus|tweed|Ocolored|Textured)/i.test(name)
  ) {
    return true;
  }
  return false;
}

function fixScraperArtifacts(name: string): string {
  let text = name.trim();
  if (!text) return text;

  const replacements: Array<[RegExp, string]> = [
    [/\bPens\s+Tand\b/i, 'Pen Stand'],
    [/\bPen\s+Tand\b/i, 'Pen Stand'],
    [/\bBrandingpanels\b/i, 'Branding Panels'],
    [/\bSetofcola\b/i, 'Set of Cola'],
    [/\bSetofvacuumflask\b/i, 'Set of Vacuum Flask'],
    [/\bTweedtansetof\b/i, 'Tweed Tan Set of'],
    [/\bSetof\b/i, 'Set of'],
    [/\bCupsin\b/i, 'Cups in'],
    [/\bIngiftbox\b/i, 'In Gift Box'],
    [/\bWith2stainless\b/i, 'With 2 Stainless'],
    [/\bWith2\b/i, 'With 2'],
    [/\bSteelcups\b/i, 'Steel Cups'],
    [/\bDesktopmug\b/i, 'Desktop Mug'],
    [/\bDouble Actionlid\b/i, 'Double Action Lid'],
    [/\bSteelcontainers\b/i, 'Steel Containers'],
    [/\bBlackcovernotebookin\b/i, 'Black Cover Notebook in'],
    [/\bwithBambooStylusPen\b/i, 'with Bamboo Stylus Pen'],
    [/\bTexturedb\s*0\s*Dy\b/i, 'Textured Body'],
    [/\bBolt\s+75\s+O\s*colored:?\s*stainless\b/i, 'Bolt 750 Colored: Stainless'],
    [/\b3IN1\s+ORtIS\s+C\b/i, '3 in 1 Speaker, Earbuds & Mobile Stand'],
    [/\ba\s+5\s+Size\b/i, 'A5 Size'],
    [/\b45\s+size\b/i, 'A5 Size'],
    [/\bPlantCare\b/i, 'Plant Care'],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  if (needsScraperFix(name)) {
    text = insertWordBoundaries(text);
  }

  text = text.replace(
    /\bwith\s+Bamboo\s+Stylus\s+Pen\s+FRIENDLY\b/i,
    'with Bamboo Stylus Pen',
  );
  text = text.replace(/\bGift\s+set\b/gi, 'Gift Set');
  text = text.replace(/\bQ\s?\d+[A-Z]?\s*$/i, '').trim();
  text = text.replace(/\s+\|\s*$/g, '').trim();
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

export function fixProductName(id: string, name: string): string {
  const pdfOverride = PDF_NAME_OVERRIDES[id];
  if (pdfOverride) return pdfOverride;
  if (!needsScraperFix(name)) return name;
  const fixed = fixScraperArtifacts(name);
  return fixed === name ? name : fixed;
}
