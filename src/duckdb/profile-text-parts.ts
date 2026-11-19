import { sqlStringLiteral } from '../util/sql';

const urlComponents = ['scheme', 'netloc', 'path', 'query', 'fragment'];
const pathComponents = ['stem', 'suffix', 'name', 'parent', 'anchor'];
const pattern = sqlStringLiteral('^(?:([a-zA-Z][a-zA-Z0-9+.-]*):)?(?://([^/?#]*))?([^?#]*)(?:\\?([^#]*))?(?:#(.*))?$');
const leadingControl = sqlStringLiteral('^[\\x{0000}-\\x{0020}]+');
const asciiWhitespace = sqlStringLiteral('[\\t\\r\\n]');

function normalizeUrl(value: string) {
  return `regexp_replace(regexp_replace(${value}, ${leadingControl}, ''), ${asciiWhitespace}, '', 'g')`;
}

export function isUrlSql(value: string) {
  return `regexp_matches(${normalizeUrl(value)}, '^[a-zA-Z][a-zA-Z0-9+.-]*://[^/?#]+')`;
}

function componentSummarySql(
  table: string,
  column: string,
  components: string[],
  parts: string,
  extras: string[] = []
) {
  const distribution = components.map(
    (part) => `${part}_counts := coalesce(
    list(struct_pack(value := value, count := count) ORDER BY count DESC, value)
      FILTER (WHERE component = ${sqlStringLiteral(part)}), [])`
  );
  return `first((WITH weighted AS (
    SELECT CAST(${column} AS VARCHAR) AS value, count(*) AS weight
    FROM ${table} WHERE ${column} IS NOT NULL GROUP BY 1
  ), parts AS (${parts}), unpivoted AS (
    UNPIVOT parts ON ${components.join(', ')} INTO NAME component VALUE value
  ), frequencies AS (
    SELECT component, value, sum(weight)::DOUBLE AS count FROM unpivoted GROUP BY 1, 2
  ) SELECT struct_pack(${[...distribution, ...extras].join(', ')}) FROM frequencies))`;
}

export function urlSummarySql(table: string, column: string): string {
  const normalized = normalizeUrl('value');
  const fields = `[${urlComponents.map(sqlStringLiteral).join(', ')}]`;
  const parts = `SELECT lower(scheme) AS scheme, netloc, path, query, fragment, weight
    FROM (SELECT unnest(regexp_extract(${normalized}, ${pattern}, ${fields})), weight FROM weighted) parsed`;
  return componentSummarySql(table, column, urlComponents, parts);
}

export function pathSummarySql(table: string, column: string): string {
  const suffix = sqlStringLiteral('(?s)[^.].*(\\.[^.]*)$');
  const parent = sqlStringLiteral('(?s)^(.*[/])[^/]*$');
  const parts = `SELECT left(value, length(value) - length(suffix)) AS stem, suffix, name,
    CASE WHEN regexp_full_match(head, '/+') THEN head ELSE rtrim(head, '/') END AS parent,
    '' AS anchor, weight
    FROM (SELECT *, regexp_extract(name, ${suffix}, 1) AS suffix FROM (
      SELECT value, weight, regexp_extract(value, '[^/]*$') AS name,
        regexp_extract(value, ${parent}, 1) AS head FROM weighted
    ) names) parsed`;
  const length = 'least(length(lo), length(hi))';
  const prefix = `common_prefix := (SELECT coalesce(nullif(left(lo, coalesce(
      list_min(list_filter(range(1, ${length} + 1), lambda i: substr(lo, i, 1) <> substr(hi, i, 1))) - 1,
      ${length})), ''), 'No common prefix')
    FROM (SELECT min(value) AS lo, max(value) AS hi FROM weighted) bounds)`;
  const uniqueCounts = pathComponents.map(
    (part) => `n_${part}_unique := (count(*) FILTER (WHERE component = ${sqlStringLiteral(part)}))::DOUBLE`
  );
  return componentSummarySql(table, column, pathComponents, parts, [prefix, ...uniqueCounts]);
}
