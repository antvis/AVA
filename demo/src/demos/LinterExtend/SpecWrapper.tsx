import React, { useEffect } from 'react';
import { prettyJSON } from '../utils';
import { View, parse } from 'vega';
import { compile } from 'vega-lite';
import styles from './index.module.less';
interface Props {
  spec: any;
}

export const SpecWrapper = (props: Props) => {
  const { spec } = props;

  useEffect(() => {
    if (Object.keys(spec).length > 0) {
      new View(parse(compile({ ...spec } as any).spec))
        .initialize(document.getElementById(`vl-demo-contanier`)!)
        .runAsync();
    }
  }, [spec]);

  return (
    <div className={styles.chartCodeWrapper}>
      <div id="vl-demo-contanier" className={styles.chart} />
      <div className={styles.code}>
        <textarea className={styles.codeTextarea} defaultValue={prettyJSON(spec)} readOnly />
      </div>
    </div>
  );
};
