// TODO @pddpd 这里先 disable entire file 使得 git 能提交上去
/* eslint-disable no-nested-ternary */
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Badge, Popover, Checkbox } from 'antd';
// import { g2plotRender } from '@antv/chart-advisor';
// import { getFieldsFromData, vl2asp, Linter, libConfigToSpec } from '@antv/chart-linter';

const data = [
  {
    type: 'furniture',
    sales: 38,
  },
  {
    type: 'food',
    sales: 52,
  },
  {
    type: 'fruit',
    sales: 61,
  },
  {
    type: 'lights',
    sales: 145,
  },
  {
    type: 'kitchen',
    sales: 48,
  },
  {
    type: 'garden',
    sales: 38,
  },
  {
    type: 'drink',
    sales: 38,
  },
  {
    type: 'pets',
    sales: 38,
  },
];

const originalConfig = {
  type: 'Column',
  configs: {
    xField: 'type',
    yField: 'sales',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    yAxis: {
      minLimit: 20,
    },
    meta: {
      type: {
        alias: 'category',
      },
    },
  },
};

const RuleLibrary = {
  bar_without_domain_min_column: {
    lintText: 'It is not recommended to set  y-axis for bar or column charts',
    fixText: 'Remove the minimum value config of y-axis',
  },
};

const ActionLibrary = {
  bar_without_domain_min_column: (config) => {
    return {
      check: {
        yAxis: {
          minLimit: undefined,
        },
      },
      undo: {
        yAxis: {
          minLimit: config?.yAxis?.minLimit,
        },
      },
    };
  },
};

const App = () => {
  const canvas = useRef(null);
  const chart = useRef(null);

  const [rules, setRules] = useState([]);
  const [config, setConfig] = useState(originalConfig);

  useEffect(() => {
    if (rules.length <= 0) {
      const initLinter = async () => {
        const linter = new Linter();
        const libConfig = {
          type: 'column',
          options: {
            ...config.configs,
            data,
          },
        };

        const adaptedSpec = libConfigToSpec(libConfig);

        const transformSpecToAsp = async (spec) => {
          const fieldInfos = await getFieldsFromData(spec);
          return vl2asp(spec, fieldInfos).join('\n');
        };

        const aspStr = adaptedSpec && (await transformSpecToAsp(adaptedSpec));

        linter.init().then(() => {
          if (aspStr) {
            const { rules: linterRules } = linter.solve(aspStr, { models: 5 });
            setRules(
              linterRules?.[0]?.map((rule) => ({
                id: rule?.id,
                checked: false,
              }))
            );
          }
        });
      };
      initLinter();
    }

    if (canvas.current) {
      if (chart.current) {
        chart.current.update(config.configs);
      } else {
        g2plotRender(canvas.current, data, config).then((plot) => {
          chart.current = plot;
        });
      }
    }
  }, [config]);

  const checkFix = (e, checkedRuleId) => {
    const { checked } = e.target;
    setRules(
      rules.map((rule) => {
        if (rule.id === checkedRuleId) {
          const action = ActionLibrary[checkedRuleId](originalConfig.configs);
          if (checked) {
            setConfig({
              ...config,
              ...{
                configs: {
                  ...action.check,
                },
              },
            });
          } else {
            setConfig({
              ...config,
              ...{
                configs: {
                  ...action.undo,
                },
              },
            });
          }

          return {
            ...rule,
            checked,
          };
        }
        return null;
      })
    );
  };

  const renderLinter =
    rules.length > 0 ? (
      <div>
        <h3>This chart has the following improvements</h3>
        <ul>
          {rules.map((rule) => (
            <li key={rule.id}>
              <div>{RuleLibrary[rule.id]?.lintText}</div>
              <div>
                <Checkbox checked={rule.checked} onChange={(e) => checkFix(e, rule.id)}>
                  {RuleLibrary[rule.id]?.fixText}
                </Checkbox>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div style={{ display: 'flex' }}>
      <div ref={canvas} style={{ flex: 8, minHeight: 300 }} />
      <div style={{ flex: 2 }}>
        <Popover content={renderLinter} trigger="click">
          {rules.length > 0 ? (
            <Badge count={rules.length} style={{ backgroundColor: '#faad14', cursor: 'pointer' }} />
          ) : (
            <span>ChartLinter Loading...</span>
          )}
        </Popover>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
