import React, { useState } from 'react';
import { Button, Divider, Row, Col } from 'antd';
import { AntVSpec } from '@antv/antv-spec';
import { Linter, Lint } from '../../../../../packages/chart-advisor/src/linter';
import { Chart } from '../Chart';
import { LintCard } from './LintCard';

// const errorSpec = {
//   'basis': {
//     'type': 'chart'
//   },
//   'data': {
//     'type': 'json-array',
//     'values': [
//       { 'year': '2007', 'sales': 28 },
//       { 'year': '2008', 'sales': 55 },
//       { 'year': '2009', 'sales': 43 },
//       { 'year': '2010', 'sales': 91 },
//       { 'year': '2011', 'sales': 81 },
//       { 'year': '2012', 'sales': 53 },
//       { 'year': '2013', 'sales': 19 },
//       { 'year': '2014', 'sales': 87 },
//       { 'year': '2015', 'sales': 52 }
//     ]
//   },
//   'layer': [
//     {
//       'mark': 'area',
//       'encoding': {
//         'x': {
//           'field': 'year',
//           'type': 'temporal'
//         },
//         'y': {
//           'field': 'sales',
//           'type': 'quantitative'
//         }
//       }
//     }
//   ]
// };

const errorSpec = {
  'basis': {
    'type': 'chart'
  },
  'data': {
    'type': 'json-array',
    'values': [
      {'category': 'A', 'value': 4},
      {'category': 'B', 'value': 6},
      {'category': 'C', 'value': 10},
      {'category': 'D', 'value': 3},
      {'category': 'E', 'value': 7},
      {'category': 'F', 'value': 8}
    ]
  },
  'layer': [
    {
      'mark': 'arc',
      'encoding': {
        'theta': {'field': 'value', 'type': 'quantitative'},
        'color': {'field': 'category', 'type': 'nominal', 'scale': { 'range': ['#5b8ff9', '#753d91', '#b03c63', '#d5b471', '#4fb01f', '#608b7d']}}
      }
    }
  ]
};


export const LinterPanel = () => {
  const myLinter = new Linter();
  const [lints, setLints] = useState<Lint[]>([]);

  const getLint = () => {
    const myLint = myLinter.lint(errorSpec as AntVSpec);
    setLints(myLint);
  };



  return (
    <div style={{marginBottom: 20, maxWidth: 1000}}>
      <Divider orientation='left' plain style={{fontSize: 20}}> Linter </Divider>
      <Row align='middle'>
        <Col span={8}><Chart id={'linter-demo'} spec={errorSpec}> </Chart></Col>
        <Col span={4}><div style={{textAlign: 'center'}}><Button onClick={getLint} style={{width: 80}}>Lint</Button></div></Col>
        <Col span={12}><LintCard lints={lints}></LintCard></Col>
      </Row>
    </div>
  );
};
