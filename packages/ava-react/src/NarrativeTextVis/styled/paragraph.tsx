import styled from 'styled-components';

import { getThemeColor, getFontSize, getLineHeight } from '../theme';

import type { TextParagraphSpec } from '@antv/ava';
import type { ThemeStylesProps } from '../types';

export const P = styled.p<ThemeStylesProps & Pick<TextParagraphSpec, 'indents'>>`
  white-space: pre-wrap; // 默认 pre 显示，可以显示空格和转义字符
  font-family: PingFangSC, sans-serif;
  color: ${({ theme, palette }) => getThemeColor({ colorToken: 'colorBase', theme, palette, type: 'text' })};
  font-size: ${({ size }) => getFontSize(size)};
  min-height: 24px;
  line-height: ${({ size }) => getLineHeight(size)};
  margin-bottom: 4px;
  text-indent: ${({ indents }) => indents?.find((item) => item.type === 'first-line')?.length};
  padding-left: ${({ indents }) => indents?.find((item) => item.type === 'left')?.length};
  padding-right: ${({ indents }) => indents?.find((item) => item.type === 'right')?.length};
`;
