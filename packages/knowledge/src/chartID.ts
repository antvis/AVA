const CHART_ID_OPTIONS = [
  'single_line_chart',
  'multi_line_chart',
  'single_step_line_chart',
  'multi_step_line_chart',
  'basic_area_chart',
  'multi_color_area_chart',
  'stacked_area_chart',
  'percent_stacked_area_chart',
  'interval_area_chart',
  'stream_chart',
  'basic_column_chart',
  'multi_color_column_chart',
  'grouped_column_chart',
  'stacked_column_chart',
  'percent_stacked_column_chart',
  'interval_column_chart',
  'waterfall_chart',
  'histogram',
  'basic_bar_chart',
  'multi_color_bar_chart',
  'stacked_bar_chart',
  'percent_stacked_bar_chart',
  'grouped_bar_chart',
  'interval_bar_chart',
  'radial_bar_chart',
  'mirror_bar_chart',
  'basic_pie_chart',
  'donut_chart',
  'nested_pie_chart',
  'rose_chart',
  'basic_scatter_plot',
  'multi_color_scatter_plot',
  'basic_bubble_chart',
  'multi_color_bubble_chart',
  'non_ribbon_chord_diagram',
  'arc_diagram',
  'chord_diagram',
  'treemap',
  'sankey_diagram',
  'basic_funnel_chart',
  'overlapping_funnel_chart',
  'mirror_funnel_chart',
  'boxplot',
  'heatmap',
  'density_heatmap',
  'gauge_chart',
  'basic_radar_chart',
  'multi_color_radar_chart',
  'wordcloud',
  'candlestick_chart',
  'compact_box_tree',
  'dendrogram',
  'indented_tree',
  'radial_tree',
  'flow_diagram',
  'fruchterman_layout_graph',
  'force_directed_layout_graph',
  'circular_layout_graph',
  'spiral_layout_graph',
  'radial_layout_graph',
  'concentric_layout_graph',
  'grid_layout_graph',
  'symbol_map',
  'chart_map',
  'column_map_3d',
  'scatter_map',
  'path_map',
  'isoline_map',
  'arc_map_3d',
  'choropleth_map',
  'choropleth_map_3d',
  'hexagonal_heat_map',
  'hexagonal_heat_map_3d',
  'classical_heat_map',
  'grid_heat_map',
  'packed_circles',
  'polar_treemap',
  'sunburst_diagram',
  'liquid_chart',
] as const;

export type ChartID = typeof CHART_ID_OPTIONS[number] | string;
