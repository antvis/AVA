import styled from 'styled-components';

import { getFontSize, getThemeColor } from '../theme';

import type { ThemeStylesProps } from '../types';

export const Entity = styled.span<ThemeStylesProps>`
  align-items: center;
  box-sizing: border-box;
  font-size: ${({ size }) => getFontSize(size)};
  font-family: Roboto-Medium, PingFangSC, sans-serif;
  border-radius: 2px;
  color: ${({ theme }) => getThemeColor('colorEntityBase', theme)};
  margin: 0 1px;
  overflow-wrap: break-word;
`;
