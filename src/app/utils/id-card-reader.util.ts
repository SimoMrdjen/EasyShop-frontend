// Parsira tekst kopiran iz aplikacije za očitavanje elektronske lične karte
// ("ČITAČ ELEKTRONSKE LIČNE KARTE: ŠTAMPA PODATAKA") i prevodi ćirilične
// vrednosti (ime/prezime/organ izdavanja su ispisani onako kako stoje na kartici,
// pa mogu biti na ćirilici) u latinicu.

export interface ParsedIdCard {
  firstName?: string;
  lastName?: string;
  jmbg?: string;
  address?: string;
  idCardNumber?: string;
  issuingAuthority?: string;
}

const FIELD_MAP: Record<string, keyof ParsedIdCard> = {
  'prezime': 'lastName',
  'ime': 'firstName',
  'prebivalište': 'address',
  'prebivaliste': 'address',
  'jmbg': 'jmbg',
  'dokument izdaje': 'issuingAuthority',
  'broj dokumenta': 'idCardNumber',
};

function normalizeLabel(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function parseIdCardText(raw: string): ParsedIdCard {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const result: ParsedIdCard = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = FIELD_MAP[normalizeLabel(line.slice(0, colonIdx))];
    if (!key) continue;

    let value = line.slice(colonIdx + 1).trim();
    if (!value && i + 1 < lines.length) {
      value = lines[i + 1];
    }
    if (value) {
      result[key] = value;
    }
  }

  return result;
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Đ', 'Е': 'E', 'Ж': 'Ž',
  'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'LJ', 'М': 'M', 'Н': 'N',
  'Њ': 'NJ', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'Ћ': 'Ć', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Č', 'Џ': 'DŽ', 'Ш': 'Š',
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'đ', 'е': 'e', 'ж': 'ž',
  'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n',
  'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'ć', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'č', 'џ': 'dž', 'ш': 'š',
};

export function cyrillicToLatin(s: string): string {
  let out = '';
  for (const ch of s) {
    out += CYRILLIC_TO_LATIN[ch] ?? ch;
  }
  return out;
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s,\-/])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
}

export function transliterateAndTitleCase(s: string | undefined): string {
  if (!s) return '';
  return toTitleCase(cyrillicToLatin(s));
}
