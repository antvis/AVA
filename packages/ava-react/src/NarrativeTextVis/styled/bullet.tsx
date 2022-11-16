import styled from 'styled-components';
import { seedToken, getFontSize } from '../theme';
import type { ThemeProps } from '../interface';

export const Bullet = styled.div<ThemeProps>`
  padding-left: 16px;
  font-family: PingFangSC, sans-serif;
  color: ${seedToken.colorBase};
  font-size: ${getFontSize};
  margin-bottom: 4px;
`;

export const Ol = styled(Bullet)`
  list-style-type: decimal;
`;

export const Ul = styled(Bullet)`
  list-style-type: disc;
`;

export const Li = styled.li`
  list-style: inherit;
  line-height: 1.74;

  ::marker {
    margin-right: -8px;
  }
`;
