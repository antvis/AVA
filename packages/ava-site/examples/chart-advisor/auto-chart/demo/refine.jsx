import React, { useState, useRef, useEffect } from 'react';
import { Switch } from 'antd';
import ReactDOM from 'react-dom';
import { autoChart } from '@antv/chart-advisor';

const data = [
  {
    series: 'London',
    month: '2019-01',
    value: 3188,
  },
  {
    series: 'London',
    month: '2019-02',
    value: 3171,
  },
  {
    series: 'London',
    month: '2019-03',
    value: 3156,
  },
  {
    series: 'London',
    month: '2019-04',
    value: 3150,
  },
  {
    series: 'London',
    month: '2019-05',
    value: 3130,
  },
  {
    series: 'London',
    month: '2019-06',
    value: 3119,
  },
  {
    series: 'Paris',
    month: '2019-01',
    value: 3048,
  },
  {
    series: 'Paris',
    month: '2019-02',
    value: 3071,
  },
  {
    series: 'Paris',
    month: '2019-03',
    value: 3086,
  },
  {
    series: 'Paris',
    month: '2019-04',
    value: 3103,
  },
  {
    series: 'Paris',
    month: '2019-05',
    value: 3113,
  },
  {
    series: 'Paris',
    month: '2019-06',
    value: 3128,
  },
  {
    series: 'Venice',
    value: 3033,
    month: '2019-01',
  },
  {
    series: 'Venice',
    value: 3037,
    month: '2019-02',
  },
  {
    series: 'Venice',
    value: 3024,
    month: '2019-03',
  },
  {
    series: 'Venice',
    value: 3033,
    month: '2019-04',
  },
  {
    series: 'Venice',
    value: 3043,
    month: '2019-05',
  },
  {
    series: 'Venice',
    value: 3028,
    month: '2019-06',
  },
  {
    month: '2019-07',
    value: 3118,
    series: 'London',
  },
  {
    month: '2019-07',
    value: 3136,
    series: 'Paris',
  },
  {
    month: '2019-07',
    value: 3019,
    series: 'Venice',
  },
  {
    month: '2019-08',
    value: 3113,
    series: 'London',
  },
  {
    month: '2019-08',
    value: 3145,
    series: 'Paris',
  },
  {
    month: '2019-08',
    value: 3019,
    series: 'Venice',
  },
  {
    month: '2019-09',
    value: 3113,
    series: 'London',
  },
  {
    month: '2019-09',
    value: 3153,
    series: 'Paris',
  },
  {
    month: '2019-09',
    value: 3028,
    series: 'Venice',
  },
  {
    month: '2019-10',
    value: 3109,
    series: 'London',
  },
  {
    month: '2019-10',
    value: 3162,
    series: 'Paris',
  },
  {
    month: '2019-10',
    value: 3036,
    series: 'Venice',
  },
  {
    month: '2019-11',
    value: 3107,
    series: 'London',
  },
  {
    month: '2019-11',
    value: 3172,
    series: 'Paris',
  },
  {
    month: '2019-11',
    value: 3030,
    series: 'Venice',
  },
  {
    month: '2019-12',
    value: 3099,
    series: 'London',
  },
  {
    month: '2019-12',
    value: 3173,
    series: 'Paris',
  },
  {
    month: '2019-12',
    value: 3046,
    series: 'Venice',
  },
  {
    month: '2020-01',
    value: 3085,
    series: 'London',
  },
  {
    month: '2020-01',
    value: 3165,
    series: 'Paris',
  },
  {
    month: '2020-01',
    value: 3048,
    series: 'Venice',
  },
  {
    month: '2020-02',
    value: 3144,
    series: 'London',
  },
  {
    month: '2020-02',
    value: 3170,
    series: 'Paris',
  },
  {
    month: '2020-02',
    value: 3046,
    series: 'Venice',
  },
  {
    month: '2020-03',
    value: 3164,
    series: 'London',
  },
  {
    month: '2020-03',
    value: 3190,
    series: 'Paris',
  },
  {
    month: '2020-03',
    value: 3045,
    series: 'Venice',
  },
  {
    month: '2020-04',
    value: 3175,
    series: 'London',
  },
  {
    month: '2020-04',
    value: 3189,
    series: 'Paris',
  },
  {
    month: '2020-04',
    value: 3046,
    series: 'Venice',
  },
];

const App = () => {
  const canvas = useRef();
  const [refine, setRefine] = useState(false);
  const onChange = (checked) => {
    setRefine(checked);
  };
  useEffect(() => {
    if (canvas.current) {
      autoChart(canvas.current, data, { refine });
    }
  }, [refine]);
  return (
    <div>
      <div>
        refine: <Switch checked={refine} onChange={onChange} />
      </div>
      <div ref={canvas} style={{ minHeight: 300 }} />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
