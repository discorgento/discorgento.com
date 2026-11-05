// Text extraction for the hand-parsed feeds (youtube.ts, substack.ts).
//
// Both feeds are parsed with regexes rather than an XML parser, so the text they
// pull out still carries XML escaping. Decoding it used to be two near-identical
// chains of `.replace()` calls, and a chain is wrong by construction: replacing
// `&amp;` first turns an escaped `&amp;lt;` into `&lt;` and the next step into
// `<`, decoding the text twice. One pass over every entity cannot do that.

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/**
 * Decode the predefined XML entities and numeric character references
 * (`&#233;`, `&#xE9;`) in a single pass. Anything unrecognised is left as is.
 */
export function decodeXmlEntities(value: string): string {
  return value.replace(
    /&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g,
    (match, entity: string) => {
      if (entity[0] !== '#') return NAMED[entity] ?? match;
      const code =
        entity[1] === 'x'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    },
  );
}

/**
 * The text content of an element body: CDATA sections are taken verbatim (their
 * content is not escaped, so decoding it would corrupt a literal `&amp;`), and
 * everything outside them is entity-decoded.
 */
export function xmlText(raw: string): string {
  return raw
    .split(/(<!\[CDATA\[[\s\S]*?\]\]>)/)
    .map((part) =>
      part.startsWith('<![CDATA[')
        ? part.slice(9, -3)
        : decodeXmlEntities(part),
    )
    .join('')
    .trim();
}
