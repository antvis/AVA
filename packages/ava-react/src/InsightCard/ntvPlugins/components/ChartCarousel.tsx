import React, { useState } from 'react';

import { CHART_HEIGHT, INSIGHT_CARD_PREFIX_CLS } from '../../constants';

import { G2Chart } from './G2Chart';

import type { G2Spec } from '@antv/g2';

export const ChartCarousel = ({
  charts,
  height = CHART_HEIGHT,
  width,
}: {
  charts: G2Spec[];
  height?: number;
  width?: number;
}) => {
  const [selectedChartIndex, setSelectedCardIndex] = useState(0);

  const onSelect = (value: number) => {
    setSelectedCardIndex(value);
  };

  const chartsOptions = charts.map((chart, index) => {
    return {
      label: (
        <span
          style={{
            border: index === selectedChartIndex ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(0,0,0,0.1)',
            borderRadius: '2px',
            display: 'inline-block',
            width: index === selectedChartIndex ? '18px' : '12px',
            height: '4px',
            backgroundColor: index === selectedChartIndex ? '#fff' : 'rgba(0,0,0,0.15)',
            cursor: 'pointer',
            margin: '2px',
          }}
          onClick={() => {
            onSelect(index);
          }}
        ></span>
      ),
      value: index,
    };
  });

  return (
    <div className={`${INSIGHT_CARD_PREFIX_CLS}-chart-carousel`}>
      <G2Chart spec={charts[selectedChartIndex]} height={height} width={width} />
      {chartsOptions.length > 1 && (
        <div style={{ textAlign: 'center' }}>
          {chartsOptions.map((option) => (
            <span key={option.value}>{option.label}</span>
          ))}
        </div>
      )}
    </div>
  );
};
