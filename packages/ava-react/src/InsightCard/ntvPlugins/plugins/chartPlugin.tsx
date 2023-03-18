import React from 'react';

import { createCustomBlockFactory } from '../../../NarrativeTextVis';
import { CHART_CAROUSEL_PLUGIN_KEY } from '../../constants';
import { ChartCarousel } from '../components/ChartCarousel';
import { ChartsSchema } from '../types';

/** plugins to display charts in ntv */
export const chartCarouselPlugin = createCustomBlockFactory<ChartsSchema>({
  key: CHART_CAROUSEL_PLUGIN_KEY,
  render(item) {
    const { value } = item;
    if (value?.charts) {
      return <ChartCarousel charts={value?.charts} />;
    }
    return null;
  },
});
