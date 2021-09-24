export function translate(term: string): string {
  // map to G2Ploterm names
  if (term === 'GroupedBar') return 'GroupBar';
  if (term === 'MultiLine') return 'Line';
  if (term === 'StackedBar') return 'StackBar';
  if (term === 'PercentageStackedBar') return 'PercentageStackBar';
  if (term === 'GroupedColumn') return 'GroupColumn';
  if (term === 'StackedColumn') return 'StackColumn';
  if (term === 'PercentageStackedColumn') return 'PercentageStackColumn';
  if (term === 'Donut') return 'Ring';
  if (term === 'StackedArea') return 'StackArea';
  if (term === 'PercentageStackedArea') return 'PercentageStackArea';
  return term;
}
