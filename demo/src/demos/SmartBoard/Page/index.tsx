import React, { useState } from 'react';
import CHART_SAMPLE_LIST from '../ChartSamples';
import Dashboard from './Dashboard';
import Toolbar from './Toolbar';
import './index.less';

const Page = () => {
  const [interactionMode, changeMode] = useState('defaultMode');
  const [chartSamplesIndex, changeSampleIndex] = useState(0);

  return (
    <div className="page">
      <Toolbar changeMode={changeMode} changeSampleIndex={changeSampleIndex} />
      <Dashboard chartList={CHART_SAMPLE_LIST[chartSamplesIndex]} interactionMode={interactionMode} />
    </div>
  );
};

export default Page;
