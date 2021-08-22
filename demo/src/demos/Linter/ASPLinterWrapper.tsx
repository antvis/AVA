import React from 'react';
import { Button } from 'antd';
import { Rule, VegaLite } from '../../packages/chart-linter/src';
import { prettyJSON } from '../utils';

interface Props {
  solverInit: boolean;
  vl: VegaLite;
  toVL2ASP: () => void;
  aspStr: string;
  toSolve: () => void;
  violatedRules: Rule[][];
}

export const ASPLinterWrapper = (props: Props) => {
  const { solverInit, vl, toVL2ASP, aspStr, toSolve, violatedRules } = props;

  return (
    <>
      <div className="asp-linter-wrapper">
        <div className="asp-code">
          <div>
            <p>ASP</p>
            <Button
              type="primary"
              disabled={!vl}
              onClick={() => {
                toVL2ASP();
              }}
            >
              Translate
            </Button>
          </div>
          <textarea className="code-textarea" value={aspStr} readOnly />
        </div>
        <div className="pipe-desc">
          <p>Vega-Lite</p>
          <p className="v-arrow indent">||</p>
          <p className="v-arrow indent">||</p>
          <p className="v-arrow indent">\/</p>
          <p className="lastline indent">{`ASP ==> result`}</p>
        </div>
        <div className="vl-code">
          <div>
            <p>
              {solverInit ? 'solver ready.' : 'solver initing...'} {!aspStr ? 'ASP is empty.' : ''}
            </p>
            <div>
              <Button
                type="primary"
                disabled={!solverInit || !aspStr}
                onClick={() => {
                  toSolve();
                }}
              >
                Solve
              </Button>
            </div>
          </div>
          <textarea
            className="code-textarea"
            value={violatedRules && violatedRules.length ? prettyJSON(violatedRules) : ''}
            readOnly
            style={{ background: 'bisque' }}
          />
        </div>
      </div>
    </>
  );
};
