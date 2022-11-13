import React from 'react';

const MARGIN_RIGHT = 2;

export const ArrowUp = () => (
  <svg
    width="8px"
    height="9px"
    style={{ transform: 'rotate(180deg)', marginRight: MARGIN_RIGHT }}
    viewBox="0 0 8 9"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g transform="translate(-2.000000, -2.000000)">
      <polygon fill="currentColor" points="6 11 9.5 2 2.5 2" />
    </g>
  </svg>
);

export const ArrowDown = () => (
  <svg
    width="8px"
    height="9px"
    viewBox="0 0 8 9"
    style={{ marginRight: MARGIN_RIGHT }}
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g transform="translate(-2.000000, -2.000000)">
      <polygon fill="currentColor" points="6 11 9.5 2 2.5 2" />
    </g>
  </svg>
);
