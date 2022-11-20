import { defineConfig } from 'dumi';
import { repository, homepage } from './package.json';

export default defineConfig({
  locales: [{ id: 'zh', name: '中文' }, { id: 'en', name: 'English' }],
  themeConfig: {
    title: 'AVA',
    description: 'A framework and solution for more convenient visual analytics.',
    defaultLanguage: 'zh',
    siteUrl: homepage,
    isAntVSite: false,
    githubUrl: repository.url,
    // 是否显示搜索框
    showSearch: true,
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
    showAPIDoc: true,
    // 添加国内镜像链接
    internalSite: {
        url: 'https://ava.antv.antgroup.com',
        name: {
          zh: '国内镜像',
          en: 'China Mirror',
        },
    },
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
                zh: '图表知识库(CKB)',
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
            slug: 'guide/advisor',
            title: {
                zh: 'Advisor',
                en: 'Advisor',
            },
            order: 4,
        },
        {
            slug: 'guide/rules',
            title: {
                zh: '推荐规则',
                en: 'Rules',
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
            slug: 'guide/ntv',
            title: {
                zh: '解读文本可视化（NTV）',
                en: 'Narrative Text Vis (NTV)',
            },
            order: 9,
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
                zh: '图表知识库(CKB)',
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
            slug: 'api/advisor',
            title: {
                zh: 'Advisor',
                en: 'Advisor',
            },
            order: 4,
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
        {
            slug: 'api/types',
            title: {
                zh: '类型 Types',
                en: 'Types',
            },
            order: 9,
        },
        {
          slug: 'api/ntv',
          title: {
              zh: 'NarrativeTextVis(NTV)',
              en: 'NarrativeTextVis(NTV)',
          },
          order: 10,
        },
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
            includes: [],
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
            slug: 'advisor',
            title: {
                zh: '图表推荐（Advisor）',
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
            slug: 'plugins',
            title: {
                zh: '插件',
                en: 'Plugins',
            },
            order: 5,
        },
            {
            slug: 'others',
            title: {
                zh: '其他',
                en: 'Others',
            },
            order: 6,
        },
        {
          slug: 'ntv',
          title: {
              zh: '解读文本可视化（NTV）',
              en: 'Narrative Text Vis (NTV)',
          },
          order: 10,
        },
    ],
    // 编辑器配置
    playground: {
        container: '<div id="container" />',
        devDependencies: {
            typescript: 'latest',
        },
    },
    docsearchOptions: {
        apiKey: '2af93b002b40c8e1ef51fd6577c888d1',
        indexName: 'antv_ava',
    },
    redirects: [],
    companies: [
        { name: '阿里云', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*V_xMRIvw2iwAAAAAAAAAAABkARQnAQ' },
        { name: '支付宝', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*lYDrRZvcvD4AAAAAAAAAAABkARQnAQ' },
        { name: '天猫', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*BQrxRK6oemMAAAAAAAAAAABkARQnAQ' },
        { name: '淘宝网', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*1l8-TqUr7UcAAAAAAAAAAABkARQnAQ' },
        { name: '网上银行', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*ZAKFQJ5Bz4MAAAAAAAAAAABkARQnAQ' },
        { name: '京东', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*yh-HRr3hCpgAAAAAAAAAAABkARQnAQ' },
        { name: 'yunos', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*_js7SaNosUwAAAAAAAAAAABkARQnAQ' },
        { name: '菜鸟', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*TgV-RZDODJIAAAAAAAAAAABkARQnAQ' },
    ],
    cases: [
        {
            logo: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*-dLnTIexOxwAAAAAAAAAAABkARQnAQ',
            title: {
                zh: '智能可视化',
                en: 'AVA',
            },
            description: {
                zh: '链接人和数据，联通数据分析链条上的“最后一公里”',
                en: 'Link people and data, connect the last kilometer of the data analysis chain'
            },
            image: 'https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*gM2JRbkGETIAAAAAAAAAAAAAARQnAQ',
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
          en: 'AVA is a framework for more convenient Visual Analytics. The first A of AVA has many meanings. It states that the goal of this framework is to become an Automated, AI driven solution that supports Augmented analytics.'
        },
        image: 'https://gw.alipayobjects.com/zos/bmw-prod/e11f026f-325b-4e71-8613-8297febcfdd0.svg',
        buttons: [
          {
            text: {
              zh: '图表示例',
              en: 'Examples',
            },
            link: `/examples`,
            type: 'primary',
          },
          {
            text: {
              zh: '开始使用',
              en: 'Getting Started',
            },
            link: `/guide/intro`,
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
                zh: '利业·立业 - AntV 与业务的故事',
                en: 'How AntV Supports Business',
            },
            date: '2020.11.22',
            link: 'https://www.yuque.com/antv/blog/2020story',
        },
        {
            type: {
                zh: '推荐',
                en: 'Recommend',
            },
            title: {
                zh: 'AVA 1.0 你的图表参谋',
                en: 'AVA 1.0 Your Chart Secretary',
            },
            date: '2020.11.22',
            link: 'https://www.yuque.com/antv/blog/2020ava',
        },
    ],
  },
  mfsu: false,
  alias: {
    // 根据自己项目结构书写绝对路径
    '@': __dirname
  },
  links: [
  ],
  scripts: [
  ],
});
