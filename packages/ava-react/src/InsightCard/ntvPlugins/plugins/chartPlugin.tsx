import React from 'react';

import { createCustomBlockFactory } from '../../../NarrativeTextVis';
import { DISPLAY_CHARTS_PLUGIN_KEY } from '../../constants';
import { ChartCarousel } from '../components/ChartCarousel';
import { ChartsSchema } from '../types';

/** plugins to display charts in ntv */
export const chartsDisplayPlugin = createCustomBlockFactory<ChartsSchema>({
  key: DISPLAY_CHARTS_PLUGIN_KEY,
  render(item) {
    const { chartSpecs } = item;
    if (chartSpecs) {
      return <ChartCarousel charts={chartSpecs} />;
    }
    return null;
  },
});
