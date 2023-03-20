export const timeSeriesChartSpec = {
  type: 'view',
  theme: 'classic',
  axis: {
    x: {
      labelAutoHide: true,
      labelAutoRotate: false,
      title: false,
    },
    y: {
      title: false,
    },
  },
  scale: {
    y: {
      nice: true,
    },
  },
  interaction: {
    tooltip: {
      groupName: false,
    },
  },
  legend: false,
  children: [
    {
      data: [
        {
          date: '2019-08-12',
          discountPrice: 781.99,
        },
        {
          date: '2019-08-13',
          discountPrice: 835.71,
        },
        {
          date: '2019-08-14',
          discountPrice: 839.24,
        },
        {
          date: '2019-08-15',
          discountPrice: 883.51,
        },
        {
          date: '2019-08-16',
          discountPrice: 873.98,
        },
        {
          date: '2019-08-17',
          discountPrice: 802.78,
        },
        {
          date: '2019-08-18',
          discountPrice: 807.05,
        },
        {
          date: '2019-08-19',
          discountPrice: 885.12,
        },
        {
          date: '2019-08-20',
          discountPrice: 1018.85,
        },
        {
          date: '2019-08-21',
          discountPrice: 934.49,
        },
        {
          date: '2019-08-22',
          discountPrice: 908.74,
        },
        {
          date: '2019-08-23',
          discountPrice: 930.55,
        },
        {
          date: '2019-08-24',
          discountPrice: 978.53,
        },
        {
          date: '2019-08-25',
          discountPrice: 931.47,
        },
        {
          date: '2019-08-26',
          discountPrice: 891,
        },
        {
          date: '2019-08-27',
          discountPrice: 836.41,
        },
      ],
      encode: {
        x: 'date',
        y: 'discountPrice',
      },
      type: 'line',
      key: '0-0',
    },
    {
      style: {
        stroke: '#ffa45c',
        lineWidth: 1,
      },
      tooltip: {
        title: '',
        items: [
          {
            name: 'baseline',
            channel: 'y',
          },
        ],
      },
      type: 'line',
      data: [
        ['2019-08-12', 813.1986098231948],
        ['2019-08-13', 823.1190264225548],
        ['2019-08-14', 832.8341808698422],
        ['2019-08-15', 842.7607694087598],
        ['2019-08-16', 853.2501986376163],
        ['2019-08-17', 863.8170969240749],
        ['2019-08-18', 874.6156613441703],
        ['2019-08-19', 883.7838645419531],
        ['2019-08-20', 893.9900171430626],
        ['2019-08-21', 906.5749342676551],
        ['2019-08-22', 918.0016062325483],
        ['2019-08-23', 916.0148272896506],
        ['2019-08-24', 911.6068918597696],
        ['2019-08-25', 906.0625598784213],
        ['2019-08-26', 899.3923860434285],
        ['2019-08-27', 891.3209163060191],
      ],
      encode: { x: (d) => d[0], y: (d) => d[1] },
      key: '0-1',
    },
    {
      style: {
        fillOpacity: 0.3,
        fill: '#ffd8b8',
      },
      type: 'area',
      data: [
        ['2019-08-12', [722.6189603630733, 910.2044041824067]],
        ['2019-08-13', [732.5393769624333, 920.1248207817667]],
        ['2019-08-14', [742.2545314097206, 929.8399752290541]],
        ['2019-08-15', [752.1811199486382, 939.7665637679717]],
        ['2019-08-16', [762.6705491774948, 950.2559929968282]],
        ['2019-08-17', [773.2374474639533, 960.8228912832868]],
        ['2019-08-18', [784.0360118840488, 971.6214557033823]],
        ['2019-08-19', [793.2042150818315, 980.789658901165]],
        ['2019-08-20', [803.410367682941, 990.9958115022745]],
        ['2019-08-21', [815.9952848075335, 1003.580728626867]],
        ['2019-08-22', [827.4219567724267, 1015.0074005917602]],
        ['2019-08-23', [825.435177829529, 1013.0206216488625]],
        ['2019-08-24', [821.027242399648, 1008.6126862189815]],
        ['2019-08-25', [815.4829104182998, 1003.0683542376332]],
        ['2019-08-26', [808.8127365833069, 996.3981804026404]],
        ['2019-08-27', [800.7412668458975, 988.326710665231]],
      ],
      encode: { x: (d) => d[0], y: (d) => [d[1][0], d[1][1]] },
      key: '0-2',
    },
    {
      type: 'point',
      data: [['2019-08-20', 1018.85]],
      encode: { x: (d) => d[0], y: (d) => d[1] },
      style: {
        fill: '#f4664a',
        stroke: '#f4664a',
      },
      tooltip: {
        title: '',
        items: [
          {
            name: 'outlier',
            channel: 'y',
          },
        ],
      },
      key: '0-3',
    },
  ],
};

export const customNarrativeSpec = [
  {
    type: 'normal',
    phrases: [
      {
        type: 'entity',
        value: 'pop',
        metadata: {
          entityType: 'metric_name',
        },
      },
      {
        type: 'text',
        value: ' has ',
      },
      {
        type: 'entity',
        value: '2',
        metadata: {
          entityType: 'metric_value',
          origin: 2,
        },
      },
      {
        type: 'text',
        value: ' categories in the ',
      },
      {
        type: 'text',
        value: 'country',
      },
      {
        type: 'text',
        value: ' that are prominent compared to other dimensions: ',
      },
      {
        type: 'entity',
        value: 'China',
        metadata: {
          entityType: 'dim_value',
        },
      },
      {
        type: 'text',
        value: ',',
      },
      {
        type: 'entity',
        value: 'India',
        metadata: {
          entityType: 'dim_value',
        },
      },
      {
        type: 'text',
        value: '.',
      },
    ],
  },
];

export const customChartSpecs = [timeSeriesChartSpec];

export const customInsightCardContentSpec = {
  sections: [
    {
      paragraphs: [
        ...customNarrativeSpec,
        {
          type: 'custom',
          customType: 'charts',
          chartSpecs: customChartSpecs,
        },
      ],
    },
  ],
};
