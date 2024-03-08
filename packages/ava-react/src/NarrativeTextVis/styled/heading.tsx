import styled from 'styled-components';

import { getThemeColor } from '../theme';

import type { ThemeStylesProps } from '../types';

export const H1 = styled.h1<ThemeStylesProps>`
  font-size: 28px;
  line-height: 36px;
  margin: 26px 0 10px 0;
  color: ${({ theme, palette }) => getThemeColor({ colorToken: 'colorBase', theme, palette, type: 'text' })};
`;

export const Headline = styled(H1)`
  border-bottom: 1px solid rgb(199, 199, 199);
`;

export const H2 = styled.h2<ThemeStylesProps>`
  font-size: 24px;
  line-height: 32px;
  margin: 21px 0 5px 0;
  color: ${({ theme, palette }) => getThemeColor({ colorToken: 'colorBase', theme, palette, type: 'text' })};
`;

export const H3 = styled.h3<ThemeStylesProps>`
  font-size: 20px;
  line-height: 28px;
  margin: 16px 0 5px 0;
  color: ${({ theme, palette }) => getThemeColor({ colorToken: 'colorBase', theme, palette, type: 'text' })};
`;

export const H4 = styled.h4<ThemeStylesProps>`
  font-size: 16px;
  line-height: 24px;
  margin: 10px 0 5px 0;
  color: ${({ theme, palette }) => getThemeColor({ colorToken: 'colorBase', theme, palette, type: 'text' })};
`;

export const H5 = styled.h5<ThemeStylesProps>`
  line-height: 24px;
  font-size: 15px;
  margin: 8px 0 5px 0;
  color: ${({ theme, palette }) => getThemeColor({ colorToken: 'colorBase', theme, palette, type: 'text' })};
`;

export const H6 = styled.h6<ThemeStylesProps>`
  min-height: 24px;
  line-height: 24px;
  letter-spacing: 0.008em;
  font-size: 15px;
  color: ${({ theme, palette }) => getThemeColor({ colorToken: 'colorBase', theme, palette, type: 'text' })};
`;
