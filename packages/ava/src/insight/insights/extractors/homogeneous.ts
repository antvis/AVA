import { groupBy, flatten } from 'lodash';

import { PATTERN_TYPES } from '../../constant';

import type {
  Measure,
  InsightInfo,
  InsightType,
  PatternInfo,
  PointPatternInfo,
  HomogeneousPatternInfo,
} from '../../types';

export type PatternCollection = Partial<Record<InsightType, PatternInfo[]>>;
type ScopePatternCollection = { key: string; patterns?: PatternInfo[] }[];

/**
 * homogeneous data pattern (HDP) represents a set of basic data patterns that share certain relations. HDP are identified by categorizing basic data patterns (within an HDP) into commonness(es) and exceptions considering inter-pattern similarity,
 */
function extractHomogeneousPatterns(collection: ScopePatternCollection, type: InsightType): HomogeneousPatternInfo[] {
  const homogeneousPatterns: HomogeneousPatternInfo[] = [];
  const scopeLength = collection.length;
  const validScopes = collection.filter((item) => item.patterns && item.patterns?.length > 0);
  if (validScopes.length > 1) {
    if (type === 'trend') {
      const parts = Object.values(groupBy(collection, 'patterns.0.trend')).sort((a, b) => b.length - a.length);
      if (
        parts.length === 2 &&
        parts[0][0]?.patterns?.length &&
        parts[0].length / scopeLength > 0.75 &&
        parts[1].length < 5
      ) {
        homogeneousPatterns.push({
          type: 'exception',
          insightType: type,
          childPatterns: flatten(validScopes.map((item) => item.patterns)) as PatternInfo[],
          commonSet: parts[0].map((item) => item.key),
          exceptions: parts[1].map((item) => item.key),
          significance: 1 - parts[1].length / scopeLength,
        });
      } else {
        parts.forEach((part) => {
          const ratio = part.length / scopeLength;
          if (ratio > 0.3 && part.length >= 3 && part[0]?.patterns) {
            const childPatterns = flatten(part.map((item) => item.patterns)) as PatternInfo[];
            if (childPatterns.length) {
              homogeneousPatterns.push({
                type: 'commonness',
                insightType: type,
                childPatterns,
                commonSet: part.map((item) => item.key),
                significance: ratio,
              });
            }
          }
        });
      }
    }
    if (['change_point', 'outlier', 'time_series_outlier'].includes(type)) {
      const commonSetIndexes = Object.values(
        groupBy(flatten(validScopes.map((item) => (item.patterns as PointPatternInfo[]).map((item) => item.index))))
      ).sort((a, b) => b.length - a.length);
      commonSetIndexes.forEach((indexArr) => {
        const ratio = indexArr.length / scopeLength;
        if (ratio > 0.3 && indexArr.length >= 3) {
          const scopes = validScopes.filter((item) =>
            (item.patterns as PointPatternInfo[]).some((item) => item.index === indexArr[0])
          );
          const childPatterns = flatten(
            scopes.map((item) => (item.patterns as PointPatternInfo[]).filter((item) => item.index === indexArr[0]))
          ) as PatternInfo[];
          homogeneousPatterns.push({
            type: 'commonness',
            insightType: type,
            childPatterns,
            commonSet: scopes.map((item) => item.key),
            significance: ratio,
          });
        }
      });
    }
  }
  return homogeneousPatterns;
}

export function extractHomogeneousPatternsForMeasures(
  measures: Measure[],
  insightsCollection: (InsightInfo<PatternInfo> | null)[]
): HomogeneousPatternInfo[] {
  const series = measures.map((item) => item.fieldName);
  const patternsForAllMeasures = insightsCollection.map((item) => item?.patterns);
  const homogeneousPatterns: HomogeneousPatternInfo[] = [];
  PATTERN_TYPES.forEach((type) => {
    const patternCollection = patternsForAllMeasures.map((item, index) => ({
      key: series[index],
      patterns: item?.filter((item) => item.type === type),
    }));

    const patterns = extractHomogeneousPatterns(patternCollection, type);

    homogeneousPatterns.push(...patterns);
  });
  return homogeneousPatterns;
}

export function extractHomogeneousPatternsForSiblingGroups(
  siblingItems: string[],
  insightsCollection: (InsightInfo<PatternInfo> | null)[]
): HomogeneousPatternInfo[] {
  const groupLength = insightsCollection.length;
  if (siblingItems.length !== groupLength) return [];
  const patternsForSiblingGroup = insightsCollection.map((item) => item?.patterns);
  const homogeneousPatterns: HomogeneousPatternInfo[] = [];
  PATTERN_TYPES.forEach((type) => {
    const patternCollection = patternsForSiblingGroup.map((arr, index) => ({
      key: siblingItems[index],
      patterns: arr?.filter((item) => item.type === type),
    }));
    const patterns = extractHomogeneousPatterns(patternCollection, type);
    homogeneousPatterns.push(...patterns);
  });
  return homogeneousPatterns;
}
