import type { DataSourceConfig, ExecutionOptions } from '../../types';

/** Generate only the loader needed for this source. */
function sourceCode(source: DataSourceConfig): string {
  switch (source.type) {
    case 'json':
      return "tables = {'data': pd.DataFrame(options['data'])}";
    case 'json-file':
      return "tables = {'data': pd.read_json(options['path'], orient='records', storage_options=options.get('headers') or None)}";
    case 'excel':
      return "tables = pd.read_excel(options['path'], sheet_name=None, storage_options=options.get('headers') or None)";
    case 'parquet':
      return "tables = {'data': pd.read_parquet(options['path'], storage_options=options.get('headers') or None)}";
    case 'csv':
    case 'csv-file': {
      const read = source.options.options ?? {};
      const csv = {
        sep: read.delim,
        quotechar: read.quote,
        comment: read.comment,
        skiprows: read.skip,
        na_values: read.nullstr,
        decimal: read.decimal_separator,
        thousands: read.thousands,
        encoding: read.encoding,
        names: read.names,
        header: read.header === false || (read.names !== undefined && read.header !== true) ? null : 0,
        keep_default_na: read.nullstr === undefined ? undefined : false,
        dtype: read.all_varchar ? 'str' : undefined,
        compression: read.compression === 'none' ? null : read.compression,
        doublequote: read.escape === undefined ? undefined : read.escape === (read.quote ?? '"'),
        escapechar: read.escape === (read.quote ?? '"') ? undefined : read.escape,
        storage_options: source.type === 'csv-file' ? source.options.headers : undefined,
      };
      const input = source.type === 'csv' ? "io.StringIO(options['csv'])" : "options['path']";
      return `tables = {'data': pd.read_csv(${input}, **json.loads(${JSON.stringify(JSON.stringify(csv))}))}`;
    }
    default:
      throw new Error(`Unsupported Python source type: ${source.type}`);
  }
}

/** Assemble source loading, analysis and bounded JSON output into one executable script. */
export function executionCode(code: string, source: DataSourceConfig, limits: ExecutionOptions): string {
  return String.raw`import io
import pandas as pd
import contextlib
import json
import sys

request = json.loads(${JSON.stringify(JSON.stringify({ code, options: source.options, limits }))})

# Keep prints out of the JSON response channel.
with contextlib.redirect_stdout(sys.stderr):
    options = request['options']
    ${sourceCode(source)}

    for frame in tables.values():
        frame.columns = frame.columns.map(str)
        if not frame.columns.is_unique:
            raise ValueError('Column names must be unique after conversion to strings')

    namespace = {'pd': pd, 'tables': tables}
    if len(tables) == 1:
        namespace['df'] = next(iter(tables.values()))

    exec(request['code'], namespace)
    if 'result' not in namespace:
        raise ValueError('Python code must assign its output to result')
    result = namespace['result']
    if isinstance(result, pd.Series):
        frame = result.to_frame(name=str(result.name) if result.name is not None else 'value')
    elif isinstance(result, pd.DataFrame):
        frame = result
    elif isinstance(result, dict):
        frame = pd.DataFrame([result])
    elif isinstance(result, list):
        frame = pd.DataFrame(result) if all(isinstance(row, dict) for row in result) else pd.DataFrame({'value': result})
    else:
        frame = pd.DataFrame({'value': [result]})

    frame.columns = frame.columns.map(str)
    if not frame.columns.is_unique:
        raise ValueError('Result column names must be unique')
    limits = request['limits']
    rows = json.loads(frame.head(limits['maxRows']).to_json(
        orient='records', date_format='iso', double_precision=2
    ))
    output = {'schema': [{'name': name, 'type': str(dtype)} for name, dtype in frame.dtypes.items()], 'data': []}
    size = 0
    reason = None
    for row in rows:
        encoded = json.dumps(row, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        if any(len(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode('utf-8')) > 1024 * 1024 for value in row.values()):
            raise ValueError('Result field exceeds the 1 MiB limit')
        if size + len(encoded) > limits['maxResultBytes']:
            reason = 'maxResultBytes'
            break
        output['data'].append(row)
        size += len(encoded)
    if reason is None and len(frame) > limits['maxRows']:
        reason = 'maxRows'
    if reason:
        output.update(truncated=True, truncatedBy=reason)
    else:
        output['rowCount'] = len(output['data'])

json.dump(output, sys.stdout, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
`;
}
