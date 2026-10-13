"""Compare AVA results with SQLite gold using BIRD's exact row-set rule.

Reference: AlibabaResearch/DAMO-ConvAI, bird/llm/src/evaluation.py, execute_sql.
This scores DuckDB results, not SQL re-executed by the official SQLite runner.
"""
import json
import re
import sqlite3
import sys
from pathlib import Path


def compare(request):
    if sqlite3.sqlite_version_info < (3, 39, 0):
        raise RuntimeError(
            f'BIRD New Dev requires SQLite 3.39+, found {sqlite3.sqlite_version}. '
            'Use --python with a newer Python/SQLite runtime or create evals/BIRD/.venv.'
        )
    if request.get('action') == 'check':
        return {'python': sys.version.split()[0], 'sqlite': sqlite3.sqlite_version}
    payload = json.loads(Path(request['prediction']).read_text())
    schema = payload['schema']
    rows = payload['rows']
    if not isinstance(rows, list) or any(len(row) != len(schema) for row in rows):
        raise ValueError('Invalid prediction dimensions')
    predicted = []
    for row in rows:
        cells = []
        for cell, column in zip(row, schema):
            if not isinstance(cell, (str, int, float, bool, type(None))):
                raise ValueError('Unsupported prediction cell')
            # DuckDB keeps integers outside JavaScript's safe range as strings.
            if isinstance(cell, str) and re.fullmatch(r'U?(TINYINT|SMALLINT|INTEGER|BIGINT|HUGEINT)', column.get('type', ''), re.I):
                cell = int(cell)
            elif isinstance(cell, str) and re.fullmatch(r'FLOAT|DOUBLE|REAL|DECIMAL(?:\(.*\))?', column.get('type', ''), re.I):
                cell = float(cell)
            cells.append(cell)
        predicted.append(tuple(cells))
    uri = Path(request['database']).resolve().as_uri() + '?mode=ro'
    with sqlite3.connect(uri, uri=True) as connection:
        connection.execute('PRAGMA query_only = ON')
        allowed = {sqlite3.SQLITE_SELECT, sqlite3.SQLITE_READ, sqlite3.SQLITE_FUNCTION, sqlite3.SQLITE_RECURSIVE}
        connection.set_authorizer(lambda action, *args: sqlite3.SQLITE_OK if action in allowed else sqlite3.SQLITE_DENY)
        gold = connection.execute(request['sql']).fetchall()
    return {'score': int(set(predicted) == set(gold))}


if __name__ == '__main__':
    try:
        print(json.dumps(compare(json.load(sys.stdin))))
    except Exception as error:
        print(json.dumps({'error': str(error)}))
        sys.exit(1)
