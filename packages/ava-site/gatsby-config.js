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
        slug: 'docs/tutorial',
        title: {
          zh: '教程',
          en: 'Tutorial',
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
    docs: [],
    showSearch: true, // 是否展示搜索框
    showChinaMirror: true, // 是否展示国内镜像链接
    showAntVProductsCard: true, // 是否展示 AntV 系列产品的卡片链接
    showLanguageSwitcher: true, // 用于定义是否展示语言切换
    showGithubCorner: true, // 是否展示角落的 GitHub 图标
    showAPIDoc: true, // 是否在demo页展示API文档
    // docsearchOptions: {
    //   apiKey: '', // TODO algolia doc search key
    //   indexName: 'antv_ava',
    // },
    redirects: [],
  },
};
