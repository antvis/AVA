import styled from 'styled-components';

import { getThemeColor, getFontSize, getLineHeight } from '../theme';

import type { ThemeStylesProps } from '../types';

export const P = styled.p<ThemeStylesProps>`
  font-family: PingFangSC, sans-serif;
  color: ${({ theme }) => getThemeColor('colorBase', theme)};
  font-size: ${({ size }) => getFontSize(size)};
  min-height: 24px;
  line-height: ${({ size }) => getLineHeight(size)};
  margin-bottom: 4px;
`;
