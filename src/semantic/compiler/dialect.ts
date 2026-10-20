import type { SemanticAggregation, SemanticDialectName } from '../types';

/** Dialect-specific SQL rendering used by the SMQ compiler. */
export interface SQLDialect {
  readonly name: SemanticDialectName;
  quoteIdentifier(identifier: string): string;
  quoteString(value: string): string;
  aggregate(agg: SemanticAggregation, argument?: string): string;
}

function dialect(name: SemanticDialectName, quote: string, escapeBackslash: boolean): SQLDialect {
  return {
    name,
    quoteIdentifier: (identifier) => `${quote}${identifier.split(quote).join(quote + quote)}${quote}`,
    quoteString: (value) => {
      const escaped = (escapeBackslash ? value.replace(/\\/g, '\\\\') : value).replace(/'/g, "''");
      return `'${escaped}'`;
    },
    aggregate: (agg, argument) => {
      if (agg === 'count') return `COUNT(${argument ?? '*'})`;
      if (!argument) throw new Error(`Aggregation "${agg}" requires a column or expression`);
      if (agg === 'count_distinct') return `COUNT(DISTINCT ${argument})`;
      return `${agg.toUpperCase()}(${argument})`;
    },
  };
}

/** GoogleSQL uses backslash escapes for both quoted identifiers and string literals. */
function googleQuote(value: string, quote: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    // eslint-disable-next-line no-control-regex -- GoogleSQL quoted literals cannot contain raw control characters.
    .replace(/[\x00-\x1f\x7f]/g, (character) => `\\x${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
    .split(quote)
    .join(`\\${quote}`);
  return `${quote}${escaped}${quote}`;
}

const dialects: Record<SemanticDialectName, SQLDialect> = {
  duckdb: dialect('duckdb', '"', false),
  postgresql: dialect('postgresql', '"', false),
  ansi: dialect('ansi', '"', false),
  clickhouse: dialect('clickhouse', '"', true),
  mysql: dialect('mysql', '`', true),
  sqlite: dialect('sqlite', '"', false),
  bigquery: {
    ...dialect('bigquery', '`', true),
    quoteIdentifier: (value) => googleQuote(value, '`'),
    quoteString: (value) => googleQuote(value, "'"),
  },
  snowflake: dialect('snowflake', '"', true),
};

/** Get a dialect by name. */
export function getDialect(name: SemanticDialectName): SQLDialect {
  const found = dialects[name];
  if (!found) throw new Error(`Unsupported SQL dialect: ${name}`);
  return found;
}

/** Infer a dialect from an engine's language name (e.g. "DuckDB SQL"); defaults to DuckDB. */
export function inferDialect(languageName?: string): SemanticDialectName {
  const name = (languageName ?? '').toLowerCase();
  if (name.includes('clickhouse')) return 'clickhouse';
  if (name.includes('postgres')) return 'postgresql';
  if (name.includes('mysql')) return 'mysql';
  if (name.includes('sqlite')) return 'sqlite';
  if (name.includes('bigquery')) return 'bigquery';
  if (name.includes('snowflake')) return 'snowflake';
  if (!name || name.includes('duckdb')) return 'duckdb';
  if (name.includes('ansi')) return 'ansi';
  throw new Error(`Cannot infer a semantic SQL dialect from "${languageName}". Set semantic.dialect explicitly.`);
}
