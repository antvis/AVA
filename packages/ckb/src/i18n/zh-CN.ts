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
      TreeGraph: '树形关系类',
      GeneralGraph: '关系图类',
      PointLayer: '点图层类',
      LineLayer: '线图层类',
      PolygonLayer: '面图层类',
      HeatmapLayer: '地图热力图类',
      Others: '其他类',
      Table: '表格类',
    },
    category: {
      Statistic: '统计图表',
      Diagram: '示意图',
      Graph: '关系图',
      Map: '地图',
      Other: '其他',
    },
    purpose: {
      Comparison: '比较',
      Trend: '趋势',
      Distribution: '分布',
      Rank: '排名',
      Proportion: '占比',
      Composition: '组成',
      Relation: '关系',
      Hierarchy: '层级',
      Flow: '流向',
      Spatial: '空间',
      Anomaly: '异常',
      Value: '数值',
    },
    coord: {
      NumberLine: '数轴',
      Cartesian2D: '二维直角坐标系',
      SymmetricCartesian: '对称直角坐标系',
      Cartesian3D: '三维直角坐标系',
      Polar: '极坐标系',
      NodeLink: '点线关系网络',
      Radar: '雷达型坐标系',
      Geo: '地理坐标系',
      Other: '其他',
    },
    shape: {
      Lines: '线形',
      Bars: '条形',
      Round: '圆形',
      Square: '方形',
      Area: '面形',
      Scatter: '散点形',
      Symmetric: '对称形',
      Network: '网络形',
      Map: '地图',
      Other: '其他',
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
      Opacity: '透明度',
      Stroke: '线色',
      LineWidth: '线粗',
      Lightness: '亮度',
    },
    lom: {
      Continuous: '连续',
      Discrete: '离散',
      Interval: '数值',
      Nominal: '无序名词',
      Ordinal: '有序名词',
      Time: '时间',
    },
    recRate: {
      Recommended: '推荐',
      'Use with Caution': '慎用',
      'Not Recommended': '不推荐',
    },
  },
  chartTypes: {
    line_chart: {
      name: '折线图',
      alias: ['折线图', '线图'],
      def: '使用折线的线段显示数据在一个具有顺序性的维度上的变化。',
    },
    step_line_chart: {
      name: '阶梯图',
      alias: ['阶梯线'],
      def: '折线根据分类字段分为多根在 x 方向（时间）的信息是完全一致、颜色及 y 方向（变量）信息不一致的折线，通常用作同一时间区间内多个变量发展趋势的对比。',
    },
    area_chart: {
      name: '面积图',
      alias: [],
      def: '使用带填充区域的线段显示数据在一个具有顺序性的维度上的变化。',
    },
    stacked_area_chart: {
      name: '堆叠面积图',
      alias: [],
      def: '使用带不同样式的填充区域的层叠线段来显示多组数据在同一个具有顺序性的维度上的变化，线段在同一维度值上的端点高度按照数值累加。',
    },
    percent_stacked_area_chart: {
      name: '百分比堆叠面积图',
      alias: ['%堆叠面积图', '100%堆叠面积图'],
      def: '一种特殊的堆叠面积图，线段在同一维度值上的端点高度代表值在其中的占比，占比总和为百分之百。',
    },

    interval_area_chart: {
      name: '区间面积图',
      alias: [],
      def: 'TBD',
    },
    stream_chart: {
      name: '流图',
      alias: [],
      def: 'TBD',
    },

    column_chart: {
      name: '柱状图',
      alias: ['柱形图'],
      def: '使用柱形显示维度的数值。横轴显示分类维度，纵轴显示相应的值。',
    },
    grouped_column_chart: {
      name: '分组柱状图',
      alias: ['簇状柱状图'],
      def: '使用颜色不同的柱形并排组成小组来显示各维度的数值。横轴标示出分组，颜色标示出分类，纵轴显示相应的值。',
    },
    stacked_column_chart: {
      name: '堆叠柱状图',
      alias: [],
      def: '使用颜色不同的堆叠的柱形来显示各维度的数值。横轴标示出第一个分类维度，颜色标示出第二个分类维度，纵轴显示相应的值。',
    },
    percent_stacked_column_chart: {
      name: '百分比堆叠柱状图',
      alias: ['%堆叠柱状图', '100%堆叠柱状图'],
      def: '使用颜色不同的堆叠的柱形来显示各维度的数值。横轴标示出第一个分类维度，颜色标示出第二个分类维度，纵轴显示相应分类所占的百分比。',
    },

    interval_column_chart: {
      name: '区间柱状图',
      alias: [],
      def: 'TBD',
    },

    range_column_chart: {
      name: '值域柱状图',
      alias: [],
      def: '值域柱状图是一种特殊的柱状图，柱子不一定要从 0 开始，而是用柱子长度表示一个从起始值到终止值的区间。',
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
    bar_chart: {
      name: '条形图',
      alias: ['条状图'],
      def: '使用条形显示维度的数值。纵轴显示分类维度，横轴显示相应的值。',
    },
    grouped_bar_chart: {
      name: '分组条形图',
      alias: ['簇状条形图'],
      def: '使用颜色不同的条形并排组成小组来显示维度的数值。纵轴标示出分组，颜色标示出分类，横轴显示相应的值。',
    },
    stacked_bar_chart: {
      name: '堆叠条形图',
      alias: [],
      def: '使用颜色不同的堆叠的条形来显示各维度的数值。纵轴标示出第一个分类维度，颜色标示出第二个分类维度，横轴显示相应的值。',
    },
    percent_stacked_bar_chart: {
      name: '百分比堆叠条形图',
      alias: ['%堆叠条形图', '100%堆叠条形图'],
      def: '使用颜色不同的堆叠的条形来显示各维度的数值。纵轴标示出第一个分类维度，颜色标示出第二个分类维度，横轴显示相应分类所占的百分比。',
    },

    interval_bar_chart: {
      name: '区间条形图',
      alias: [],
      def: 'TBD',
    },

    range_bar_chart: {
      name: '值域条形图',
      alias: [],
      def: '值域条形图是一种特殊的条形图，条不一定要从 0 开始，而是用长度表示一个从起始值到终止值的区间。',
    },

    radial_bar_chart: {
      name: '径向条形图',
      alias: ['环形条形图', '环形柱状图', '玉珏图'],
      def: '径向条形图是一种在极坐标系下绘制的条形图。径向条形图沿半径方向展示分类维度，使用角度来反应数值。',
    },

    mirror_bar_chart: {
      name: '对称条形图',
      alias: [],
      def: 'TBD',
    },

    bullet_chart: {
      name: '子弹图',
      alias: ['靶心图', '标靶图'],
      def: '子弹图可用于将度量的绩效可视化并与目标值和定性刻度。',
    },

    pie_chart: {
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
      name: '嵌套饼图',
      alias: [],
      def: 'TBD',
    },
    rose_chart: {
      name: '玫瑰图',
      alias: ['南丁格尔图', '鸡冠花图', '极坐标面积图'],
      def: '统计学家和医学改革家佛罗伦萨‧南丁格尔在克里米亚战争期间创造了这种图表。尽管外形很像饼图，但本质上来说，南丁格尔玫瑰图更像在极坐标下绘制的柱状图或堆叠柱状图。只不过，它用半径来反映数值。',
    },

    scatter_plot: {
      name: '散点图',
      alias: [],
      def: '散点图是将所有的数据以不同颜色的点的形式展现在平面直角坐标系上的统计图表。',
    },
    bubble_chart: {
      name: '气泡图',
      alias: [],
      def: '气泡图是一种多变量的统计图表，由笛卡尔坐标系（直角坐标系）和大小不一、颜色不同的圆组成，可以看作是散点图的变形。',
    },

    treemap: {
      name: '树图',
      alias: ['矩形树图'],
      def: '树图是一个由不同大小的嵌套式矩形来显示树状结构数据的统计图表。',
    },

    funnel_chart: {
      name: '漏斗图',
      alias: [],
      def: '漏斗图，形如“漏斗”，用于单流程分析，在开始和结束之间由N个流程环节组成。',
    },

    overlapping_funnel_chart: {
      name: '重叠漏斗图',
      alias: [],
      def: 'TBD',
    },

    mirror_funnel_chart: {
      name: '对比漏斗图',
      alias: ['对称漏斗图', '镜像漏斗图'],
      def: '对比漏斗图是两个独立的漏斗图以一根中轴线对称展开的图表形式。',
    },

    box_plot: {
      name: '箱形图',
      alias: ['箱线图', '盒须图', '盒式图', '盒状图'],
      def: '箱形图是一种用作显示一组数据分散情况的统计图表，因形状如箱子而得名。箱子的顶端和底端分别代表上下四分位数，箱子中间的线代表中位数。从箱子延伸出去的线条展现出了上下四分位数以外的数据。有时，箱形图上也会出现个别的点，这代表离群值，也可称之为异常值。',
    },

    heatmap: {
      name: '热力图',
      alias: ['区块热力图'],
      def: '热力图，是一种通过对色块着色来显示数据的统计图表。',
    },

    density_heatmap: {
      name: '密度热力图',
      alias: ['热力图'],
      def: '密度热力图是一种用在连续坐标系上用色点展现密度分布的统计图表。',
    },

    gauge_chart: {
      name: '量规图',
      alias: ['仪表盘'],
      def: 'TBD',
    },

    radar_chart: {
      name: '雷达图',
      alias: ['蛛网图'],
      def: '将不同系列的多个维度的数据量映射到坐标轴上，这些坐标轴起始于同一个圆心点，通常结束于圆周边缘，将同一组的点使用线连接起来，用颜色区分系列。',
    },

    wordcloud: {
      name: '词云',
      alias: [],
      def: 'TBD',
    },
    candlestick_chart: {
      name: '蜡烛图',
      alias: ['烛台图'],
      def: 'TBD',
    },

    compact_box_tree: {
      name: '紧凑树',
      alias: [],
      def: '紧凑树是一种树图布局，从根节点开始，同一深度的节点在同一层。适合于脑图等应用场景。',
    },
    dendrogram: {
      name: '生态树',
      alias: [],
      def: '生态树是一种树图布局，不管数据的深度多少，总是叶节点对齐。常用于表示层次聚类。',
    },
    indented_tree: {
      name: '缩进树',
      alias: [],
      def: '缩进树是一种树图布局，树节点的层级通过水平方向的缩进量来表示，每个元素会占一行或一列。常用于表示文件目录结构。',
    },
    radial_tree: {
      name: '辐射树',
      alias: [],
      def: '辐射树是一种树图布局，根节点位于辐射树中心，其他分支辐射式展开。',
    },
    flow_diagram: {
      name: '流程图',
      alias: ['有向图', '层次布局图'],
      def: '流程图是一种图解，可视表示在过程或功能内部诸如事件、步骤等之间的顺序关系。',
    },
    fruchterman_layout_graph: {
      name: 'Fruchterman 布局力导向图',
      alias: [],
      def: '一种使用 Fruchterman 布局算法的力导向图。',
    },
    force_directed_layout_graph: {
      name: '力导向图',
      alias: [],
      def: '力导向图布局作为较早被发明的一种实际应用布局算法，经过研究者多年改进、扩展，已发展成为一类算法的集合。该类算法的特点是模拟物理世界中的作用力，施加在节点上，并迭代计算以达到合理放置节点、美观布局的一类算法。',
    },
    fa2_layout_graph: {
      name: 'Force Atlas 2 力导向布局',
      alias: ['FA2力导向布局'],
      def: '一种使用 Force Atlas 2 布局算法的力导向图，相比于传统的力导算法，该算法在计算力时更关注于节点的度数。',
    },
    mds_layout_graph: {
      name: 'MDS 布局图',
      alias: ['多维尺度分析布局'],
      def: '一种使用 MDS (Multi-Dimensional Scaling) 降维算法计算节点位置的图布局方法。',
    },
    circular_layout_graph: {
      name: '环形布局关系图',
      alias: [],
      def: '环形布局根据参数指定的排序方式对节点进行排序后，将节点排列在圆环上。',
    },
    spiral_layout_graph: {
      name: '螺旋布局关系图',
      alias: [],
      def: '螺旋布局图的节点排列在一根螺旋线上。',
    },
    radial_layout_graph: {
      name: '辐射布局关系图',
      alias: [],
      def: '辐射布局根据指定的中心点，根据其他节点与中心点的拓扑距离（最短路径长度）将其余节点放置在以中心点为圆心的同心圆上。',
    },
    concentric_layout_graph: {
      name: '同心圆布局关系图',
      alias: [],
      def: '同心圆布局关系图将所有节点放置在同心圆上。',
    },
    grid_layout_graph: {
      name: '网格布局关系图',
      alias: [],
      def: '网格布局根据参数指定的排序方式对节点进行排序后，将节点排列在网格上。',
    },
    arc_diagram: {
      name: '弧形图',
      alias: [],
      def: '弧形图是一种关系图的特殊布局，节点被排列在同一水平线上，关系由节点间的圆弧线表示。',
    },
    chord_diagram: {
      name: '弦图',
      alias: [],
      def: '弦图是一种展示实体之间的相互关系的方法，常用来比较不同数据组之间的相似性。节点围绕一个圆圈径向排列，点与点之间以弧线彼此连接以显示其中关系。',
    },
    non_ribbon_chord_diagram: {
      name: '无带弦图',
      alias: [],
      def: '无带弦图是弦图的简化版本，只显示连接线，相比弦图更加突出了数据之间的联系。',
    },

    sankey_diagram: {
      name: '桑基图',
      alias: ['桑吉图'],
      def: '桑基图，是一种表现流程的示意图，用于描述一组值到另一组值的流向。分支的宽度对应了数据流量的大小。',
    },

    symbol_map: {
      name: '符号地图',
      alias: [],
      def: '散点地图的变体，用具象的图标指代抽象的圆点，无需图例就能直观看出数据点代表的内容，常用于地图上重要地标的显示或数据量较少时的信息表达。',
    },
    chart_map: {
      name: '复合图表地图',
      alias: [],
      def: '是定点地图的变体，使用二维统计图表代替点状符号的一种特殊复合形式。',
    },
    column_map_3d: {
      name: '3D 柱状图',
      alias: [],
      def: '用形状大小相同的柱状体代替点状符号，高度与数值大小映射共同表达离散现象分布特征的地图',
    },
    scatter_map: {
      name: '散点地图',
      alias: [],
      def: '指地图上可用一个形状大小相同的圆点来定位，用表达离散现象分布特征的地图，如人口、农作物、动植物等的分布',
    },
    path_map: {
      name: '路径地图',
      alias: [],
      def: '指需要用一连串首尾不闭合的点坐标对（xi,yi）来定位的一类图层。属于半依比例图层，线端点依附地图比例缩放，但线的粗细不会变化。',
    },
    isoline_map: {
      name: '等值线地图',
      alias: [],
      def: 'TBD',
    },
    arc_map_3d: {
      name: '3D 弧线地图',
      alias: [],
      def: '将两个点的连线绘制成弧形，绘制的弧线可以是贝塞尔曲线，大圆航线，通常用来表示两种地理事物关系和联系，或者人口迁移，物流起点目的地等。',
    },
    choropleth_map: {
      name: '填充地图',
      alias: [],
      def: '填充图，也叫分级统计图，可在地图上不同领土区域进行着色，查看区域间的分布对比情况',
    },
    choropleth_map_3d: {
      name: '3D 填充地图',
      alias: [],
      def: '填充地图的增强实现，通过三维视角中的高度模拟真实地物的高度。',
    },
    hexagonal_heat_map: {
      name: '蜂窝热力地图',
      alias: [],
      def: '使用六边形将地图区域进行分割，计算每个区域中点数或其他累加值，将离散的点转换为数值。然后将数值映射到每个区域的色值、高度或其他参数',
    },
    hexagonal_heat_map_3d: {
      name: '3D 蜂窝热力地图',
      alias: [],
      def: '使用3D 六边形将地图区域进行分割，计算每个区域中点数或其他累加值，将离散的点转换为数值。然后将数值映射到每个区域的色值、高度或其他参数',
    },
    classical_heat_map: {
      name: '热力地图',
      alias: [],
      def: '密度热力图是一种用在连续坐标系上用色点展现密度分布的统计地图。',
    },
    grid_heat_map: {
      name: '网格热力地图',
      alias: [],
      def: '使用网格区域进行分割，计算每个区域中点数或其他累加值，将离散的点转换为数值。然后将数值映射到每个区域的色值、高度或其他参数',
    },
    bubble_map: {
      name: '气泡地图',
      alias: [],
      def: '指地图上用一个形状相同、面积大小和数值成正比的圆点来定位的地图，是散点图的扩展，用于表达离散现象分布特征的地图。',
    },
    bubble_light_map: {
      name: '亮点地图',
      alias: [],
      def: '散点图的变形，指用一个点代表一个值，连续渐进颜色代表数值大小，并通过色彩的叠加的达到效果增强，专为海量散点数据运用而生，解决远视角下，点颜色无法区分问题',
    },
    packed_circles: {
      name: '打包图',
      alias: [],
      def: 'TBD',
    },
    polar_treemap: {
      name: '极坐标树图',
      alias: [],
      def: 'TBD',
    },
    sunburst_diagram: {
      name: '旭日图',
      alias: ['太阳辐射图'],
      def: 'TBD',
    },
    liquid_chart: {
      name: '水波图',
      alias: ['进度球'],
      def: '一种用来表示进度的拟物化示意图',
    },
    kpi_panel: {
      name: '指标卡',
      alias: ['指标卡'],
      def: '一种用来展示聚合数据的卡片区域',
    },
    table: {
      name: '表格',
      alias: ['交叉表'],
      def: '表格就是由若干的行与列所构成的一种有序的组织形式',
    },
  },
};
