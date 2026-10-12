"""Isolated bridge to the unmodified, fingerprinted upstream Spider2-Lite scorer.

stdin/stdout are JSON. Upstream logs and its TeeOutput side effect stay in a
per-call temporary directory. No cloud connection is made by this bridge.
"""
import contextlib
import importlib.util
import inspect
import json
import os
from pathlib import Path
import sqlite3
import sys
import tempfile


def load_evaluator(path):
    original_out, original_err = sys.stdout, sys.stderr
    try:
        spec = importlib.util.spec_from_file_location('spider2_official', path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    finally:
        if sys.stdout is not original_out and hasattr(sys.stdout, 'close'):
            sys.stdout.close()
        sys.stdout, sys.stderr = original_out, original_err
    for name in ('evaluate_single_sql_instance', 'evaluate_single_exec_result_instance', 'compare_pandas_table', 'compare_multi_pandas_table'):
        if not callable(getattr(module, name, None)):
            raise RuntimeError('Unsupported official evaluator: missing ' + name)
    if 'sqlite_base_dir' not in inspect.signature(module.evaluate_single_sql_instance).parameters:
        raise RuntimeError('Unsupported official SQL evaluator signature; pin a compatible revision')
    return module


def validate_sql(db, sql):
    # The official scorer uses an in-memory backup. Validate first to prevent SQL
    # from using ATTACH, PRAGMA, writes or extension/file access in that process.
    def authorizer(action, arg1, arg2, database, trigger):
        if action == sqlite3.SQLITE_FUNCTION:
            return sqlite3.SQLITE_DENY if (arg2 or '').lower() in ('load_extension', 'readfile', 'writefile') else sqlite3.SQLITE_OK
        return sqlite3.SQLITE_OK if action in (sqlite3.SQLITE_READ, sqlite3.SQLITE_SELECT, sqlite3.SQLITE_RECURSIVE) else sqlite3.SQLITE_DENY

    db = Path(db).resolve(strict=True)
    connection = sqlite3.connect(db.as_uri() + '?mode=ro', uri=True)
    try:
        connection.execute('PRAGMA query_only=ON')
        connection.execute('PRAGMA trusted_schema=OFF')
        if hasattr(connection, 'enable_load_extension'):
            connection.enable_load_extension(False)
        connection.set_authorizer(authorizer)
        connection.execute('EXPLAIN ' + sql).fetchall()  # also rejects multiple statements
    finally:
        connection.close()


def main(request):
    root = Path(request['root']).resolve()
    with tempfile.TemporaryDirectory(prefix='ava-spider-score-') as temporary:
        previous = os.getcwd()
        os.chdir(temporary)
        try:
            module = load_evaluator(root / 'evaluation_suite/evaluate.py')
            if request['action'] == 'check':
                import pandas
                return {'python': sys.version.split()[0], 'sqlite': sqlite3.sqlite_version, 'pandas': pandas.__version__}
            sample = request['sample']
            iid = sample['instance_id']
            standards = module.load_jsonl_to_dict(str(root / 'evaluation_suite/gold/spider2lite_eval.jsonl'))
            gold = str(root / 'evaluation_suite/gold/exec_result')
            predictions = request['predictions']
            with contextlib.redirect_stdout(sys.stderr):
                if request['mode'] == 'sql':
                    sql = module.extract_sql_query((Path(predictions) / (iid + '.sql')).read_text())
                    validate_sql(root / 'resource/databases/spider2-localdb' / (sample['db'] + '.sqlite'), sql)
                    result = module.evaluate_single_sql_instance(
                        iid, standards, {iid: sample}, predictions, gold,
                        temp_dir=Path(temporary), result_csv_dir=request['results'],
                        sqlite_base_dir=root / 'resource/databases/spider2-localdb',
                    )
                else:
                    result = module.evaluate_single_exec_result_instance(iid, standards, predictions, gold)
            return result
        finally:
            os.chdir(previous)


if __name__ == '__main__':
    try:
        print(json.dumps(main(json.load(sys.stdin)), ensure_ascii=False))
    except Exception as error:
        print(json.dumps({'bridge_error': str(error)}, ensure_ascii=False))
        sys.exit(1)
