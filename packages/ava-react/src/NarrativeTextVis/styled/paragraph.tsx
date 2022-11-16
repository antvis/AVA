import styled from 'styled-components';
import { seedToken, getFontSize } from '../theme';
import type { ThemeProps } from '../interface';

export const P = styled.p<ThemeProps>`
  font-family: PingFangSC, sans-serif;
  color: ${seedToken.colorBase};
  font-size: ${getFontSize};
  min-height: 24px;
  line-height: 24px;
  margin-bottom: 4px;
`;
