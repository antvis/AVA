import styled from 'styled-components';

import { getFontSize, getThemeColor, getLineHeight } from '../theme';
import { NTV_PREFIX_CLS } from '../constants';

import type { ThemeStylesProps } from '../types';

export const Bullet = styled.div<ThemeStylesProps>`
  padding-left: 16px;
  font-family: PingFangSC, sans-serif;
  color: ${({ theme }) => getThemeColor('colorBase', theme)};
  font-size: ${({ size }) => getFontSize(size)};
  margin-bottom: 8px;
  line-height: ${({ size }) => getLineHeight(size)};
`;

export const Ol = styled(Bullet)`
  list-style-type: decimal;
`;

export const Ul = styled(Bullet)`
  list-style-type: disc;
`;

const SWITCHER_ICON_TOP = '24px';

export const Li = styled.li<
  ThemeStylesProps & {
    collapsible: boolean;
    showLine: boolean;
  }
>`
  list-style: inherit;
  color: ${({ theme }) => getThemeColor('colorBase', theme)};
  font-size: ${({ size }) => getFontSize(size)};
  line-height: ${({ size }) => getLineHeight(size)};
  position: relative;
  transform: ${({ collapsible, size }) =>
    collapsible ? `translateX(${size === 'small' ? '12px' : '16px'})` : undefined};
  ::marker {
    margin-right: -8px;
  }

  > .${NTV_PREFIX_CLS}-switcher-icon {
    position: absolute;
    left: ${({ size }) => (size === 'small' ? '-30px' : '-32px')};
    top: 0px;
    cursor: pointer;
    color: #979797;
  }

  // 折叠线
  ::before {
    content: '';
    position: absolute;
    left: ${({ size }) => (size === 'small' ? '-24px' : '-26px')};
    top: ${SWITCHER_ICON_TOP};
    width: 1px;
    height: ${`calc(100% - ${SWITCHER_ICON_TOP})`};
    border-right: ${({ showLine }) => (showLine ? '0.8px solid rgba(31, 3, 82, 0.2)' : undefined)};
    box-sizing: border-box;
  }
`;
