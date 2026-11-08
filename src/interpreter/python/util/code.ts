import { excelRange } from '../../../util/excel';

import type { DataSourceConfig, ExecutionOptions } from '../../../contracts';

/** Generate only the loader needed for this source. */
function sourceCode(source: DataSourceConfig, protectedFile: boolean): string {
  const file = protectedFile ? '_file' : "options['path']";
  const storage = protectedFile ? '' : ", storage_options=options.get('headers') or None";
  switch (source.type) {
    case 'json':
      return "tables = {'data': pd.DataFrame(options['data'])}";
    case 'json-file':
      return `tables = {'data': pd.read_json(${file}, orient='records'${
        protectedFile ? ', compression=_compression' : storage
      })}`;
    case 'excel': {
      const selected = source.options.sheets?.map(({ sheet, range, header }) => {
        const bounds = range === undefined ? undefined : excelRange(range);
        return {
          sheet,
          read: {
            header: header === false ? null : 0,
            ...(bounds && {
              usecols: `${bounds.firstColumn}:${bounds.lastColumn}`,
              skiprows: bounds.firstRow - 1,
              nrows: bounds.lastRow - bounds.firstRow + (header === false ? 1 : 0),
            }),
          },
        };
      });
      return `with pd.ExcelFile(${file}${storage}) as workbook:
        selected = json.loads(${JSON.stringify(JSON.stringify(selected ?? null))})
        if selected is None:
            selected = [{'sheet': sheet, 'read': {'header': 0}} for sheet in workbook.sheet_names]
        tables = {sheet['sheet']: workbook.parse(sheet_name=sheet['sheet'], **sheet['read']) for sheet in selected}`;
    }
    case 'parquet':
      return `tables = {'data': pd.read_parquet(${file}${storage})}`;
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
        compression: protectedFile ? undefined : read.compression === 'none' ? null : read.compression,
        doublequote: read.escape === undefined ? undefined : read.escape === (read.quote ?? '"'),
        escapechar: read.escape === (read.quote ?? '"') ? undefined : read.escape,
        storage_options: source.type === 'csv-file' && !protectedFile ? source.options.headers : undefined,
      };
      const input = source.type === 'csv' ? "io.StringIO(options['csv'])" : file;
      return `tables = {'data': pd.read_csv(${input}${
        protectedFile ? ', compression=_compression' : ''
      }, **json.loads(${JSON.stringify(JSON.stringify(csv))}))}`;
    }
    default:
      throw new Error(`Unsupported Python source type: ${source.type}`);
  }
}

/** Run in the configured executor, including when that executor is remote. */
const protectedFileCode = `def _download_file(path, headers):
        from urllib.parse import urlsplit
        from urllib.request import HTTPRedirectHandler, Request, build_opener

        def _origin(url):
            parts = urlsplit(url)
            port = parts.port if parts.port is not None else (443 if parts.scheme == 'https' else 80)
            return (parts.scheme, parts.hostname, port)

        class _SameOriginRedirects(HTTPRedirectHandler):
            max_repeats = max_redirections = 20
            redirects = 0

            def redirect_request(self, req, fp, code, msg, response_headers, newurl):
                try:
                    if _origin(newurl) != _origin(path):
                        raise ValueError('Cross-origin redirects are not allowed for remote files with headers')
                    if self.redirects == 20:
                        raise ValueError('Remote file redirect limit exceeded (20)')
                    request = super().redirect_request(req, fp, code, msg, response_headers, newurl)
                except Exception:
                    fp.close()
                    raise
                self.redirects += 1
                return request

        with build_opener(_SameOriginRedirects()).open(Request(path, headers=headers)) as response:
            return response.read(), response.headers.get('Content-Encoding')

    _body, _encoding = _download_file(options['path'], options['headers'])
    _buffer = io.BytesIO(_body)
    _file = _buffer
    del _body
    if _encoding == 'gzip':
        from gzip import GzipFile
        _file = GzipFile(fileobj=_file)
        _compression = None
    else:
        compression = options.get('options', {}).get('compression', 'infer')
        if compression == 'none':
            compression = None
        _compression = pd.io.common.infer_compression(options['path'], compression)
    `;

/** Assemble source loading, analysis and bounded JSON output into one executable script. */
export function executionCode(code: string, source: DataSourceConfig, limits: ExecutionOptions): string {
  const protectedFile =
    'path' in source.options &&
    'headers' in source.options &&
    /^https?:\/\//i.test(source.options.path) &&
    Object.keys(source.options.headers ?? {}).length > 0;
  const load = sourceCode(source, protectedFile);
  const loadCode = protectedFile
    ? `${protectedFileCode}try:
        ${load.replace(/\n/g, '\n    ')}
    finally:
        _file.close()
        _buffer.close()
        del _file, _buffer`
    : load;
  return String.raw`import io
import pandas as pd
import contextlib
import json
import sys

request = json.loads(${JSON.stringify(JSON.stringify({ code, options: source.options, limits }))})

# Keep prints out of the JSON response channel.
with contextlib.redirect_stdout(sys.stderr):
    options = request['options']
    ${loadCode}

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
        orient='records', date_format='iso', double_precision=15
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
