"""Isolated bridge to the unmodified, fingerprinted upstream Spider2-Lite scorer.

stdin/stdout are JSON. Upstream logs and its TeeOutput side effect stay in a
per-call temporary directory. No cloud connection is made by this bridge.
"""
import contextlib
import importlib.util
import json
import os
from pathlib import Path
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
    if not callable(getattr(module, 'evaluate_single_exec_result_instance', None)):
        raise RuntimeError('Unsupported official CSV evaluator')
    return module


def main(request):
    root = Path(request['root']).resolve()
    with tempfile.TemporaryDirectory(prefix='ava-spider-score-') as temporary:
        previous = os.getcwd()
        os.chdir(temporary)
        try:
            module = load_evaluator(root / 'evaluation_suite/evaluate.py')
            if request['action'] == 'check':
                import pandas
                return {'python': sys.version.split()[0], 'pandas': pandas.__version__}
            iid = request['instance_id']
            standards = module.load_jsonl_to_dict(str(root / 'evaluation_suite/gold/spider2lite_eval.jsonl'))
            gold = str(root / 'evaluation_suite/gold/exec_result')
            predictions = request['predictions']
            with contextlib.redirect_stdout(sys.stderr):
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
