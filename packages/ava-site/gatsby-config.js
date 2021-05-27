module.exports = {
  plugins: [
    {
      resolve: '@antv/gatsby-theme-antv',
      options: {
        GATrackingId: `UA-148148901-12`,
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
        slug: 'guide/ckb',
        title: {
          zh: '图表知识库（CKB)',
          en: 'Chart Knowledge Base (CKB)',
        },
        order: 2,
      },
      {
        slug: 'guide/datawizard',
        title: {
          zh: 'DataWizard',
          en: 'DataWizard',
        },
        order: 3,
      },
      {
        slug: 'guide/chart-advisor',
        title: {
          zh: 'Chart Advisor',
          en: 'Chart Advisor',
        },
        order: 4,
      },
      {
        slug: 'guide/chart-linter',
        title: {
          zh: 'Chart Linter',
          en: 'Chart Linter',
        },
        order: 5,
      },
      {
        slug: 'api/ckb',
        title: {
          zh: '图表知识库（CKB)',
          en: 'Chart Knowledge Base (CKB)',
        },
        order: 1,
      },
      {
        slug: 'api/datawizard',
        title: {
          zh: 'DataWizard',
          en: 'DataWizard',
        },
        order: 2,
      },
      {
        slug: 'api/datawizard/dw-analyzer',
        title: {
          zh: '包：dw-analyzer',
          en: 'Package: dw-analyzer',
        },
        order: 1,
      },
      {
        slug: 'api/chart-advisor',
        title: {
          zh: 'Chart Advisor',
          en: 'Chart Advisor',
        },
        order: 3,
      },
      {
        slug: 'api/chart-advisor/pipeline',
        title: {
          zh: 'pipeline',
          en: 'pipeline',
        },
        order: 1,
      },
      {
        slug: 'api/chart-linter',
        title: {
          zh: 'Chart Linter',
          en: 'Chart Linter',
        },
        order: 4,
      },
    ],
    examples: [
      {
        slug: 'ckb',
        // icon: 'gallery',
        title: {
          zh: '图表知识库（CKB)',
          en: 'Chart Knowledge Base (CKB)',
        },
      },
      {
        slug: 'chart-advisor',
        // icon: 'gallery',
        title: {
          zh: '图表推荐库',
          en: 'Chart Advisor',
        },
      },
      {
        slug: 'chart-linter',
        // icon: 'gallery',
        title: {
          zh: '图表优化',
          en: 'Chart Linter',
        },
      },
      {
        slug: 'others',
        // icon: 'gallery',
        title: {
          zh: '其他',
          en: 'Others',
        },
      },
    ],
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
