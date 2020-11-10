import React from 'react';
import SEO from '@antv/gatsby-theme-antv/site/components/Seo';
import { useTranslation } from 'react-i18next';
import Banner from '@antv/gatsby-theme-antv/site/components/Banner';
import BannerSVG from '@antv/gatsby-theme-antv/site/components/BannerSVG';

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
      link: `/${i18n.language}/docs/tutorial`,
    },
  ];

  // const coverImage = <img width='100%' src='https://gw.alipayobjects.com/mdn/antv_site/afts/img/A*o40BRo-ANLoAAAAAAAAAAABkARQnAQ' alt='cover' />
  return (
    <>
      <SEO title={t('蚂蚁数据可视化')} lang={i18n.language} />
      <Banner
        // coverImage={coverImage}
        coverImage={<BannerSVG />}
        title={t('让数据栩栩如生')}
        description={t(
          'AntV 是蚂蚁金服全新一代数据可视化解决方案，致力于提供一套简单方便、专业可靠、无限可能的数据可视化最佳实践。'
        )}
        className="banner"
        buttons={bannerButtons}
        showGithubStars={false}
        video="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/file/A*PDpiR4U2oFEAAAAAAAAAAABkARQnAQ"
      />
    </>
  );
};

export default IndexPage;
