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

const dialects: Record<SemanticDialectName, SQLDialect> = {
  duckdb: dialect('duckdb', '"', false),
  postgresql: dialect('postgresql', '"', false),
  ansi: dialect('ansi', '"', false),
  clickhouse: dialect('clickhouse', '"', true),
  mysql: dialect('mysql', '`', true),
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
  return 'duckdb';
}
