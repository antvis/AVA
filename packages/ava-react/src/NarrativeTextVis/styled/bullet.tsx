import styled from 'styled-components';

import { getFontSize, getThemeColor, getLineHeight } from '../theme';

import type { ThemeStylesProps } from '../types';

export const Bullet = styled.div<ThemeStylesProps>`
  padding-left: 16px;
  font-family: PingFangSC, sans-serif;
  color: ${({ theme }) => getThemeColor('colorBase', theme)};
  font-size: ${({ size }) => getFontSize(size)};
  margin-bottom: 4px;
  line-height: ${({ size }) => getLineHeight(size)};
`;

export const Ol = styled(Bullet)`
  list-style-type: decimal;
`;

export const Ul = styled(Bullet)`
  list-style-type: disc;
`;

export const Li = styled.li<ThemeStylesProps>`
  list-style: inherit;
  color: ${({ theme }) => getThemeColor('colorBase', theme)};
  font-size: ${({ size }) => getFontSize(size)};
  line-height: ${({ size }) => getLineHeight(size)};

  ::marker {
    margin-right: -8px;
  }
`;
