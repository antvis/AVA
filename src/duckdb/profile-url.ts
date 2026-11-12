import { sqlStringLiteral } from '../util/sql';

const components = ['scheme', 'netloc', 'path', 'query', 'fragment'];
const pattern = sqlStringLiteral('^(?:([a-zA-Z][a-zA-Z0-9+.-]*):)?(?://([^/?#]*))?([^?#]*)(?:\\?([^#]*))?(?:#(.*))?$');
const leadingControl = sqlStringLiteral('^[\\x{0000}-\\x{0020}]+');
const asciiWhitespace = sqlStringLiteral('[\\t\\r\\n]');

export function urlSummarySql(table: string, column: string): string {
  const normalized = `regexp_replace(regexp_replace(value, ${leadingControl}, ''), ${asciiWhitespace}, '', 'g')`;
  const fields = `[${components.map(sqlStringLiteral).join(', ')}]`;
  const distribution = components.map(
    (part) => `${part}_counts := coalesce(
    list(struct_pack(value := value, count := count) ORDER BY count DESC, value)
      FILTER (WHERE component = ${sqlStringLiteral(part)}), [])`
  );
  return `first((WITH weighted AS (
    SELECT CAST(${column} AS VARCHAR) AS value, count(*) AS weight
    FROM ${table} WHERE ${column} IS NOT NULL GROUP BY 1
  ), parsed AS (
    SELECT unnest(regexp_extract(${normalized}, ${pattern}, ${fields})), weight FROM weighted
  ), parts AS (
    SELECT lower(scheme) AS scheme, netloc, path, query, fragment, weight FROM parsed
  ), unpivoted AS (
    UNPIVOT parts ON ${components.join(', ')} INTO NAME component VALUE value
  ), frequencies AS (
    SELECT component, value, sum(weight)::DOUBLE AS count FROM unpivoted GROUP BY 1, 2
  ) SELECT struct_pack(${distribution.join(', ')}) FROM frequencies))`;
}
