import styled from 'styled-components';

import { getFontSize, getThemeColor } from '../theme';

import type { ThemeStylesProps } from '../types';

export const Entity = styled.span<ThemeStylesProps>`
  display: flex;
  display: inline-block;
  align-items: center;
  box-sizing: border-box;
  font-size: ${({ size }) => getFontSize(size)};
  font-family: Roboto-Medium, sans-serif;
  border-radius: 2px;
  color: ${({ theme }) => getThemeColor('colorEntityBase', theme)};
  margin: 0 1px;
`;
