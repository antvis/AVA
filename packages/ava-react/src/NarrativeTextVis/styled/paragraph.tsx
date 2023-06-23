import styled from 'styled-components';

import { getThemeColor, getFontSize, getLineHeight } from '../theme';

import type { TextParagraphSpec } from '@antv/ava';
import type { ThemeStylesProps } from '../types';

export const P = styled.p<ThemeStylesProps & Pick<TextParagraphSpec, 'indents'>>`
  font-family: PingFangSC, sans-serif;
  color: ${({ theme }) => getThemeColor('colorBase', theme)};
  font-size: ${({ size }) => getFontSize(size)};
  min-height: 24px;
  line-height: ${({ size }) => getLineHeight(size)};
  margin-bottom: 4px;
  text-indent: ${({ indents }) => indents?.find((item) => item.type === 'first-line')?.length};
  padding-left: ${({ indents }) => indents?.find((item) => item.type === 'left')?.length};
  padding-right: ${({ indents }) => indents?.find((item) => item.type === 'right')?.length};
`;
