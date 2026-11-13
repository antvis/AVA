import type unicodeProperties from './unicode-properties.json';

type CharacterFrequency = { value: string; count: number };
type Group = { value: string | null; count: number; characters: CharacterFrequency[] };

function lookup(codepoint: number, { ranges, names }: typeof unicodeProperties.category): string | null {
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const [start, end, label] = ranges[mid];
    if (codepoint < start) hi = mid - 1;
    else if (codepoint > end) lo = mid + 1;
    else return names[label];
  }
  return null;
}

export function unicodeSummary(characters: CharacterFrequency[], properties: typeof unicodeProperties) {
  const groups = (property: keyof typeof properties): Group[] => {
    const distribution = new Map<string | null, Group>();
    for (const character of characters) {
      const value =
        lookup(character.value.codePointAt(0)!, properties[property]) ?? (property === 'script' ? 'Unknown' : null);
      const group = distribution.get(value) ?? { value, count: 0, characters: [] };
      group.count += character.count;
      group.characters.push(character);
      distribution.set(value, group);
    }
    return [...distribution.values()].sort((left, right) => right.count - left.count);
  };
  return {
    character_count: characters.reduce((total, { count }) => total + count, 0),
    distinct_character_count: characters.length,
    category: groups('category'),
    block: groups('block'),
    script: groups('script'),
  };
}
