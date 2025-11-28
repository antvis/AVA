import { defineConfig } from 'dumi';
import path from 'path';

export default defineConfig({
  locales: [
    { id: 'zh', name: '中文' },
    { id: 'en', name: 'English' },
  ],
  headScripts: [
    { src: 'https://gw.alipayobjects.com/os/lib/axios/1.12.2/dist/axios.min.js', async: false }
  ],
  themeConfig: {
    title: 'AVA',
    description: 'A framework and solution for more convenient visual analytics.',
    defaultLanguage: 'zh',
    siteUrl: 'https://antv.antgroup.com/',
    isAntVSite: false,
    githubUrl: 'https://github.com/antvis/AVA',
    // disable feedback feature to avoid runtime hooks that expect repo info
    feedback: false,
    footerTheme: 'light', // 白色 底部主题
    // 是否显示搜索框
    showSearch: false,
    // 是否显示头部的 GitHub icon
    showGithubCorner: true,
    // 是否显示 GitHub star 数量
    showGithubStars: true,
    // 是否显示 AntV 产品汇总的卡片
    showAntVProductsCard: true,
    // 是否显示官网语言切换
    showLanguageSwitcher: true,
    // 是否显示头部菜单的微信公众号
    showWxQrcode: true,
    // 是否在 demo 页展示图表视图切换
    showChartResize: true,
    // 是否在 demo 页展示API文档
    showAPIDoc: false,
    // 是否展示国内镜像链接
    showChinaMirror: false,
    // `metas` is expected by the theme Index component
    ai: {
      recommend: 'https://assets.antv.antgroup.com/ava/recommend.json', // 写生产地址，因为预发地址仅内网访问
      codeRunner: 'codeRunner',
    },
    metas: {
      title: {
        zh: 'AVA 可视分析框架',
        en: 'AVA Visual Analytics Framework',
      },
      description: {
        zh: 'AVA 是为了更简便的可视分析而生的技术框架。 VA 代表可视分析（Visual Analytics），而第一个 A 具有多重涵义：其目标是成为一个自动化（Automated）、智能驱动（AI driven）、支持增强分析（Augmented）的可视分析解决方案。',
        en: 'AVA is a technical framework born for more convenient visual analytics. VA stands for Visual Analytics, and the first A has multiple meanings: its goal is to become an Automated, AI-driven, and Augmented visual analytics solution.',
      },
    },
    companies: [],
    features: [],
    cases: [],
    // ensure playground config exists so CodeEditor destructuring won't fail
    playground: {
      container: "<div id='container' class='playgroundCodeContainer' />",
      devDependencies: {
        typescript: 'latest',
      },
    },
    navs: [
      {
        slug: 'docs/guide',
        title: {
          zh: '教程',
          en: 'Guide',
        },
      },
      {
        slug: 'docs/api',
        title: {
          zh: 'API 文档',
          en: 'API',
        },
      },
      {
        slug: 'examples',
        title: {
          zh: '图表示例',
          en: 'Examples',
        },
      },
    ],
    docs: [
      {
        slug: 'guide',
        title: {
          zh: '教程',
          en: 'Guide',
        },
      },
      {
        slug: 'guide/scene',
        title: {
          zh: '场景案例',
          en: 'Scene Cases',
        },
        order: 3,
      },
      {
        slug: 'api/antv-spec',
        title: {
          zh: '图表知识库(Antv Spec)',
          en: 'Chart Knowledge Base',
        },
        order: 3,
      },
      {
        slug: 'api/render',
        title: {
          zh: '图表渲染(render)',
          en: 'Chart Rendering',
        },
        order: 4,
      },
      {
        slug: 'api/insight',
        title: {
          zh: '自动洞察(insight)',
          en: 'Insight',
        },
        order: 5,
      }
    ],
    examples: [
      {
        slug: 'extract',
        icon: 'facet',
        title: {
          zh: '数据抽取(extract)',
          en: 'Data Extraction',
        },
        order: 1,
      },
      {
        slug: 'advisor',
        icon: 'star-single-line',
        title: {
          zh: '图表推荐(advise)',
          en: 'Chart Recommendation',
        },
        order: 2,
      },
      {
        slug: 'render',
        icon: 'block',
        title: {
          zh: '图表渲染(render)',
          en: 'Chart Rendering',
        },
        order: 3,
      },
      {
        slug: 'insight',
        icon: 'block',
        title: {
          zh: '自动洞察(insight)',
          en: 'Insight',
        },
        order: 4,
      }
    ],
    /** 首页技术栈介绍 */
    detail: {
      title: {
        zh: 'AVA',
        en: 'AVA',
      },
      description: {
        zh: 'AVA 是为了更简便的可视分析而生的技术框架。 VA 代表可视分析（Visual Analytics），而第一个 A 具有多重涵义：其目标是成为一个自动化（Automated）、智能驱动（AI driven）、支持增强分析（Augmented）的可视分析解决方案。',
        en: 'AVA is a framework for more convenient Visual Analytics. The first A of AVA has many meanings. It states that the goal of this framework is to become an Automated, AI driven solution that supports Augmented analytics.',
      },
      image: 'https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yvxBT42GPRIAAAAAAAAAAAAADmJ7AQ/original',
      imageStyle: {
        marginLeft: '70px',
        marginTop: '100px',
      },
      buttons: [
        {
          text: {
            zh: '开始使用',
            en: 'Getting Started',
          },
          link: `/guide/index`,
        },
        {
          text: {
            zh: '图表示例',
            en: 'Examples',
          },
          link: `/examples`,
          type: 'primary',
        },
      ],
    },
    news: [
      {
        type: {
          zh: '推荐',
          en: 'Recommend',
        },
        title: {
          zh: '远方·远芳 AntV 2022 年度发布',
          en: 'AntV Anniversary 2022',
        },
        date: '2022.11.22',
        link: 'https://www.yuque.com/antv/blog/1122_6',
      },
      {
        type: {
          zh: '推荐',
          en: 'Recommend',
        },
        title: {
          zh: 'AVA：见字如晤，展信舒颜',
          en: 'AVA 3.0 Pre-Publish',
        },
        date: '2022.11.22',
        link: 'https://www.yuque.com/antv/blog/ava2022',
      },
    ],
  },
  chainWebpack(memo: any) {
    try {
      // remove critters plugin added by @antv/dumi-theme-antv to avoid
      // "Could not find HTML asset" errors in some envs
      memo.plugins.delete('critters');
    } catch (e) {
      // ignore
    }
    return memo;
  },
  define: { 'process.env.TEST_TOKEN': process.env.TEST_TOKEN },
  alias: {
    '@antv/ava': path.resolve(__dirname, '../src'),
  },
  externals: {
    'axios': 'axios',
  },
});
