import type { CSVReadOptions } from '../../src/types';

// Each tuple is checked against the current option's declared value type.
// Alternative union forms are covered separately in serializeOptions tests.
type CSVReadOptionCase = {
  [K in keyof CSVReadOptions]-?: [name: K, value: NonNullable<CSVReadOptions[K]>, sql: string];
}[keyof CSVReadOptions];

export const CSV_READ_OPTION_CASES: CSVReadOptionCase[] = [
  ['all_varchar', true, 'true'],
  ['allow_quoted_nulls', false, 'false'],
  ['auto_detect', false, 'false'],
  ['auto_type_candidates', ['BIGINT', 'VARCHAR'], "['BIGINT', 'VARCHAR']"],
  ['buffer_size', 65536, '65536'],
  ['columns', { code: 'VARCHAR' }, "{'code': 'VARCHAR'}"],
  ['comment', '#', "'#'"],
  ['compression', 'gzip', "'gzip'"],
  ['dateformat', '%d/%m/%Y', "'%d/%m/%Y'"],
  ['decimal_separator', ',', "','"],
  ['delim', ';', "';'"],
  ['encoding', 'gb18030', "'gb18030'"],
  ['escape', '"', "'\"'"],
  ['force_not_null', ['code'], "['code']"],
  ['files_to_sniff', -1, '-1'],
  ['filename', false, 'false'],
  ['header', false, 'false'],
  ['hive_partitioning', false, 'false'],
  ['ignore_errors', true, 'true'],
  ['max_line_size', 2097152, '2097152'],
  ['names', ['first', 'second'], "['first', 'second']"],
  ['new_line', '\\r\\n', "'\\r\\n'"],
  ['nullstr', ['NULL', 'NA'], "['NULL', 'NA']"],
  ['null_padding', true, 'true'],
  ['parallel', false, 'false'],
  ['quote', '"', "'\"'"],
  ['rejects_limit', 0, '0'],
  ['rejects_scan', 'scan_log', "'scan_log'"],
  ['rejects_table', 'error_log', "'error_log'"],
  ['sample_size', -1, '-1'],
  ['normalize_names', true, 'true'],
  ['skip', 0, '0'],
  ['store_rejects', true, 'true'],
  ['strict_mode', false, 'false'],
  ['thousands', ',', "','"],
  ['timestampformat', '%Y-%m-%d %H:%M:%S.%f', "'%Y-%m-%d %H:%M:%S.%f'"],
  ['types', { code: 'VARCHAR' }, "{'code': 'VARCHAR'}"],
  ['union_by_name', true, 'true'],
];
