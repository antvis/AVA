import styled from 'styled-components';
import { ThemeProps } from '../interface';
import { seedToken, getFontSize } from '../theme';

export const Entity = styled.span<ThemeProps>`
  display: flex;
  display: inline-block;
  align-items: center;
  box-sizing: border-box;
  font-size: ${getFontSize};
  font-family: Roboto-Medium, sans-serif;
  line-height: 1.5em;
  border-radius: 2px;
  color: ${seedToken.colorEntityBase};
`;
