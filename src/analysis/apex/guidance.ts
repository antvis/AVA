/** Independently written operation guidance; no benchmark-specific examples or answers. */
const RULES: [string, RegExp, string][] = [
  [
    'filter',
    /filter|where|equal|like|筛选|过滤/i,
    'Probe actual values, case, whitespace and encodings before fixing predicates. Distinguish exact matches from substring matches.',
  ],
  [
    'join',
    /join|relat|关联|连接/i,
    'Verify join keys, composite keys, unmatched rows and one-to-many multiplication. Choose join type from the question.',
  ],
  [
    'aggregate',
    /sum|avg|average|aggregate|group|count|汇总|平均|计数/i,
    'Verify the intended grain, grouping keys, NULL behavior and whether counts refer to rows or entities.',
  ],
  [
    'division',
    /divid|division|ratio|percent|rate|\/|比例|百分|除/i,
    'Check numeric types, integer division, zero denominators and the denominator population. Distinguish ratios from percentages.',
  ],
  [
    'ranking',
    /rank|top|bottom|highest|lowest|maximum|minimum|order|排名|最高|最低/i,
    'Inspect NULLs and ties. Choose RANK, DENSE_RANK, ROW_NUMBER or LIMIT according to tie and ordering requirements.',
  ],
  [
    'date',
    /date|time|year|month|day|日期|时间|年|月/i,
    'Inspect stored date formats, timezone and boundary values. Verify inclusive/exclusive bounds and calendar grouping.',
  ],
  [
    'null',
    /null|missing|empty|缺失|空值/i,
    'Distinguish SQL NULL, empty strings and sentinel values. Check how predicates and aggregates handle each.',
  ],
  [
    'distinct',
    /distinct|unique|duplicate|去重|唯一/i,
    'Verify entity identity and duplicate multiplicity before deduplicating or counting distinct values.',
  ],
  [
    'window',
    /window|over|partition|running|lag|lead|窗口|累计/i,
    'Check partition keys, ordering, ties and frame bounds; verify window output on a small partition.',
  ],
  [
    'nested',
    /json|array|unnest|flatten|嵌套|数组/i,
    'Inspect nested structure, element types, empty arrays and row multiplication before flattening.',
  ],
  [
    'set',
    /union|intersect|except|exists|not in|集合/i,
    'Verify set versus multiset semantics and NULL behavior in membership tests and anti-joins.',
  ],
  [
    'precision',
    /round|decimal|cast|precision|numeric|精度|转换/i,
    'Inspect numeric storage and cast failures. Preserve precision; round only when explicitly requested.',
  ],
];

export function retrieveGuidance(realizations: string, evidence: string): string[] {
  const selected = RULES.filter(([, pattern]) => pattern.test(realizations)).map(([id, , text]) => `${id}: ${text}`);
  if (evidence)
    selected.unshift(
      'evidence: Implement supplied formulas and mappings literally. Do not substitute similarly named precomputed measures for an explicit formula without verifying equivalence. Distinguish documentation from observed facts.'
    );
  return [
    'schema: Use only existing tables and columns. Field names do not prove business meaning.',
    'output: Match the requested columns, ordering, granularity and units; do not add arbitrary display limits.',
    ...selected,
  ];
}
