import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Button, Menu, Dropdown, Empty } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { VegaLite } from 'react-vega';
import { getFieldsFromData, vl2asp, Linter, fixer } from '@antv/chart-linter';

const EXAMPLES = [
    {
        name: 'badsize',
        spec: {
            mark: 'point',
            encoding: {
                x: {
                    field: 'Horsepower',
                    type: 'quantitative',
                },
                y: {
                    field: 'Miles_per_Gallon',
                    type: 'quantitative',
                },
                size: {
                    field: 'Origin',
                    type: 'nominal',
                },
            },
            data: {
                url: 'https://gw.alipayobjects.com/os/antfincdn/%24JXRLVNQw0/cars.json',
            },
        },
    },
    {
        name: 'badx',
        spec: {
            mark: 'bar',
            encoding: {
                x: {
                    field: 'Acceleration',
                    type: 'quantitative',
                },
                y: {
                    field: 'Horsepower',
                    type: 'quantitative',
                },
            },
            data: {
                url: 'https://gw.alipayobjects.com/os/antfincdn/%24JXRLVNQw0/cars.json',
            },
        },
    },
    {
        name: 'badlogzero',
        spec: {
            mark: 'bar',
            encoding: {
                x: {
                    field: 'Acceleration',
                    type: 'quantitative',
                },
                y: {
                    field: 'Horsepower',
                    type: 'quantitative',
                    scale: {
                        zero: true,
                        type: 'log',
                    },
                },
            },
            data: {
                url: 'https://gw.alipayobjects.com/os/antfincdn/%24JXRLVNQw0/cars.json',
            },
        },
    },
];

const ChartVl = (props) => {
    const { spec, data } = props;
    return (
        <div>
            <VegaLite spec={spec} data={data} />
        </div>
    );
};

const prettyJSON = json => {
    return JSON.stringify(
        json,
        function (_, v) {
            for (const p in v) {
                if (v[p] instanceof Object) {
                    return v;
                }
            }
            return JSON.stringify(v, null, 1);
        },
        2
    )
        .replace(/\\n/g, '')
        .replace(/\\/g, '')
        .replace(/"\[/g, '[')
        .replace(/\]"/g, ']')
        .replace(/"\{/g, '{')
        .replace(/\}"/g, ' }');
};

const ChartCodeWrapper = (props) => {
    const { spec } = props;

    return (
        <div style={{ display: 'flex' }}>
            <div>{spec.mark ? <ChartVl spec={spec} /> : <Empty description="empty spec" />}</div>
            <div>
                <textarea
                    style={{ width: 360, height: 240, marginLeft: 16, resize: 'none', wordWrap: 'break-word', overflowY: 'scroll' }}
                    value={spec.mark ? prettyJSON(spec) : ''}
                    readOnly
                />
            </div>
        </div>
    );
};

const LinterWrapper = (props) => {
    const { solverInit, aspStr, toSolve, violatedRules } = props;

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Button
                    type="primary"
                    disabled={!solverInit || !aspStr}
                    onClick={() => {
                        toSolve();
                    }}
                >
                    Solve
                </Button>
                <span style={{ marginLeft: 16 }}>
                    {solverInit ? 'solver ready.' : 'solver initing...'}
                </span>
            </div>
            <textarea
                style={{ width: 460, height: 100, marginLeft: 16, resize: 'none', wordWrap: 'break-word', overflowY: 'scroll' }}
                value={violatedRules && violatedRules.length ? prettyJSON(violatedRules) : ''}
                readOnly
            />
        </div>
    );
};

const App = () => {
    const [linter, setLinter] = useState();
    const [solverInit, setSolverInit] = useState(false);
    const [exampleIndex, setExampleIndex] = useState(0);
    const [aspStr, setAspStr] = useState('');
    const [violatedRules, setViolatedRules] = useState([]);
    const [optVl, setOptVl] = useState({});
    const [fixing, setFixing] = useState(false);
    const [fieldInfos, setFieldInfos] = useState([]);

    const pickViolatedRuleArray = violatedRules[0];
    const example = EXAMPLES[exampleIndex];

    useEffect(() => {
        const linter = new Linter();

        linter.init().then(() => {
            setLinter(linter);
            setSolverInit(true);
        });
    }, []);

    useEffect(() => {
        const transformVltoAsp = async spec => {
            const newFieldInfos = await getFieldsFromData(spec);
            setFieldInfos(newFieldInfos);
            const newAspStr = example.spec && vl2asp(spec, newFieldInfos).join('\n');
            setAspStr(newAspStr);
        }
        transformVltoAsp(example.spec);
    }, [exampleIndex]);

    const reset = () => {
        setAspStr('');
        setViolatedRules([]);
        setOptVl({});
        setFixing(false);
        setFieldInfos([]);
    }

    const toSolve = program => {
        const { rules } = linter.solve(program, { models: 5 });
        setViolatedRules(rules);
    }

    const toFix = async (spec, rules) => {
        setFixing(true);
        const { optimizedVL } = await fixer(spec, rules, fieldInfos);
        setOptVl(optimizedVL);
        setFixing(false);
    }

    const menu = (
        <Menu
            onClick={({ key }) => {
                reset();
                setExampleIndex(key);
            }}
        >
            {EXAMPLES.map((example, index) => (
                <Menu.Item key={index} icon={<BarChartOutlined />}>
                    {example.name}
                </Menu.Item>
            ))}
        </Menu>
    );

    return (
        <div>
            <h3>Scroll to view all</h3>

            <Dropdown.Button overlay={menu}>{example.name}</Dropdown.Button>
            <ChartCodeWrapper spec={example.spec} />

            <LinterWrapper
                solverInit={solverInit}
                aspStr={aspStr}
                toSolve={() => {
                    toSolve(aspStr);
                }}
                violatedRules={violatedRules}
            />

            <div style={{ marginTop: 32 }}>
                <Button
                    type="primary"
                    disabled={!violatedRules || !violatedRules.length}
                    onClick={async () => {
                        await toFix(example.spec, pickViolatedRuleArray);
                    }}
                >
                    Fix
                </Button>
                <span style={{ marginLeft: 16 }}>
                    {violatedRules && violatedRules.length && optVl.mark ? 'Done.' : fixing ? 'Fixing...' : ''}
                </span>
            </div>

            <ChartCodeWrapper spec={optVl} />
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('container'));
