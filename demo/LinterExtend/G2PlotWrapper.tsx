import React, { useEffect } from 'react';
import { prettyJSON } from '../utils';
import { G2PlotConfig } from '../../packages/chart-linter/src/adaptor';
import { g2plotRender } from './g2-render';
import styles from './index.module.less';

interface Props {
  config: G2PlotConfig;
}

export const G2PlotWrapper = (props: Props) => {
  const { config } = props;

  useEffect(() => {
    g2plotRender(`g2plot-demo-contanier`, config.type, config.options);
  }, [config]);

  return (
    <div className={styles.chartCodeWrapper}>
      <div id="g2plot-demo-contanier" className={styles.chart} />
      <div className={styles.code}>
        <textarea className={styles.codeTextarea} value={prettyJSON(config)} readOnly />
      </div>
    </div>
  );
};
