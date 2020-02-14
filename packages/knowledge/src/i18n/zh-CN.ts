import { TranslateList } from './interface';

export const zhCN: TranslateList = {
  concepts: {
    family: {
      LineCharts: '折线图类',
      ColumnCharts: '柱状图类',
      BarCharts: '条形图类',
      PieCharts: '饼图类',
      AreaCharts: '面积图类',
      ScatterCharts: '散点图类',
      FunnelCharts: '漏斗图类',
      HeatmapCharts: '热力图类',
      RadarCharts: '雷达图类',
      Others: '其他类',
    },
    category: {
      Statistic: '统计图表',
      Diagram: '示意图',
      Graph: '关系图',
      Map: '地图',
    },
    purpose: {
      Comparison: '比较',
      Trend: '趋势',
      Distribution: '分布',
      Rank: '排名',
      Proportion: '占比',
      Composition: '组成',
    },
    coord: {
      NumberLine: '数轴',
      Cartesian2D: '二维直角坐标系',
      SymmetricCartesian: '对称直角坐标系',
      Cartesian3D: '三维直角坐标系',
      Polar: '极坐标系',
      NodeLink: '点线关系网络',
      Radar: '雷达型坐标系',
    },
    shape: {
      Lines: '线形',
      Bars: '条形',
      Round: '圆形',
      Square: '方形',
      Area: '面形',
      Scatter: '散点形',
      Symmetric: '对称形',
    },
    channel: {
      Position: '位置',
      Length: '长度',
      Color: '颜色',
      Area: '面积',
      Angle: '角度',
      ArcLength: '弧长',
      Direction: '方向',
      Size: '大小',
    },
    lom: {
      Continuous: '连续',
      Discrete: '离散',
      Interval: '数值',
      Nominal: '无序名词',
      Ordinal: '有序名词',
      Time: '时间',
    },
  },
  chartTypes: {
    single_line_chart: {
      name: '单折线图',
      alias: ['折线图', '线图', '基础折线图'],
      def: '使用一条折线的线段显示数据在一个具有顺序性的维度上的变化。',
    },
    multi_line_chart: {
      name: '多折线图',
      alias: ['折线图', '线图', '多色折线图'],
      def: '使用多条折线的线段显示数据在一个具有顺序性的维度上的变化。',
    },
    single_step_line_chart: {
      name: '单线阶梯图',
      alias: ['阶梯图', '基础阶梯图'],
      def:
        '阶梯线图用于表示连续时间跨度内的数据，它通常用于显示某变量随时间的变化模式：是上升还是下降，是否存在周期性的循环？因此，相对于独立的数据点，折线图关注的是全局趋势。',
    },
    multi_step_line_chart: {
      name: '多线阶梯图',
      alias: ['阶梯图', '多色阶梯图'],
      def:
        '折线根据分类字段分为多根在 x 方向（时间）的信息是完全一致、颜色及 y 方向（变量）信息不一致的折线，通常用作同一时间区间内多个变量发展趋势的对比。',
    },
    basic_area_chart: {
      name: '基础面积图',
      alias: ['单面积图', '面积图'],
      def: '使用一个带填充区域的线段显示数据在一个具有顺序性的维度上的变化。',
    },
    multi_color_area_chart: {
      name: '多面积图',
      alias: ['面积图', '重叠面积图', '多色面积图'],
      def: '使用多个带填充区域的线段显示数据在一个具有顺序性的维度上的变化。',
    },
    stacked_area_chart: {
      name: '堆叠面积图',
      alias: [],
      def:
        '使用带不同样式的填充区域的层叠线段来显示多组数据在同一个具有顺序性的维度上的变化，线段在同一维度值上的端点高度按照数值累加。',
    },
    percent_stacked_area_chart: {
      name: '百分比堆叠面积图',
      alias: ['%堆叠面积图', '100%堆叠面积图'],
      def: '一种特殊的堆叠面积图，线段在同一维度值上的端点高度代表值在其中的占比，占比总和为百分之百。',
    },

    interval_area_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    stream_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },

    basic_column_chart: {
      name: '基础柱状图',
      alias: ['柱状图', '单柱状图'],
      def: '使用单色柱形显示维度的数值。横轴显示分类维度，纵轴显示相应的值。',
    },
    multi_color_column_chart: {
      name: '多色柱状图',
      alias: ['柱状图'],
      def: '使用多色柱形显示维度的数值。横轴显示分类维度，纵轴显示相应的值。',
    },
    grouped_column_chart: {
      name: '分组柱状图',
      alias: ['簇状柱状图'],
      def: '使用颜色不同的柱形并排组成小组来显示各维度的数值。横轴标示出分组，颜色标示出分类，纵轴显示相应的值。',
    },
    stacked_column_chart: {
      name: '堆叠柱状图',
      alias: [],
      def:
        '使用颜色不同的堆叠的柱形来显示各维度的数值。横轴标示出第一个分类维度，颜色标示出第二个分类维度，纵轴显示相应的值。',
    },
    percent_stacked_column_chart: {
      name: '百分比堆叠柱状图',
      alias: ['%堆叠柱状图', '100%堆叠柱状图'],
      def:
        '使用颜色不同的堆叠的柱形来显示各维度的数值。横轴标示出第一个分类维度，颜色标示出第二个分类维度，纵轴显示相应分类所占的百分比。',
    },

    interval_column_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },

    waterfall_chart: {
      name: '瀑布图',
      alias: ['桥图'],
      def: '瀑布图形似瀑布流水，采用绝对值与相对值结合的方式，适用于表达数个特定数值之间的数量变化关系。',
    },

    histogram: {
      name: '直方图',
      alias: [],
      def: '直方图是一种统计报告图，由一系列高度不等的纵向条纹或线段表示数据分布的情况。',
    },
    basic_bar_chart: {
      name: '基础条形图',
      alias: ['条形图', '单色条形图'],
      def: '使用单色条形显示维度的数值。纵轴显示分类维度，横轴显示相应的值。',
    },
    multi_color_bar_chart: {
      name: '多色条形图',
      alias: ['条形图'],
      def: '使用多色条形显示维度的数值。纵轴显示分类维度，横轴显示相应的值。',
    },
    grouped_bar_chart: {
      name: '分组条形图',
      alias: ['簇状条形图'],
      def: '使用颜色不同的条形并排组成小组来显示维度的数值。纵轴标示出分组，颜色标示出分类，横轴显示相应的值。',
    },
    stacked_bar_chart: {
      name: '堆叠条形图',
      alias: [],
      def:
        '使用颜色不同的堆叠的条形来显示各维度的数值。纵轴标示出第一个分类维度，颜色标示出第二个分类维度，横轴显示相应的值。',
    },
    percent_stacked_bar_chart: {
      name: '百分比堆叠条形图',
      alias: ['%堆叠条形图', '100%堆叠条形图'],
      def:
        '使用颜色不同的堆叠的条形来显示各维度的数值。纵轴标示出第一个分类维度，颜色标示出第二个分类维度，横轴显示相应分类所占的百分比。',
    },

    interval_bar_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    radial_bar_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    mirror_bar_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },

    basic_pie_chart: {
      name: '饼图',
      alias: [],
      def: '通过扇形区块的颜色和弧长（角度、面积）来展现数据的分类和占比情况。',
    },
    donut_chart: {
      name: '环图',
      alias: ['甜甜圈图'],
      def: '通过弧形区块的颜色和弧长来展现数据的分类和占比情况。',
    },

    nested_pie_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    nightingale_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },

    basic_scatter_plot: {
      name: '基础散点图',
      alias: ['散点图'],
      def: '散点图是将所有的数据以点的形式展现在平面直角坐标系上的统计图表。',
    },
    multi_color_scatter_plot: {
      name: '多色散点图',
      alias: ['散点图'],
      def: '多色散点图是将所有的数据以不同颜色的点的形式展现在平面直角坐标系上的统计图表。',
    },
    basic_bubble_chart: {
      name: '基础气泡图',
      alias: ['气泡图'],
      def: '气泡图是一种多变量的统计图表，由笛卡尔坐标系（直角坐标系）和大小不一的圆组成，可以看作是散点图的变形。',
    },
    multi_color_bubble_chart: {
      name: '多色气泡图',
      alias: ['气泡图'],
      def:
        '多色气泡图是一种多变量的统计图表，由笛卡尔坐标系（直角坐标系）和大小不一、颜色不同的圆组成，可以看作是散点图的变形。',
    },

    non_ribbon_chord_diagram: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    arc_diagram: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    chord_diagram: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    treemap: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    sankey_diagram: {
      name: '',
      alias: [],
      def: 'TBD',
    },

    basic_funnel_chart: {
      name: '基础漏斗图',
      alias: ['漏斗图'],
      def: '基础漏斗图，形如“漏斗”，用于单流程分析，在开始和结束之间由N个流程环节组成。',
    },

    overlapping_funnel_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },

    mirror_funnel_chart: {
      name: '对比漏斗图',
      alias: ['对称漏斗图', '镜像漏斗图'],
      def: '对比漏斗图是两个独立的漏斗图以一根中轴线对称展开的图表形式。',
    },

    boxplot: {
      name: '',
      alias: [],
      def: 'TBD',
    },

    heatmap: {
      name: '热力图',
      alias: [],
      def: '热力图，是一种通过对色块着色来显示数据的统计图表。',
    },

    gauge_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },

    basic_radar_chart: {
      name: '单线雷达图',
      alias: [],
      def:
        '将多个维度的数据量映射到坐标轴上，这些坐标轴起始于同一个圆心点，通常结束于圆周边缘，将同一组的点使用线连接起来。',
    },
    multi_color_radar_chart: {
      name: '多线雷达图',
      alias: [],
      def:
        '将不同系列的多个维度的数据量映射到坐标轴上，这些坐标轴起始于同一个圆心点，通常结束于圆周边缘，将同一组的点使用线连接起来，用颜色区分系列。',
    },

    wordcloud: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    candlestick_chart: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    compact_box_tree: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    dendrogram: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    indented_tree: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    radial_tree: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    flow_diagram: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    fruchterman_layout_cluster_graph: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    fruchterman_layout_graph: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    force_directed_layout_graph: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    circular_layout_graph: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    spiral_layout_graph: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    radial_layout_graph: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    concentric_layout_graph: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    grid_layout_graph: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    bubbles_diagram: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    symbol_map: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    chart_map: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    column_map_3d: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    scatter_map: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    path_map: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    isoline_map: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    arc_map_3d: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    choropleth_map: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    choropleth_map_3d: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    hexagonal_heat_map: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    hexagonal_heat_map_3d: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    classical_heat_map: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    grid_heat_map: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    packed_circles: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    polar_treemap: {
      name: '',
      alias: [],
      def: 'TBD',
    },
    sunburst_diagram: {
      name: '',
      alias: [],
      def: 'TBD',
    },
  },
};
