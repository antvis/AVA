"""Test executor source loading; production executors also enforce access limits."""

import io

import pandas as pd


def load_source(source):
    options = source['options']
    kind = source['type']
    csv = {}

    if kind in ('csv', 'csv-file'):
        read = options.get('options', {})
        names = {'delim': 'sep', 'quote': 'quotechar', 'comment': 'comment',
                 'skip': 'skiprows', 'nullstr': 'na_values',
                 'decimal_separator': 'decimal', 'thousands': 'thousands',
                 'encoding': 'encoding', 'names': 'names'}

        csv = {names[k]: v for k, v in read.items() if k in names}
        csv['header'] = 0 if read.get('header', True) else None

        if 'nullstr' in read:
            csv['keep_default_na'] = False

        if read.get('all_varchar'):
            csv['dtype'] = str

        if 'compression' in read:
            csv['compression'] = None if read['compression'] == 'none' else read['compression']

        if 'escape' in read:
            csv['doublequote'] = read['escape'] == read.get('quote', '"')
            if not csv['doublequote']:
                csv['escapechar'] = read['escape']

    if kind == 'csv':
        tables = {'data': pd.read_csv(io.StringIO(options['csv']), **csv)}
    elif kind == 'json':
        tables = {'data': pd.DataFrame(options['data'])}
    elif kind == 'csv-file':
        tables = {'data': pd.read_csv(options['path'], **csv, storage_options=options.get('headers') or None)}
    elif kind == 'json-file':
        tables = {'data': pd.read_json(options['path'], orient='records', storage_options=options.get('headers') or None)}
    elif kind == 'excel':
        tables = pd.read_excel(options['path'], sheet_name=None, storage_options=options.get('headers') or None)
    else:
        raise ValueError(f'Unsupported source type: {kind}')

    for frame in tables.values():
        frame.columns = frame.columns.map(str)
        if not frame.columns.is_unique:
            raise ValueError('Column names must be unique after conversion to strings')

    namespace = {'pd': pd, 'tables': tables}
    if len(tables) == 1:
        namespace['df'] = next(iter(tables.values()))

    return namespace
