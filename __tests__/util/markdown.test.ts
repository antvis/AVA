import { describe, expect, it } from 'vitest';

import { escapeMarkdown, markdownTable } from '../../src/util/markdown';

describe('markdownTable', () => {
  it('collects headers across rows and preserves missing, null, false and zero values', () => {
    expect(
      markdownTable([
        { name: 'first', value: 0, nested: { count: 1 } },
        { value: false, name: 'second', extra: null },
        { name: 'third', nested: [], extra: undefined },
      ])
    ).toBe(
      [
        '| name | value | nested | extra |',
        '| --- | --- | --- | --- |',
        '| first | 0 | {"count":1} |  |',
        '| second | false |  | null |',
        '| third |  | &#91;&#93; |  |',
      ].join('\n')
    );
  });

  it('returns an empty string when there are no headers', () => {
    expect(markdownTable([])).toBe('');
    expect(markdownTable([{}, {}])).toBe('');
  });

  it('escapes both headers and values', () => {
    expect(markdownTable([{ 'a|b': '<value>\r\nnext' }])).toBe('| a&#124;b |\n| --- |\n| &#60;value&#62;<br>next |');
  });
});

describe('escapeMarkdown', () => {
  it('escapes formatting and normalizes line endings', () => {
    expect(escapeMarkdown('**value** & `code` [link](url) \\\r\nnext\rlast\nend')).toBe(
      '&#42;&#42;value&#42;&#42; &#38; &#96;code&#96; &#91;link&#93;(url) &#92;<br>next<br>last<br>end'
    );
  });
});
