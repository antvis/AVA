import styled from 'styled-components';

import { getFontSize, getThemeColor } from '../theme';

import type { ThemeStylesProps } from '../types';

export const Entity = styled.span<ThemeStylesProps>`
  align-items: center;
  box-sizing: border-box;
  font-size: ${({ size }) => getFontSize(size)};
  font-family: Roboto-Medium, PingFangSC, sans-serif;
  border-radius: 2px;
  // 这里 type 没有区分 colorBase 还是 colorEntityBase 都是 ‘text’，因为 colorToken 虽然不同但是目前默认色板一样，所以就先这样。
  // TODO @yuxi 待之后对标题等额外处理的时候可以一起考虑
  color: ${({ theme, palette }) => getThemeColor({ colorToken: 'colorEntityBase', theme, palette, type: 'text' })};
  margin: 0 1px;
  overflow-wrap: break-word;
`;
