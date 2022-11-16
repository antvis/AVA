import styled from 'styled-components';
import { seedToken, getFontSize } from '../theme';
import type { ThemeProps } from '../interface';

export const Container = styled.div<ThemeProps>`
  font-family: PingFangSC, sans-serif;
  color: ${seedToken.colorBase};
  font-size: ${getFontSize};
`;
