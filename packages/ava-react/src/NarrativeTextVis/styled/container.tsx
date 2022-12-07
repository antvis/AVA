import styled from 'styled-components';

import { getThemeColor, getFontSize, getLineHeight } from '../theme';

import type { ThemeStylesProps } from '../types';

export const Container = styled.div<ThemeStylesProps>`
  font-family: PingFangSC, sans-serif;
  color: ${({ theme }) => getThemeColor('colorBase', theme)};
  font-size: ${({ size }) => getFontSize(size)};
  line-height: ${({ size }) => getLineHeight(size)};
`;
