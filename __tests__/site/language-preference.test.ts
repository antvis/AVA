import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { LANGUAGE_STORAGE_KEY, languageRedirectScript } from '../../site/lib/language-preference';

function visit({
  pathname = '/',
  languages = ['zh-CN'],
  language = 'en-US',
  saved = null,
  storageBlocked = false,
  search = '',
  hash = '',
}: {
  pathname?: string;
  languages?: string[];
  language?: string;
  saved?: string | null;
  storageBlocked?: boolean;
  search?: string;
  hash?: string;
} = {}) {
  const replace = vi.fn();
  const getItem = vi.fn((key: string) => {
    expect(key).toBe(LANGUAGE_STORAGE_KEY);
    if (storageBlocked) throw new Error('Storage disabled');
    return saved;
  });
  runInNewContext(languageRedirectScript, {
    location: { pathname, search, hash, replace },
    navigator: { languages, language },
    localStorage: { getItem },
  });
  return { replace, getItem };
}

describe('homepage language preference', () => {
  it.each(['zh', 'zh-CN', 'zh-TW', 'zh-HK', 'ZH-cn'])('recognizes Chinese browser language %s', (language) => {
    expect(visit({ languages: [language] }).replace).toHaveBeenCalledWith('/zh/');
  });

  it.each([['en-US', 'zh-CN'], ['ja-JP'], ['zhuang']])('uses English for primary language %s', (...languages) => {
    expect(visit({ languages }).replace).not.toHaveBeenCalled();
  });

  it('falls back to navigator.language when languages is empty', () => {
    expect(visit({ languages: [], language: 'zh-CN' }).replace).toHaveBeenCalledWith('/zh/');
  });

  it('gives a manual English choice priority over the browser', () => {
    expect(visit({ saved: 'en' }).replace).not.toHaveBeenCalled();
  });

  it('remembers a manual Chinese choice on an English browser', () => {
    expect(visit({ saved: 'zh', languages: ['en-US'] }).replace).toHaveBeenCalledWith('/zh/');
  });

  it('ignores unrecognized saved preferences', () => {
    expect(visit({ saved: 'invalid' }).replace).toHaveBeenCalledWith('/zh/');
  });

  it('keeps the English homepage reachable when storage is blocked', () => {
    expect(visit({ storageBlocked: true }).replace).not.toHaveBeenCalled();
  });

  it.each(['/zh/', '/ai/', '/documentation/', '/documentation/data/sources/', '/zh/ai/'])(
    'preserves explicit page %s',
    (pathname) => {
      const { replace, getItem } = visit({ pathname, saved: 'zh' });
      expect(replace).not.toHaveBeenCalled();
      expect(getItem).not.toHaveBeenCalled();
    }
  );

  it('preserves query strings and anchors', () => {
    expect(visit({ search: '?example=1', hash: '#data' }).replace).toHaveBeenCalledWith('/zh/?example=1#data');
  });
});
