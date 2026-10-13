'use client';

import { useEffect, useState } from 'react';

type Heading = { id: string; text: string; level: number };

export default function DocsToc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.docs-prose h2, .docs-prose h3'));
    setHeadings(
      elements.map((element) => ({
        id: element.id,
        text: element.textContent || '',
        level: Number(element.tagName[1]),
      }))
    );
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = elements[0]?.id || '';
      for (const element of elements) {
        if (element.getBoundingClientRect().top > 150) break;
        current = element.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <aside className="docs-toc">
      <nav aria-label="On this page">
        <p>
          <span aria-hidden="true">≡</span> On this page
        </p>
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={heading.level === 3 ? 'docs-toc-nested' : undefined}
            aria-current={active === heading.id ? 'location' : undefined}
          >
            {heading.text}
          </a>
        ))}
      </nav>
      <a className="docs-help-link" href="https://github.com/antvis/AVA/issues">
        Have a question? <span aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}
