"""Export the nine completed New Dev direct/loop jobs without rescoring.

Run from any directory: python3 evals/BIRD/export-merged-reports.py
"""
import hashlib
import json
import math
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'evals/reports/BIRD/newdev-20261012-merged'
BATCHES = [('direct', 'bird-newdev-five-direct-20261012', 3),
           ('loop', 'bird-newdev-five-loop-20261013', 2)]


def read(path):
    return json.loads(path.read_text())


def timestamp(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


def usage(records):
    result = {'attempts': len(records), 'scope': 'Recorded callbacks only; unavailable usage is not zero. Includes replaced attempts; auxiliary selector usage may be excluded.'}
    for key in ('inputTokens', 'outputTokens', 'totalTokens', 'calls'):
        values = [(r.get('usage') or {}).get(key) for r in records]
        values = [v for v in values if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) and v >= 0]
        result[key] = {'sum': sum(values) if values else None,
                       'recordedAttempts': len(values), 'missingAttempts': len(records) - len(values)}
    return result


def build_reports():
    exports = []
    for strategy, batch_name, rounds in BATCHES:
        batch = ROOT / '.debug' / batch_name
        for job in read(batch / 'jobs.json'):
            # This export intentionally captures the nine jobs completed at the user's request.
            if strategy == 'loop' and job['model'] == 'GLM-5.3':
                continue
            directory, output = Path(job['dir']), Path(job['output'])
            state = read(directory / f'retry-{rounds}.json')
            assert state['state'] == 'completed', (job['model'], state['state'])
            assert not (output / '.run.lock').exists(), output
            manifest, report = read(output / 'manifest.json'), read(output / 'report.json')
            records = [read(p) for p in sorted((output / 'records').glob('*.json'))]
            expected = set(map(str, manifest['ids']))
            assert len(expected) == len(manifest['ids']) == report['total'] == 1534
            for rows in (records, report['items']):
                assert len(rows) == 1534 and {str(r['question_id']) for r in rows} == expected
            assert manifest['datasetVersion'] == 'dev_20251106'
            assert manifest['model'] == job['model'] and manifest['strategy']['type'] == strategy
            assert manifest['concurrency'] == job['concurrency'] and manifest['profile'] is False
            assert manifest['thinking'] is False and 'database_description' in manifest['modelContext']
            scores = Counter(item['status'] for item in report['items'])
            assert scores['passed'] == report['passed']
            assert abs(report['accuracy'] - report['passed'] / 1534) < 1e-12
            attempts = list(records)
            history = []
            for number in range(1, rounds + 1):
                retry = read(directory / f'retry-{number}.json')
                assert retry['state'] == 'completed'
                before = output / f'retry-{number}-before'
                previous = read(before / 'report.json')
                replaced = [read(p) for p in sorted((before / 'records').glob('*.json'))]
                assert len(replaced) == len(retry['ids'])
                assert {str(r['question_id']) for r in replaced} == set(map(str, retry['ids']))
                attempts.extend(replaced)
                history.append({'round': number, 'scope': retry['scope'],
                                'retried': len(replaced), 'beforePassed': previous['passed'],
                                'afterPassed': retry['passed']})
            start = read(directory / 'status.json')['startedAt']
            elapsed = (timestamp(state['endedAt']) - timestamp(start)).total_seconds()
            filename = f"{strategy}-{job['model'].lower()}.json"
            exported = dict(report)
            exported.update({
                'exportedAt': datetime.now(timezone.utc).isoformat(),
                'evaluation': {key: manifest[key] for key in (
                    'model', 'concurrency', 'datasetVersion', 'strategy', 'thinking',
                    'profile', 'descriptionScope', 'modelContext', 'runtime', 'scoreTimeoutMs')},
                'provenance': {
                    'sourceReport': str((output / 'report.json').relative_to(ROOT)),
                    'sourceReportSha256': hashlib.sha256((output / 'report.json').read_bytes()).hexdigest(),
                    'scope': 'Merged results after reference-score-selected retries; not first-pass accuracy. No rescoring performed.',
                    'retryHistory': history,
                },
                'execution': dict(Counter(r['status'] for r in records)),
                'scoreStatuses': dict(scores),
                'timing': {'startedAt': start, 'endedAt': state['endedAt'], 'wallSeconds': elapsed},
                'usage': {'retained': usage(records), 'includingReplacedAttempts': usage(attempts)},
            })
            exports.append((filename, exported))
    assert len(exports) == 9
    return exports


if __name__ == '__main__':
    # Validate every input before writing any report.
    exports = build_reports()
    DEST.mkdir(parents=True, exist_ok=True)
    for filename, report in exports:
        target = DEST / filename
        temporary = target.with_suffix('.json.tmp')
        temporary.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        temporary.replace(target)
        print(f"{target.relative_to(ROOT)}: {report['passed']}/1534 ({report['accuracy']:.2%})")
