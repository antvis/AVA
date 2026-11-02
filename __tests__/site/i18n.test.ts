import { describe, expect, it } from 'vitest';
import { getLocale, getTranslator, localeHref } from '../../site/lib/i18n';
import { docHref, docs, localizedDoc } from '../../site/lib/docs';
import { getDemoMessages, PRESET_MESSAGES } from '../../site/ai/ui/demo/mockData';

describe('site languages', () => {
  it.each([
    ['/', '/zh/'],
    ['/ai/', '/zh/ai/'],
    ['/documentation/', '/zh/documentation/'],
    ['/documentation/data/sources/#csv', '/zh/documentation/data/sources/#csv'],
    ['/?example=1#analytics', '/zh/?example=1#analytics'],
  ])('maps %s without changing its query or anchor', (english, chinese) => {
    expect(localeHref(english, 'zh')).toBe(chinese);
    expect(localeHref(chinese, 'zh')).toBe(chinese);
    expect(localeHref(chinese, 'en')).toBe(english);
    expect(localeHref(english, 'en')).toBe(english);
  });

  it.each([
    '/logos/csv.svg',
    '/examples/chart.html',
    '/ai-tools/',
    '/zhuang/',
    '#csv',
    '//example.com/',
    'https://example.com/',
  ])('leaves %s unchanged', (href) => {
    expect(localeHref(href, 'zh')).toBe(href);
  });

  it('uses path segments to identify Chinese pages', () => {
    expect(getLocale('/zh')).toBe('zh');
    expect(getLocale('/zh/ai/')).toBe('zh');
    expect(getLocale('/zhuang/')).toBe('en');
  });

  it('keeps chapter identity and order while localizing the labels', () => {
    for (const doc of docs) {
      const chinese = localizedDoc(doc, 'zh');
      expect(chinese.slug).toBe(doc.slug);
      expect(chinese.title).toBeTruthy();
      expect(chinese.description).toBeTruthy();
      expect(docHref(doc.slug, 'zh')).toBe(`/zh${docHref(doc.slug)}`);
    }
  });

  it('renders Chinese text on the server, including values in full sentences', () => {
    const t = getTranslator('zh', 'AIPage');
    expect(t('intro', { size: 25 })).toContain('最大 25 MB');
  });

  it('localizes the demo without changing its numeric evidence or English copy', () => {
    const english = getDemoMessages('en');
    const chinese = getDemoMessages('zh');
    expect(english).toBe(PRESET_MESSAGES);
    expect(chinese[0].text).toContain('更赚钱');
    expect(chinese[1].steps).toHaveLength(english[1].steps!.length);
    const numbers = (rows: NonNullable<(typeof chinese)[1]['artifact']>['data']) =>
      (rows as Record<string, unknown>[]).map(({ month, ...row }) => row);
    expect(numbers(chinese[1].artifact!.data)).toEqual(numbers(english[1].artifact!.data));
    expect(chinese[1].artifact!.report!.answer).toContain('19%');
    expect(english[0].text).toContain('Is our revenue growth profitable?');
  });
});
