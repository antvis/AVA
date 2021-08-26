import React from 'react';
import SEO from '@antv/gatsby-theme-antv/site/components/Seo';
import { useTranslation } from 'react-i18next';
import Banner from '@antv/gatsby-theme-antv/site/components/Banner';
import Cases from '@antv/gatsby-theme-antv/site/components/Cases';
import Companies from '@antv/gatsby-theme-antv/site/components/Companies';
import '../css/index.less';
import '../css/home.css';

const IndexPage = () => {
  const { t, i18n } = useTranslation();

  const bannerButtons = [
    {
      text: t('图表示例'),
      link: `/${i18n.language}/examples/gallery`,
      type: 'primary',
    },
    {
      text: t('开始使用'),
      link: `/${i18n.language}/docs/guide`,
    },
  ];
  const cases = [
    {
      logo: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*-dLnTIexOxwAAAAAAAAAAABkARQnAQ',
      title: t('智能可视化'),
      description: t(`链接人和数据，联通数据分析链条上的“最后一公里”`),
      image: t('https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*gM2JRbkGETIAAAAAAAAAAAAAARQnAQ'),
    },
  ];
  const companies = [
    { name: '阿里云', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*V_xMRIvw2iwAAAAAAAAAAABkARQnAQ' },
    { name: '支付宝', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*lYDrRZvcvD4AAAAAAAAAAABkARQnAQ' },
    { name: '天猫', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*BQrxRK6oemMAAAAAAAAAAABkARQnAQ' },
    { name: '淘宝网', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*1l8-TqUr7UcAAAAAAAAAAABkARQnAQ' },
    { name: '网上银行', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*ZAKFQJ5Bz4MAAAAAAAAAAABkARQnAQ' },
    { name: '京东', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*yh-HRr3hCpgAAAAAAAAAAABkARQnAQ' },
    { name: 'yunos', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*_js7SaNosUwAAAAAAAAAAABkARQnAQ' },
    { name: '菜鸟', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*TgV-RZDODJIAAAAAAAAAAABkARQnAQ' },
  ];
  const coverImage = (
    <img
      width="100%"
      className="Notification-module--number--31-3Z"
      src="https://gw.alipayobjects.com/zos/bmw-prod/e11f026f-325b-4e71-8613-8297febcfdd0.svg"
      alt="cover"
    />
  );
  const notifications = [
    {
      type: t('News'),
      title: t('利业·立业 - AntV 与业务的故事'),
      date: '2020.11.22',
      link: 'https://www.yuque.com/antv/blog/2020story',
    },
    {
      type: t('News'),
      title: t('AVA 1.0 你的图表参谋'),
      date: '2020.11.22',
      link: 'https://www.yuque.com/antv/blog/2020ava',
    },
  ];

  return (
    <>
      <SEO title={t('蚂蚁数据可视化')} lang={i18n.language} />
      <Banner
        coverImage={coverImage}
        title={t('AVA')}
        description={t(
          'AVA 是为了更简便的可视分析而生的技术框架。 VA 代表可视分析（Visual Analytics），而第一个 A 具有多重涵义：其目标是成为一个自动化（Automated）、智能驱动（AI driven）、支持增强分析（Augmented）的可视分析解决方案。'
        )}
        className="banner"
        buttons={bannerButtons}
        showGithubStars={true}
        video="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/file/A*PDpiR4U2oFEAAAAAAAAAAABkARQnAQ"
        notifications={notifications}
      />
      <Cases cases={cases} />
      <Companies title={t('感谢信赖')} companies={companies} />
    </>
  );
};

export default IndexPage;
