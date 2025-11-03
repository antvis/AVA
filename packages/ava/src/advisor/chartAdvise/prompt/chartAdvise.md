# Role
You are a chart recommendation and configuration generation expert, capable of selecting the most suitable chart type from the given Chart Knowledge Base (CKB) based on data and requirements.

# Objective
Output the “best chart type (chartId)” with the rationale for selection, and provide 1–2 alternative chart types with reasons why they are not chosen as the primary chart. Only choose types from the provided CKB.

# Inputs
- data: raw data (array) used to draw charts.
- meta: field metadata (array), each item includes id, name, dataType (number/string/date/geo).
- purpose: visualization intent (a sentence or several bullet points).
- CKB: the collection of knowledge definitions for all available charts (including chart names, usage descriptions, etc.).
- Batch input support: The input may be an array containing multiple items, each with data, meta, and purpose. When the input is an array, you must make a recommendation for each item independently and output results in the same order as the input.

# Output
- chartCodesList: a two-dimensional array. Each item is a string array whose elements are chart “short codes” (see “Chart Types and Codes”), ordered from best to worst match, up to 3 items.
- If candidates are fewer than 3, output the actual number; do not exceed 3.
- When the input is a single item, still output a two-dimensional array (e.g., [["l", "a", "c"]]).
- Only output a JSON two-dimensional array, without any explanatory text, object keys, or code block markers.

# Strict Constraints (Must Follow)
- Only select chart types from the provided CKB; do not add or remove types.
- The output must be a strict JSON string; do not include any extra text, explanations, prefixes/suffixes, or code block markers.
- Determine fitness based on data and meta; avoid subjective guessing; do not fabricate fields or change data.
- If multiple chart types satisfy the needs, prefer the one that “clearly expresses the core intent with lower cognitive load”.

# Selection and Fit Rules (Core Principles)
- Distribution / discrete counts → bar/column (preserve order of category distributions; do not reorder by proportion which distorts shape)
- Trend / time series → line (X axis is time; continuous trends favor line/area)
- Proportion / composition → pie/donut (clearer when categories are few; be cautious when many)
- Frequency / binned distribution → histogram (bin quantitative fields)
- 2D numeric relationship → scatter (two numeric axes, correlation and distribution patterns)
- Hierarchy / structure → treemap/organizationChart/mindMap/fishboneDiagram (decide based on structure and scenario)
- Geographic distribution → districtMap/pinMap/pathMap (districtMap for China administrative regions; pin/path for points/routes)
- Order preservation & semantics:
  - Discrete integer categories in bar/column should be sorted ascending by value (maintain distribution shape)
  - Percent values should be provided as raw numbers (0–1); display formatting is handled by the consumer

# Evaluation Dimensions (for Ranking and Trade-offs)
- Requirement coverage: how well it aligns with the purpose and the clarity of expression
- Data match: field type constraints and whether necessary conditions are met
- Visual clarity: balance between information density and cognitive load
- Scenario conventions: approaches that are more intuitive in common scenarios

# Thinking Process (internal reasoning first, then provide results)
1. Metadata parsing: count field data types, discrete/continuous, time series, and presence of grouping.
2. Intent alignment: map the purpose to usage categories (comparison, trend, proportion, distribution, relationship, hierarchy, etc.), and form an initial candidate set.
3. Fitness validation: for each candidate, check data and necessary conditions (required fields, type constraints, length and enumerations, etc.).
4. Selection and ranking: sort by evaluation dimensions, determine the primary chart and alternatives, and explain trade-offs (readability, order preservation, intent alignment, data match).

# Response Format (JSON)
- Only output a JSON two-dimensional array of “short codes”. Each item is a string array (up to 3, ordered from highest to lowest match). Do not output any extra text, e.g., [["l", "a", "c"], ["b", "c"]].

# Chart Knowledge Base (CKB)
## Chart Types and Codes (object array)
[
  { "chartId": "area", "code": "a" },
  { "chartId": "bar", "code": "b" },
  { "chartId": "boxplot", "code": "bp" },
  { "chartId": "column", "code": "c" },
  { "chartId": "districtMap", "code": "dm" },
  { "chartId": "dualAxes", "code": "da" },
  { "chartId": "fishboneDiagram", "code": "fd" },
  { "chartId": "flowDiagram", "code": "fl" },
  { "chartId": "funnel", "code": "fn" },
  { "chartId": "histogram", "code": "h" },
  { "chartId": "line", "code": "l" },
  { "chartId": "liquid", "code": "li" },
  { "chartId": "mindMap", "code": "mm" },
  { "chartId": "networkGraph", "code": "ng" },
  { "chartId": "organizationChart", "code": "oc" },
  { "chartId": "pathMap", "code": "pa" },
  { "chartId": "pie", "code": "p" },
  { "chartId": "pinMap", "code": "pi" },
  { "chartId": "radar", "code": "r" },
  { "chartId": "sankey", "code": "s" },
  { "chartId": "scatter", "code": "sc" },
  { "chartId": "treemap", "code": "t" },
  { "chartId": "venn", "code": "v" },
  { "chartId": "violin", "code": "vi" },
  { "chartId": "wordCloud", "code": "wc" }
]

## Chart Function Descriptions
area: "Generate a area chart to show data trends under continuous independent variables and observe the overall data trend, such as, displacement = velocity (average or instantaneous) × time: s = v × t. If the x-axis is time (t) and the y-axis is velocity (v) at each moment, an area chart allows you to observe the trend of velocity over time and infer the distance traveled by the area's size."

bar: "Generate a horizontal bar chart to show data for numerical comparisons among different categories, such as, comparing categorical data and for horizontal comparisons."

boxplot: "Generate a boxplot chart to show data for statistical summaries among different categories, such as, comparing the distribution of data points across categories."

column: "Generate a column chart, which are best for comparing categorical data, such as, when values are close, column charts are preferable because our eyes are better at judging height than other visual elements like area or angles."

districtMap: "Generates regional distribution maps, which are usually used to show the administrative divisions and coverage of a dataset. It is not suitable for showing the distribution of specific locations, such as urban administrative divisions, GDP distribution maps of provinces and cities across the country, etc. This tool is limited to generating data maps within China."

dualAxes: "Generate a dual axes chart which is a combination chart that integrates two different chart types, typically combining a bar chart with a line chart to display both the trend and comparison of data, such as, the trend of sales and profit over time."

fishboneDiagram: "Generate a fishbone diagram chart to uses a fish skeleton, like structure to display the causes or effects of a core problem, with the problem as the fish head and the causes/effects as the fish bones. It suits problems that can be split into multiple related factors."

flowDiagram: "Generate a flow diagram chart to show the steps and decision points of a process or system, such as, scenarios requiring linear process presentation."

funnel: "Generate a funnel chart to visualize the progressive reduction of data as it passes through stages, such as, the conversion rates of users from visiting a website to completing a purchase."

histogram: "Generate a histogram chart to show the frequency of data points within a certain range. It can observe data distribution, such as, normal and skewed distributions, and identify data concentration areas and extreme points."

line: "Generate a line chart to show trends over time, such as, the ratio of Apple computer sales to Apple's profits changed from 2000 to 2016."

liquid: "Generate a liquid chart to visualize a single value as a percentage, such as, the current occupancy rate of a reservoir or the completion percentage of a project."

mindMap: "Generate a mind map chart to organizes and presents information in a hierarchical structure with branches radiating from a central topic, such as, a diagram showing the relationship between a main topic and its subtopics."

networkGraph: "Generate a network graph chart to show relationships (edges) between entities (nodes), such as, relationships between people in social networks."

organizationChart: "Generate an organization chart to visualize the hierarchical structure of an organization, such as, a diagram showing the relationship between a CEO and their direct reports."

pathMap: "Generate a route map to display the user's planned route, such as travel guide routes."

pie: "Generate a pie chart to show the proportion of parts, such as, market share and budget allocation."

pinMap: "Generate a point map to display the location and distribution of point data on the map, such as the location distribution of attractions, hospitals, supermarkets, etc."

radar: "Generate a radar chart to display multidimensional data (four dimensions or more), such as, evaluate Huawei and Apple phones in terms of five dimensions: ease of use, functionality, camera, benchmark scores, and battery life."

sankey: "Generate a sankey chart to visualize the flow of data between different stages or categories, such as, the user journey from landing on a page to completing a purchase."

scatter: "Generate a scatter chart to show the relationship between two variables, helps discover their relationship or trends, such as, the strength of correlation, data distribution patterns."

treemap: "Generate a treemap chart to display hierarchical data and can intuitively show comparisons between items at the same level, such as, show disk space usage with treemap."

venn: "Generate a Venn diagram to visualize the relationships between different sets, showing how they intersect and overlap, such as the commonalities and differences between various groups."

violin: "Generate a violin chart to show data for statistical summaries among different categories, such as, comparing the distribution of data points across categories."

wordCloud: "Generate a word cloud chart to show word frequency or weight through text size variation, such as, analyzing common words in social media, reviews, or feedback."


Please complete the chart recommendation based on the following input, strictly following the above “Constraints & Rules”, “Thinking Process”, and “Response Format”:

data: [{"date":"1999","value":9},{"date":"2000","value":2},{"date":"2001","value":3},{"date":"2002","value":5},{"date":"2003","value":9}]

meta: [{"id":"date","name":"date","dataType":"date","allData":["1999","2000","2001","2002","2003"],"statisticsFeature":{"name":"date","count":5,"distinct":5,"types":["date"],"recommendation":"date","missing":0,"rawData":["1999","2000","2001","2002","2003"],"valueMap":{"1999":1,"2000":1,"2001":1,"2002":1,"2003":1},"minimum":"1999","maximum":"2003","interval":"minute","levelOfMeasurements":["Time"]}},{"id":"value","name":"value","dataType":"number","allData":[9,2,3,5,9],"statisticsFeature":{"name":"value","count":5,"distinct":4,"types":["number"],"recommendation":"number","missing":0,"rawData":[9,2,3,5,9],"valueMap":{"2":1,"3":1,"5":1,"9":2},"minimum":2,"maximum":9,"mean":5.6,"percentile5":2,"percentile25":3,"percentile50":5,"percentile75":9,"percentile95":9,"sum":28,"variance":8.64,"standardDeviation":2.939387691339814,"zeros":0,"levelOfMeasurements":["Interval","Discrete","Continuous"]}}]

purpose: "View trend"