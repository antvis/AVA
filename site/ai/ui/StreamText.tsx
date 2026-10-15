'use client';

import { Streamdown } from 'streamdown';

export default function StreamText({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <Streamdown
      className="min-w-0 [overflow-wrap:anywhere] leading-[1.7]
        [&>*]:my-0 [&&>*+*]:mt-2
        [&_p]:max-w-none [&_p]:text-[length:inherit] [&_p]:leading-[inherit]
        [&_:is(h1,h2,h3,h4,h5,h6)]:[font-family:var(--font-body)]!
        [&_:is(h1,h2,h3,h4,h5,h6)]:text-[1.05em]
        [&_:is(h1,h2,h3,h4,h5,h6)]:font-semibold
        [&_:is(h1,h2,h3,h4,h5,h6)]:tracking-normal!
        [&_:is(h1,h2,h3,h4,h5,h6)]:text-[var(--color-ink)]
        [&_:is(ul,ol)]:my-0 [&_:is(ul,ol)]:pl-[1.4em]
        [&_:is(li,li>p)]:my-0.5 [&_:is(li,li>p)]:py-0
        [&_blockquote]:border-[var(--color-primary)] [&_blockquote]:text-[var(--color-ink-2)]
        [&_:is(a,[data-streamdown=link])]:text-[var(--color-ink)]
        [&_:is(a,[data-streamdown=link])]:decoration-[var(--color-primary-dark)]
        [&_:is(a,[data-streamdown=link])]:underline-offset-[3px]
        [&_:is(table,th,td)]:text-[12px]
        [&_:is([data-streamdown=code-block],[data-streamdown=table-wrapper],code:not(pre_code))]:bg-[var(--color-field)]
        [&_:is([data-streamdown=code-block],[data-streamdown=table-wrapper],code:not(pre_code))]:border-[var(--color-line)]
        [&_:is([data-streamdown=code-block-body],th,td)]:border-[var(--color-line)]
        [&_:is([data-streamdown=code-block-body],th,td)]:bg-[var(--color-surface)]
        [&_[data-streamdown=code-block-header]]:text-[var(--color-ink-2)]
        [&_pre]:text-[12px] [&_pre]:leading-[1.6]"
      isAnimating={streaming}
      controls={{ code: { copy: true, download: false }, table: false }}
      lineNumbers={false}
    >
      {text}
    </Streamdown>
  );
}
