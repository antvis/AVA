import { Advisor } from '@antv/chart-advisor';
// import { specToG6Config, specToG6Plot } from '@antv/antv-spec';

// Prepare hierachical data: some entities have a parent-child relationship with each other
const KnowledgeTreeData = {
  id: '200000004',
  tooltip: 'Thing',
  label: '事物',
  description: null,
  descriptionZh: null,
  depth: 3,
  subTypeCount: 9,
  status: 0,
  children: [
    {
      id: '500000061',
      tooltip: 'Person',
      label: '自然人',
      description: null,
      descriptionZh: null,
      depth: 1,
      subTypeCount: 1,
      status: 0,
      children: [
        {
          id: '707000085',
          tooltip: 'FilmPerson',
          label: '电影人',
          description: null,
          descriptionZh: null,
          depth: 5,
          subTypeCount: 3,
          status: 1,
          children: [
            {
              id: '707000090',
              tooltip: 'FilmDirector',
              label: '电影导演',
              description: null,
              descriptionZh: null,
              depth: 0,
              subTypeCount: 0,
              status: 1,
              children: [],
            },
            {
              id: '707000091',
              tooltip: 'FilmWriter',
              label: '电影编剧',
              description: null,
              descriptionZh: null,
              depth: 4,
              subTypeCount: 0,
              status: 1,
              children: [],
            },
            {
              id: '707000092',
              tooltip: 'FilmStar',
              label: '电影主演',
              description: null,
              descriptionZh: null,
              depth: 4,
              subTypeCount: 0,
              status: 1,
              children: [],
            },
          ],
        },
        {
          id: '707000086',
          tooltip: 'MusicPerson',
          label: '音乐人',
          description: null,
          descriptionZh: null,
          depth: 17,
          subTypeCount: 2,
          status: 1,
          children: [],
        },
      ],
    },
    {
      id: '200000005',
      tooltip: 'Music',
      label: '音乐',
      description: null,
      descriptionZh: null,
      depth: 3,
      subTypeCount: 2,
      status: 1,
      children: [],
    },
    {
      id: '707000128',
      tooltip: 'Film',
      label: '电影',
      description: null,
      descriptionZh: null,
      depth: 4,
      subTypeCount: 0,
      status: 1,
      children: [
        {
          id: '7070032328',
          tooltip: 'Comedy',
          label: '喜剧',
          description: null,
          descriptionZh: null,
          depth: 4,
          operation: 'C',
          subTypeCount: 0,
          status: 1,
          children: [],
        },
      ],
    },
    {
      id: '707000095',
      tooltip: 'FilmGenre',
      label: '电影类别',
      description: null,
      descriptionZh: null,
      depth: 4,
      subTypeCount: 0,
      status: 1,
      children: [],
    },
    {
      id: '702000021',
      tooltip: 'Organization',
      label: '机构',
      description: null,
      descriptionZh: null,
      depth: 47,
      subTypeCount: 1,
      status: 0,
      children: [
        {
          id: '500000063',
          tooltip: 'Company',
          label: '公司',
          description: null,
          descriptionZh: null,
          depth: 4,
          subTypeCount: 2,
          status: 1,
          children: [
            {
              id: '707000093',
              tooltip: 'FilmCompany',
              label: '电影公司',
              description: null,
              descriptionZh: null,
              depth: 4,
              subTypeCount: 0,
              status: 1,
              children: [],
            },
            {
              id: '707000094',
              tooltip: 'MusicCompany',
              label: '音乐公司',
              description: null,
              descriptionZh: null,
              depth: 2,
              subTypeCount: 0,
              status: 1,
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

// Initialize an advisor and pass the data to its advise function
const myAdvisor = new Advisor();
const advices = myAdvisor.advise({ data: KnowledgeTreeData });

// The advices are returns in order from largest score to smallest score, you can choose the best advice to generate visualization
const bestAdvice = advices[0];
if (bestAdvice) {
  const { type, score, spec } = bestAdvice;
  const container = document.getElementById('container');
  console.log(`${type}: ${score}`);
  window.g6Utils.specToG6Plot(spec, container);
}
