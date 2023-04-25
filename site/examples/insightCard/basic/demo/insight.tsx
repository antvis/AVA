import React from 'react';

import ReactDOM from 'react-dom';
import { InsightCard } from '@antv/ava-react';
import { getInsights } from '@antv/ava';

import { timeSeriesData } from './mockData';

const trendInsightData = getInsights(timeSeriesData)?.insights[0];

ReactDOM.render(<InsightCard insightInfo={trendInsightData} />, document.getElementById('container'));
