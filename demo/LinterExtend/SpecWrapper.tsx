import React, { useEffect } from 'react';
import { prettyJSON } from '../utils';
import { View, parse } from 'vega';
import { compile } from 'vega-lite';

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
    <div className="chart-code-wrapper">
      <div id="vl-demo-contanier" className="chart" />
      <div className="code">
        <textarea className="vl-code-textarea code-textarea" defaultValue={prettyJSON(spec)} readOnly />
      </div>
    </div>
  );
};
