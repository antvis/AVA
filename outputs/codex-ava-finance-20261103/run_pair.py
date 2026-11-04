"""Run the two user-authorized evaluation subjects in fresh Codex CLI sessions."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time

REPORT = Path(__file__).resolve().parent
protocol = json.loads((REPORT / 'protocol.json').read_text())

for condition in protocol['conditions']:
    arm, cwd = condition['arm'], Path(condition['cwd'])
    disabled = [{"name": "ava", "enabled": False}]
    if arm == 'ava':
        disabled.append({"path": str(cwd / '.agents/skills/ava/SKILL.md'), "enabled": True})
    # CLI -c values are TOML; JSON strings safely encode these literal paths.
    entries = []
    for item in disabled:
        entries.append('{' + ','.join(k+'='+('true' if v is True else 'false' if v is False else json.dumps(v)) for k,v in item.items()) + '}')
    args = [
        'codex', 'exec', '--ephemeral', '--ignore-user-config', '--json',
        '--skip-git-repo-check', '--approve-for-me',
        '--model', protocol['model'], '-c', 'model_reasoning_effort="high"',
        '-c', 'skills.config=[' + ','.join(entries) + ']',
        '-C', str(cwd), '-o', str(REPORT / (arm + '-answer.txt')), '-'
    ]
    condition.update(status='running', started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), argv=args)
    (REPORT/'protocol.json').write_text(json.dumps(protocol,ensure_ascii=False,indent=2)+'\n')
    started = time.monotonic()
    with (REPORT/(arm+'-events.jsonl')).open('w') as out, (REPORT/(arm+'-stderr.txt')).open('w') as err:
        completed = subprocess.run(args, input=(cwd/'prompt.txt').read_text(), text=True, stdout=out, stderr=err)
    condition.update(status='completed' if completed.returncode==0 else 'failed',exit_code=completed.returncode,elapsed_seconds=round(time.monotonic()-started,3),finished_at=datetime.datetime.now(datetime.timezone.utc).isoformat())
    for name, expected in condition['sha256'].items():
        assert hashlib.sha256((cwd/'inputs'/name).read_bytes()).hexdigest()==expected, 'Source data changed'
    (REPORT/'protocol.json').write_text(json.dumps(protocol,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'arm':arm,'status':condition['status'],'seconds':condition['elapsed_seconds']},ensure_ascii=False),flush=True)
    if completed.returncode != 0:
        raise SystemExit('Run failed; inspect logs before any retry.')
