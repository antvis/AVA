'use client';

import { Fragment, useEffect, useState } from 'react';
import type { ThemedToken } from 'shiki';
import { highlightCode } from './utils';

export default function CodePreview({ code, language }: { code: string; language: 'javascript' | 'sql' | 'json' }) {
  const [highlighted, setHighlighted] = useState<{ code: string; language: string; tokens: ThemedToken[][] }>();
  useEffect(() => {
    let active = true;
    highlightCode(code, language)
      .then((tokens) => {
        if (active) setHighlighted({ code, language, tokens });
      })
      .catch(() => {
        /* Keep the source readable if highlighting cannot load. */
      });
    return () => {
      active = false;
    };
  }, [code, language]);
  const tokens = highlighted?.code === code && highlighted.language === language ? highlighted.tokens : undefined;
  return (
    <pre className="overflow-x-auto rounded-lg bg-field p-3 font-mono text-[12px] leading-relaxed text-ink">
      <code>
        {tokens
          ? tokens.map((line, index) => (
              <Fragment key={index}>
                {index > 0 && '\n'}
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} style={{ color: token.color }}>
                    {token.content}
                  </span>
                ))}
              </Fragment>
            ))
          : code}
      </code>
    </pre>
  );
}
