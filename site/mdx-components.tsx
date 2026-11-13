import type { MDXComponents } from 'mdx/types';
import type { ComponentProps, ReactNode } from 'react';
import LocaleLink from './components/LocaleLink';
import CopyCode from './components/docs/CopyCode';

export function Heading({ as: Tag, children, id }: ComponentProps<'h2'> & { as: 'h2' | 'h3' | 'h4' }) {
  return (
    <Tag id={id}>
      <a href={`#${id}`} className="docs-heading-link">
        {children}
      </a>
    </Tag>
  );
}

const components: MDXComponents = {
  a: ({ href, ...props }) => <LocaleLink href={href ?? '#'} {...props} />,
  h2: (props) => <Heading as="h2" {...props} />,
  h3: (props) => <Heading as="h3" {...props} />,
  h4: (props) => <Heading as="h4" {...props} />,
  pre: (props) => (
    <div className="docs-code-block">
      <div className="docs-code-toolbar">
        <span>{((props as Record<string, unknown>)['data-language'] as string) || 'Code'}</span>
        <CopyCode />
      </div>
      <pre {...props} />
    </div>
  ),
  table: (props) => (
    <div className="docs-table">
      <table {...props} />
    </div>
  ),
  Callout: ({ children, icon }: { children: ReactNode; icon?: string }) => (
    <aside className="docs-callout">
      <span aria-hidden="true" className={icon ? 'docs-callout-emoji' : undefined}>
        {icon ?? 'i'}
      </span>
      <div>{children}</div>
    </aside>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
