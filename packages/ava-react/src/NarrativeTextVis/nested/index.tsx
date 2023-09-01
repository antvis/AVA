import React from 'react';

import { v4 } from 'uuid';

import { Paragraph, type ParagraphProps } from '../paragraph';
import { Container } from '../styled';

import type { NestedParagraphSpec } from '@antv/ava';

type NestedParagraphProps = Omit<ParagraphProps, 'spec'> & {
  spec: NestedParagraphSpec;
};

export function NestedParagraph({ spec, ...paragraphProps }: NestedParagraphProps) {
  return (
    <Container style={spec.styles} className={spec.className}>
      {spec.children?.map((item) => {
        if ('children' in item && !('customType' in item)) {
          return <NestedParagraph key={item.key || v4()} spec={item} {...paragraphProps} />;
        }
        return <Paragraph key={item.key || v4()} spec={item} {...paragraphProps} />;
      })}
    </Container>
  );
}
