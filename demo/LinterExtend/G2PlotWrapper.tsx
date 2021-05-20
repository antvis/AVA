import React, { useEffect } from 'react';
import { prettyJSON } from '../utils';
import { G2PlotConfig } from '../../packages/chart-linter/src/adaptor';
import { g2plotRender } from './g2-render';

interface Props {
  config: G2PlotConfig;
}

export const G2PlotWrapper = (props: Props) => {
  const { config } = props;

  useEffect(() => {
    g2plotRender(`g2plot-demo-contanier`, config.type, config.options);
  }, []);

  return (
    <div className="chart-code-wrapper">
      <div id="g2plot-demo-contanier" className="chart" />
      <div className="code">
        <textarea className="vl-code-textarea code-textarea" value={prettyJSON(config)} readOnly />
      </div>
    </div>
  );
};
