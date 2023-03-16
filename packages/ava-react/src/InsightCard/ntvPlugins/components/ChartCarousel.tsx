import React, { useState } from 'react';

import { CHART_HEIGHT, INSIGHT_CARD_PREFIX_CLS } from '../../constants';

import { G2Chart } from './G2Chart';

import type { G2Spec } from '@antv/g2';

export const ChartCarousel = ({
  charts,
}: {
  /** 图表类 schema, any 是因为不限制具体的图表类型 */
  charts: G2Spec[];
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
            border: 'solid 1px',
            borderColor: index === selectedChartIndex ? '#3471f9' : 'rgba(0,0,0,0.25)',
            borderRadius: '2px',
            padding: '2px',
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
      <G2Chart spec={charts[selectedChartIndex]} height={CHART_HEIGHT} />
      {chartsOptions.length > 1 && (
        <div style={{ marginTop: '4px', textAlign: 'center' }}>
          {chartsOptions.map((option) => (
            <span key={option.value}>{option.label}</span>
          ))}
        </div>
      )}
    </div>
  );
};
