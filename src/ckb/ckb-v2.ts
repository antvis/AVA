import { CHART_NAME, CHART_PURPOSE, FULL_AND_ABBR_CHART_NAME_MAP } from '../constants';
import { StatisticsFeatureKey, ChartLibrary, Operator } from '../types';

const LINE_MAX_SPLIT_COUNT = 40;
const BAR_MAX_SPLIT_COUNT = 100;
const PIE_MAX_SPLIT_COUNT = 50;
const FUNNEL_CHART_MAX_SPLIT_COUNT = 10;
const RADAR_CHART_MAX_SPLIT_COUNT = 10;
const SPREAD_SHEET_PRO_SPLIT_COUNT = 100;

export const VISUAL_CHANNEL_DESCRIPTION = {
  x: 'x轴 - 横向坐标轴，通常用于展示分类变量、时间序列或连续型变量',
  y: 'y轴 - 纵向坐标轴，通常用于展示数值型变量，表示数据的大小或数量',
  y2: '右y轴 - 右侧纵向坐标轴，用于映射第二组数值型变量，支持不同量级数据的对比展示',
  s: '分组 - 用于数据分组，将数据按类别进行拆分展示，支持多系列对比',
  color: '颜色 - 通过不同颜色区分数据类别，增强数据的可识别性和对比性',
  size: '大小 - 通过图形大小差异表示数值大小，常用于散点图中表示第三个维度',
  x2: '列头 - 交叉表中的列维度，用于数据的列向分组和聚合',
  source: '源节点 - 表示关系数据中的起始实体或来源位置',
  target: '目标节点 - 表示关系数据中的目标实体或终点位置',
  value: '数值 - 表示数据的数值大小，用于确定视觉元素的大小、宽度或强度',
  row: '行 - 表格中的行数据，用于展示原始数据记录',
};

export const CKB: ChartLibrary = {
  [CHART_NAME.line]: {
    chartName: '折线图',
    type: CHART_NAME.line,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.line],
    alias: '线图',
    category: [CHART_PURPOSE.Trend, CHART_PURPOSE.Comparison],
    chartFunction: '趋势分析、数据变化',
    def: '折线图常用来表示数值随连续时间间隔的变化，用于分析事物随时间而变化的趋势，从数据上，折线图需要一个连续时间字段。',
    useCase: ['适用于时间序列数据，例如股票价格变化、温度变化等。'],
    nonUseCase: [
      '当多个数值字段的中位数数量级差异显著，导致较小数值的趋势在单一坐标轴下难以辨识时，建议优先采用双轴图以独立展示不同量级的数据',
      '变量数值大多情况下为 0',
      '离散型分类数据对比的场景',
    ],
    fields: {
      x: { min: 1, max: 1, dataType: ['date'], desc: 'x轴', optional: false },
      y: { min: 1, max: 8, dataType: ['number'], desc: 'y轴', optional: false },
      s: {
        min: 0,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '分组',
        optional: true,
      },
    },
    limits: {
      [StatisticsFeatureKey.distinct]: {
        number: LINE_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['s'],
          measure: ['y'],
        },
        reason: `维值拆分数量超出${LINE_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  [CHART_NAME.column]: {
    chartName: '柱形图',
    type: CHART_NAME.column,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.column],
    alias: '柱状图',
    category: [CHART_PURPOSE.Comparison, CHART_PURPOSE.Distribution],
    chartFunction: '分类对比、数量比较',
    def: '柱状图，是一种使用柱形条，对不同类别进行数值比较的统计图表。最基础的柱形图，需要一个分类变量和一个数值变量。在柱状图上，分类变量的每个实体都被表示为一个矩形（通俗讲即为“柱子”），而数值则决定了柱子的高度。',
    useCase: ['分类数据对比（如不同产品销量）、时间周期对比（如月度销售额）、多组数据并列比较、构成分析（堆叠柱形图）'],
    nonUseCase: ['柱状图要求至少一个分类变量，它们之间是离散的，不能是连续型变量（连续时间趋势分析建议用折线图）'],
    fields: {
      x: {
        min: 1,
        max: 1,
        dataType: ['string', 'date', 'geo'],
        desc: 'x轴',
        optional: false,
      },
      y: { min: 1, max: 8, dataType: ['number'], desc: 'y轴', optional: false },
      s: {
        min: 0,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '分组',
        optional: true,
      },
    },
    limits: {
      [StatisticsFeatureKey.distinct]: {
        number: BAR_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x', 's'],
          measure: ['y'],
        },
        reason: `维值拆分数量超出${BAR_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  [CHART_NAME.pie]: {
    chartName: '饼图',
    type: CHART_NAME.pie,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.pie],
    alias: '圆形图、占比图',
    category: [CHART_PURPOSE.Comparison, CHART_PURPOSE.Proportion],
    chartFunction: '占比分析、构成展示',
    def: '饼图，是一个划分为几个扇形的圆形统计图表。饼图最显著的功能在于表现“占比”。从数据来看，饼图一般需要一个分类数据字段、一个连续数据字段。值得注意的是，分类字段的数据，在图表使用的语境下，应当构成一个整体（例如一班、二班、三班，构成了整个高一年级），而不能是独立、无关的。',
    useCase: ['用于显示组成部分的比例，如市场份额、预算分配等。想要突出表示某个部分在整体中所占比例。'],
    nonUseCase: [
      '如果变量之间相互独立，并不构成一个整体，那么不可以使用饼图。饼图也不能用来表现趋势。此外，当类别过多时，不建议使用饼图，否则阅读会将很差。可行的办法，一是将一些不重要的变量合并为“其他”，避免扇区超过 5 个；二是改用条形图。',
    ],
    fields: {
      s: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '切片',
        optional: false,
      },
      value: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '数值',
        optional: false,
      },
    },
    limits: {
      [StatisticsFeatureKey.distinct]: {
        number: PIE_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x'],
        },
        reason: `切片数量超出${PIE_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  [CHART_NAME.bar]: {
    chartName: '条形图',
    type: CHART_NAME.bar,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.bar],
    alias: '横向柱状图',
    category: [CHART_PURPOSE.Comparison, CHART_PURPOSE.Distribution],
    chartFunction: '分类对比、数量比较',
    def: '条形图是一种使用水平矩形条对不同类别进行数值比较的统计图表。与柱状图不同的是，条形图的矩形条是从左到右排列的，而不是从下到上。条形图同样需要一个分类变量和一个数值变量。',
    useCase: [
      '条形图适合对分类数据进行比较，尤其是在分类名称较长，或当分类项数量较多的情况下，由于条形图的水平排列更便于显示这些类别。',
    ],
    nonUseCase: [
      '条形图不适合用于显示连续型变量之间的关系，且不适用于需要强调数值变化趋势时，因为条形图的重点在于分类间的比较。',
    ],
    fields: {
      x: {
        min: 1,
        max: 1,
        dataType: ['string', 'date', 'geo'],
        desc: 'x轴',
        optional: false,
      },
      y: { min: 1, max: 8, dataType: ['number'], desc: 'y轴', optional: false },
      s: {
        min: 0,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '分组',
        optional: true,
      },
    },
    limits: {
      [StatisticsFeatureKey.distinct]: {
        number: BAR_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x', 's'],
          measure: ['y'],
        },
        reason: `维值拆分数量超出${BAR_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  [CHART_NAME.area]: {
    chartName: '面积图',
    type: CHART_NAME.area,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.area],
    alias: '区域图、堆叠面积图',
    category: [CHART_PURPOSE.Trend, CHART_PURPOSE.Comparison],
    chartFunction: '趋势分析、总量构成',
    def: '在折线图基础上填充颜色区域，通过面积变化强调数据趋势和总量变化，特别适合展示时间序列的累积效果。',
    useCase: [
      '时间序列总量分析（如年度营收）、多组数据构成变化（如各产品线占比）、强调数据波动幅度、需要展示部分与整体关系的场景',
    ],
    nonUseCase: [
      '当多个数值字段的中位数数量级差异显著，导致较小数值的趋势在单一坐标轴下难以辨识时，建议优先采用双轴图以独立展示不同量级的数据',
      '离散型分类数据对比',
      '需要精确数值对比',
      '数据波动过小的场景',
    ],
    fields: {
      x: { min: 1, max: 1, dataType: ['date'], desc: 'x轴', optional: false },
      y: { min: 1, max: 8, dataType: ['number'], desc: 'y轴', optional: false },
      s: {
        min: 0,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '分组',
        optional: true,
      },
    },
    limits: {
      [StatisticsFeatureKey.distinct]: {
        number: LINE_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['s'],
          measure: ['y'],
        },
        reason: `维值拆分数量超出${LINE_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  [CHART_NAME.scatter]: {
    chartName: '散点图',
    type: CHART_NAME.scatter,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.scatter],
    alias: '气泡图、点阵图',
    category: [CHART_PURPOSE.Distribution, CHART_PURPOSE.Relation],
    chartFunction: '分布分析、相关性展示',
    def: '散点图是一种显示两个变量之间关系的图表。通过将每个数据点表示为图上的一个点，散点图能够展示两个变量（通常是数值变量）之间的相关性或分布趋势',
    useCase: [
      '发现两个变量之间的关系或趋势，例如相关性强度。显示数据的分布模式，检测异常值。数据点数量较大时，散点图能够有效呈现整体分布情况。',
    ],
    nonUseCase: ['只有一个变量的情况，因为散点图需要两个数值变量来显示数据点的位置。'],
    fields: {
      y: { min: 1, max: 1, dataType: ['number'], desc: 'x轴', optional: false },
      y2: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: 'y轴',
        optional: false,
      },
      color: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '颜色',
        optional: false,
      },
      size: {
        min: 0,
        max: 1,
        dataType: ['string', 'number'],
        desc: '大小',
        optional: true,
      },
    },
  },
  [CHART_NAME.dualAxes]: {
    chartName: '双轴图',
    type: CHART_NAME.dualAxes,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.dualAxes],
    alias: '混合图表、组合图',
    category: [CHART_PURPOSE.Trend, CHART_PURPOSE.Comparison, CHART_PURPOSE.Distribution],
    chartFunction: '多维度对比、复合分析',
    def: '双轴图是一种结合两个不同图表类型的组合图表，通常是将柱状图与折线图结合起来显示。双轴图通过在一个图表中使用两个垂直 Y 轴（左侧和右侧），分别对应不同的数值维度。柱状图用于展示一组数据的大小或数量，而折线图则展示另一组数据的趋势。双轴图非常适合同时展示不同类型的数据变化趋势。',
    useCase: [
      '同时展示多个具有不同数量级的数据，例如销售额和增长率。比较两组变量的相对变化趋势，如同时观察某时间段内的销量和利润率。数据维度不同且具有共同的 X 轴（例如时间、类别）。',
    ],
    nonUseCase: ['数据类型相同且数量级相近时，单一维度数据分析（建议使用折线图或柱状图'],
    fields: {
      x: {
        min: 1,
        max: 1,
        dataType: ['date', 'string'],
        desc: 'x轴',
        optional: false,
      },
      y: {
        min: 1,
        max: 8,
        dataType: ['number'],
        desc: '左y轴',
        optional: false,
      },
      y2: {
        min: 1,
        max: 8,
        dataType: ['number'],
        desc: '右y轴',
        optional: false,
      },
    },
  },
  [CHART_NAME.kpiChart]: {
    chartName: '指标卡',
    type: CHART_NAME.kpiChart,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.kpiChart],
    alias: 'KPI 卡、数据指标卡',
    category: [CHART_PURPOSE.Number],
    chartFunction: '关键指标展示、数据监控',
    def: '指标卡用于突出展示关键业务指标（KPI）的当前状态，通常包含数值、对比值和单位等信息，支持通过颜色、图标等方式直观反映指标健康度。',
    useCase: ['展示关键业务指标(KPI)的当前状态、数据为简单数值型指标、展示指标达成情况(如完成率)'],
    nonUseCase: ['需要展示复杂数据关系时、需要展示数据趋势变化时、需要展示数据分布或占比时'],
    fields: {
      value: {
        min: 1,
        max: 20,
        dataType: ['number'],
        desc: '指标',
        optional: false,
      },
    },
  },
  [CHART_NAME.spreadsheetPro]: {
    chartName: '交叉表',
    type: CHART_NAME.spreadsheetPro,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.spreadsheetPro],
    alias: '透视表、多维分析表',
    category: [CHART_PURPOSE.Table],
    chartFunction: '多维数据聚合、动态数据透视、交互式分析',
    def: '交叉表通过行/列双向维度对数据进行聚合计算，支持动态拖拽调整分析视角，可快速实现求和、计数、平均值等统计操作。核心特点是同时展示数据的分组结构和汇总结果。',
    useCase: [
      '多维数据对比分析（如地区 × 时间 × 产品销量）、快速生成数据透视报告（支持动态调整维度）、需要同时查看明细和汇总值的场景、包含层级关系的复杂数据聚合（如：年份 → 季度 → 月份）',
    ],
    nonUseCase: [
      '单一指标的简单数据展示（建议用普通表格）、需要高度可视化呈现的场景（建议配合图表使用）、非结构化数据（如文本内容分析）、超大数据量未预聚合时（可能导致性能问题）',
    ],
    fields: {
      x: {
        min: 1,
        max: 8,
        dataType: ['string', 'date', 'geo'],
        desc: '行头',
        optional: false,
      },
      x2: {
        min: 0,
        max: 8,
        dataType: ['string', 'date', 'geo'],
        desc: '列头',
        optional: false,
      },
      y: {
        min: 1,
        max: 8,
        dataType: ['number'],
        desc: '数值',
        optional: false,
      },
    },
    limits: {
      [StatisticsFeatureKey.distinct]: {
        number: SPREAD_SHEET_PRO_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x2'],
          measure: ['y'],
        },
        reason: `单元格数量超出${SPREAD_SHEET_PRO_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  [CHART_NAME.funnel]: {
    chartName: '漏斗图',
    type: CHART_NAME.funnel,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.funnel],
    alias: '转化漏斗',
    category: [CHART_PURPOSE.Proportion, CHART_PURPOSE.Trend],
    chartFunction: '转化分析、流程监控',
    def: '漏斗图用于展示多阶段流程中各环节的转化情况，通过逐层递减的图形直观呈现用户流失点，常用于分析业务流程转化效率。',
    useCase: [
      '适用于需要分析转化率的场景，例如：电商购物流程转化、用户注册流程分析、销售线索转化跟踪、营销活动效果评估',
    ],
    nonUseCase: ['非流程型数据展示、阶段数量过多（超过 10 个阶段）、需要精确数值对比的场景（建议配合表格使用）'],
    fields: {
      s: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '分段',
        optional: false,
      },
      value: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '指标',
        optional: false,
      },
    },
    limits: {
      [StatisticsFeatureKey.distinct]: {
        number: FUNNEL_CHART_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x'],
        },
        reason: `分段数量超出${FUNNEL_CHART_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  [CHART_NAME.sankey]: {
    chartName: '桑基图',
    type: CHART_NAME.sankey,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.sankey],
    alias: '能量分流图',
    category: [CHART_PURPOSE.Proportion, CHART_PURPOSE.Comparison, CHART_PURPOSE.Relation, CHART_PURPOSE.Distribution],
    chartFunction: '流量分析、路径追踪',
    def: '桑基图通过流动的带状宽度展示数据在不同节点间的流动情况，特别适合展示复杂的多层级流量变化和比例关系，常用于分析能量、资金或资源的流转路径。',
    useCase: ['适用于需要展示流转关系的场景，例如：能源生产与消耗路径、用户行为路径分析、资金流向追踪、供应链物流分析'],
    nonUseCase: [
      '简单线性流程（建议使用漏斗图）、节点关系过于复杂导致图形混乱、需要精确数值对比的场景（建议配合表格使用）',
    ],
    fields: {
      source: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '来源',
        optional: false,
      },
      target: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '去向',
        optional: false,
      },
      value: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '数值',
        optional: false,
      },
    },
  },
  [CHART_NAME.radar]: {
    chartName: '雷达图',
    type: CHART_NAME.radar,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.radar],
    alias: '蜘蛛图、星形图',
    category: [CHART_PURPOSE.Comparison],
    chartFunction: '多维对比、能力评估',
    def: '雷达图通过多边形面积展示多个维度的数值对比，适用于展示个体在多个特征维度的表现差异，常用于能力评估和多维度比较。',
    useCase: [
      '适用于需要多维度对比的场景，例如：个人综合能力评估（个人的语言表达、逻辑思维、亲和力 、运动、学习能力对比）、产品特性对比（手机的易用性、功能、拍照、跑分、续航对比）',
    ],
    nonUseCase: ['维度数量过多（超过 12 个）、需要精确数值对比的场景、单一维度的数据展示'],
    fields: {
      x: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '维度',
        optional: false,
      },
      y: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '指标',
        optional: false,
      },
      s: {
        min: 0,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '拆分',
        optional: true,
      },
    },
    limits: {
      [StatisticsFeatureKey.distinct]: {
        number: RADAR_CHART_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x'],
        },
        reason: `指标数量超出${RADAR_CHART_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  [CHART_NAME.liquid]: {
    chartName: '水波图',
    type: CHART_NAME.liquid,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.liquid],
    category: [CHART_PURPOSE.Comparison, CHART_PURPOSE.Number],
    chartFunction: '进度监控、完成度展示',
    def: '核心功能是直观地展示某个或某组指标相对于其目标的完成进度。它非常适用于需要监控任务完成度、关键绩效指标（KPI）达成率、资源消耗比例等场景，帮助用户快速判断当前状态，及时发现业务进展中的亮点或风险。',
    useCase: [
      '文件上传/下载进度显示、项目里程碑完成度、问卷调查进度跟踪、KPI 目标达成率、资源消耗比例（预算/配额使用率）',
    ],
    nonUseCase: [
      '缺乏可比性的独立指标对比：地理坐标数据（如经度/纬度对比）、无关联的维度指标（如 CPU 使用率与内存占用率对比）',
      '需展示多维数据关系：进度条仅能反映单一维度的完成度，无法呈现数据间的交互关系和多指标对比分析（如销售额、成本、利润的关联性）',
    ],
    fields: {
      value: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '当前值',
        optional: false,
      },
      target: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '字段型目标值',
        optional: false,
      },
    },
  },
  [CHART_NAME.table]: {
    chartName: '普通表格',
    type: CHART_NAME.table,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.table],
    alias: '数据明细表、原始数据表',
    category: [CHART_PURPOSE.Table],
    chartFunction: '原始数据展示、数据查询、明细记录查看',
    def: '普通表格是最基础的数据展示形式，以行列结构直接呈现原始数据记录，支持排序、筛选、分页等基础操作。特点是保留数据最原始的颗粒度，不进行任何聚合计算。',
    useCase: [
      '需要查看原始数据记录的场景（如订单明细、用户清单）、数据量适中（通常单页展示 100-1000 条）、需要灵活筛选/搜索特定数据的场景、作为其他图表的数据底层支撑（点击钻取查看明细）',
    ],
    nonUseCase: [
      '大数据量未分页时（超过 10 万条会导致性能问题）、需要聚合统计分析的场景（建议用交叉表）、纯数值对比场景（建议配合图表使用）、需要强可视化呈现的场合',
    ],
    fields: {
      row: {
        min: 1,
        max: 100,
        dataType: ['string', 'geo', 'number', 'date'],
        desc: '列头',
        optional: false,
      },
    },
  },
  [CHART_NAME.wordCloud]: {
    chartName: '词云图',
    type: CHART_NAME.wordCloud,
    abbrType: FULL_AND_ABBR_CHART_NAME_MAP[CHART_NAME.wordCloud],
    alias: '词云',
    category: [CHART_PURPOSE.Rank, CHART_PURPOSE.Trend],
    chartFunction: '排名、趋势',
    def: '词云图是一种用于展示文本数据中词语出现频率或权重的可视化方法，通过不同大小的文字来表示词频。词云图可以帮助快速识别文本数据中最常用或最重要的词语。每个词的大小通常与其出现频率成正比，通常较大的字体代表更频繁出现或更重要的词，使用户可以直观地看到某个词在文本中出现的频繁程度。这种视觉化方式使得用户能够快速抓住文本的主要内容和核心主题。',
    useCase: [
      '分析社交媒体、评论或反馈中常用的词语。',
      '文字分析中识别关键词或主题。',
      '在需要突出显示某些词汇的重要性时非常有用，比如新闻报道摘要、市场调研结果等场合。',
    ],
    nonUseCase: ['数据主要为数值型，不涉及文本。', '需要精确数值对比的场合。', '文本数据量过小，无法形成有效对比。'],
    fields: {
      s: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '名词',
        optional: false,
      },
      value: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '数值',
        optional: false,
      },
    },
  },
};
