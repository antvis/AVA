module.exports = {
  plugins: [
    {
      resolve: '@antv/gatsby-theme-antv',
      options: {
        GATrackingId: 'UA-148148901-12',
      },
    },
  ],
  siteMetadata: {
    title: 'AVA',
    description: 'chart advisor...',
    siteUrl: 'https://ava.antv.vision',
    githubUrl: 'https://github.com/antvis/ava',
    navs: [
      {
        slug: 'docs/guide',
        title: {
          zh: '教程',
          en: 'Guide',
        },
        order: 0,
      },
      {
        slug: 'docs/api',
        title: {
          zh: 'API 文档',
          en: 'API',
        },
        order: 1,
      },
      {
        slug: 'examples',
        title: {
          zh: '图表示例',
          en: 'Examples',
        },
        order: 2,
      },
    ],
    docs: [
      {
        slug: 'guide/auto-chart',
        title: {
          zh: 'AutoChart 组件',
          en: 'AutoChart Component',
        },
        order: 1,
      },
      {
        slug: 'guide/ckb',
        title: {
          zh: '图表知识库（CKB)',
          en: 'Chart Knowledge Base (CKB)',
        },
        order: 2,
      },
      {
        slug: 'guide/data-wizard',
        title: {
          zh: 'DataWizard',
          en: 'DataWizard',
        },
        order: 3,
      },
      {
        slug: 'guide/chart-advisor',
        title: {
          zh: 'ChartAdvisor',
          en: 'ChartAdvisor',
        },
        order: 4,
      },
      {
        slug: 'guide/chart-linter',
        title: {
          zh: 'ChartLinter',
          en: 'ChartLinter',
        },
        order: 5,
      },
      {
        slug: 'guide/lite-insight',
        title: {
          zh: 'LiteInsight',
          en: 'LiteInsight',
        },
        order: 6,
      },
      {
        slug: 'guide/smart-board',
        title: {
          zh: 'SmartBoard',
          en: 'SmartBoard',
        },
        order: 7,
      },
      {
        slug: 'guide/smart-color',
        title: {
          zh: 'SmartColor',
          en: 'SmartColor',
        },
        order: 8,
      },
      {
        slug: 'api/auto-chart',
        title: {
          zh: 'AutoChart',
          en: 'AutoChart',
        },
        order: 1,
      },
      {
        slug: 'api/ckb',
        title: {
          zh: '图表知识库（CKB)',
          en: 'Chart Knowledge Base (CKB)',
        },
        order: 2,
      },
      {
        slug: 'api/data-wizard',
        title: {
          zh: 'DataWizard',
          en: 'DataWizard',
        },
        order: 3,
      },
      {
        slug: 'api/chart-advisor',
        title: {
          zh: 'ChartAdvisor',
          en: 'ChartAdvisor',
        },
        order: 4,
      },
      {
        slug: 'api/chart-linter',
        title: {
          zh: 'ChartLinter',
          en: 'ChartLinter',
        },
        order: 5,
      },
      {
        slug: 'api/lite-insight',
        title: {
          zh: 'LiteInsight',
          en: 'LiteInsight',
        },
        order: 6,
      },
      {
        slug: 'api/smart-board',
        title: {
          zh: 'SmartBoard',
          en: 'SmartBoard',
        },
        order: 7,
      },
      {
        slug: 'api/smart-color',
        title: {
          zh: 'SmartColor',
          en: 'SmartColor',
        },
        order: 8,
      },
      // {
      //   slug: 'api/chart-advisor/pipeline',
      //   title: {
      //     zh: 'pipeline',
      //     en: 'pipeline',
      //   },
      //   order: 1,
      // },
    ],
    examples: [
      {
        slug: 'components',
        title: {
          zh: 'React 组件',
          en: 'React Components',
        },
        order: 0,
      },
      {
        slug: 'data-wizard',
        title: {
          zh: '数据处理（DataWizard）',
          en: 'DataWizard',
        },
        order: 1,
      },
      {
        slug: 'ckb',
        title: {
          zh: '图表知识库（CKB)',
          en: 'Chart Knowledge Base (CKB)',
        },
        order: 2,
      },
      {
        slug: 'chart-advisor',
        title: {
          zh: '图表推荐（ChartAdvisor）',
          en: 'ChartAdvisor',
        },
        order: 3,
      },
      {
        slug: 'lite-insight',
        title: {
          zh: '智能洞察（LiteInsight）',
          en: 'LiteInsight',
        },
        order: 4,
      },
      {
        slug: 'smart-board',
        title: {
          zh: '增强展现（SmartBoard）',
          en: 'SmartBoard',
        },
        order: 5,
      },
      {
        slug: 'plugins',
        title: {
          zh: '插件',
          en: 'Plugins',
        },
        order: 6,
      },
      {
        slug: 'others',
        title: {
          zh: '其他',
          en: 'Others',
        },
        order: 7,
      },
    ],
    // 编辑器配置
    playground: {
      container: '<div id="container" />',
      devDependencies: {
        typescript: 'latest',
      },
    },
    showSearch: true, // 是否展示搜索框
    showChinaMirror: true, // 是否展示国内镜像链接
    showAntVProductsCard: true, // 是否展示 AntV 系列产品的卡片链接
    showLanguageSwitcher: true, // 用于定义是否展示语言切换
    showGithubCorner: true, // 是否展示角落的 GitHub 图标
    showAPIDoc: true, // 是否在demo页展示API文档
    docsearchOptions: {
      apiKey: '2af93b002b40c8e1ef51fd6577c888d1',
      indexName: 'antv_ava',
    },
    redirects: [],
  },
};
