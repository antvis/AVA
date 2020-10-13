import { CHART_ID_OPTIONS, ChartID } from '@antv/knowledge';
import Rules, { Rule } from '../rules';
import { specMapping } from './spec-mapping';
import { AdvisorOptions, FieldInfo, Advice } from './interface';

function scoreRules(chartType: ChartID, dataProps: FieldInfo[], options?: AdvisorOptions, showLog = false) {
  const purpose = options ? options.purpose : '';
  const preferences = options ? options.preferences : undefined;

  // for log
  const record: Record<string, number> = {};

  let hardScore = 1;
  Rules.filter((r: Rule) => r.hardOrSoft === 'HARD' && r.specChartTypes.includes(chartType)).forEach((hr: Rule) => {
    const score = hr.check({ dataProps, chartType, purpose, preferences });
    hardScore *= score;
    record[hr.id] = score;
  });

  let softScore = 0;
  Rules.filter((r: Rule) => r.hardOrSoft === 'SOFT' && r.specChartTypes.includes(chartType)).forEach((sr: Rule) => {
    const score = sr.check({ dataProps, chartType, purpose, preferences });
    softScore += score;
    record[sr.id] = score;
  });

  const score = hardScore * (1 + softScore);

  if (showLog) console.log('💯score: ', score, '=', hardScore, '* (1 +', softScore, ') ;charttype: ', chartType);
  if (showLog) console.log(record);

  return score;
}

/**
 * @beta
 */
export function dataPropsToSpecs(dataProps: FieldInfo[], options?: AdvisorOptions, showLog = false) {
  // score every
  const list: Advice[] = CHART_ID_OPTIONS.map((t) => {
    // step 1: analyze score by rule
    const score = scoreRules(t, dataProps, options, showLog);
    if (score <= 0) return { type: t, spec: null, score };

    // step 2: field mapping to spec encoding
    const spec = specMapping(t, dataProps);
    if (!spec) return { type: t, spec: null, score: 0 };

    return { type: t, spec, score };
  });

  function compareAdvices(chart1: Advice, chart2: Advice) {
    if (chart1.score < chart2.score) {
      return 1;
    } else if (chart1.score > chart2.score) {
      return -1;
    } else {
      return 0;
    }
  }

  // filter and sorter
  const resultList = list.filter((e) => e.score > 0).sort(compareAdvices);

  if (showLog) console.log('🍒🍒🍒🍒🍒🍒 resultList 🍒🍒🍒🍒🍒🍒');
  if (showLog) console.log(resultList);

  return resultList;
}
