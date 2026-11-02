#!/usr/bin/env python3
"""Native Codex discovery smoke tests; prompts never name a tool or skill."""
import argparse
import concurrent.futures
import csv
import hashlib
import json
import os
import re
from pathlib import Path
import shutil
import shlex
import sqlite3
import subprocess
import tempfile
import time
import zipfile
from xml.sax.saxutils import escape

REPO = Path(__file__).resolve().parents[3]
CASES = {
    'csv': '分析 data/orders.csv：只计 status=paid，按 month 汇总 amount 减 refund_amount（空值按零）的净额，比较 8 月和 9 月。将结果保存为 result.json，格式为 {"August":数值,"September":数值,"change":数值}，change 为9月减8月。不要画图。',
    'excel': '分析 data/operations.xlsx。orders 是订单，refunds 是多笔退款，stores 是门店。只计9月 paid 订单，按订单汇总退款后再关联，计算各地区净销售额（amount 减退款），不能因多笔退款重复计算订单金额。保存 result.json，格式为 {"East":数值,"West":数值}。不要画图。',
    'json': '分析 data/events.json，按 service 统计错误率和平均耗时。status=error 算错误，错误率分母是该服务全部事件；平均耗时排除缺失 duration_ms。保存 result.json，格式为 {"api":{"error_rate":数值,"mean_ms":数值},"worker":{"error_rate":数值,"mean_ms":数值}}。不要画图。',
    'sqlite': '分析 data/shop.sqlite，关联 orders 与 customers。只计 paid 订单，按客户 region 汇总订单金额，并统计有 paid 订单的去重客户数。保存 result.json，格式为 {"East":{"amount":数值,"customers":整数},"West":{"amount":数值,"customers":整数}}。不要画图。',
    'feishu': '分析这个飞书多维表格，比较2026年8月和9月各门店销售额，找出增长最大的门店：https://fixture.feishu.cn/base/bascnFixture?table=tblFixture 。只计已支付订单，按支付月，销售额为实付金额减退款。无法访问时说明需要我补充什么，不要编造结果。',
    'negative': '把 notes.txt 中的“待审核”改为“已审核”，其他内容保持原样。',
}
ROWS = [
    ['o1', '2026-08', 'paid', 100, 10], ['o2', '2026-08', 'paid', 200, ''],
    ['o3', '2026-08', 'cancelled', 900, 0], ['o4', '2026-09', 'paid', 300, 30],
    ['o5', '2026-09', 'paid', 100, 20], ['o6', '2026-09', 'pending', 700, 0],
]
EXPECTED = {
    'csv': {'August': 290, 'September': 350, 'change': 60},
    'excel': {'East': 220, 'West': 180},
    'json': {'api': {'error_rate': .5, 'mean_ms': 200}, 'worker': {'error_rate': 1/3, 'mean_ms': 50}},
    'sqlite': {'East': {'amount': 300, 'customers': 1}, 'West': {'amount': 300, 'customers': 2}},
}


def write_xlsx(path):
    sheets = {
        'orders': [['order_id','month','status','store_id','amount'],['a','2026-09','paid','s1',100],['b','2026-09','paid','s1',200],['c','2026-09','paid','s2',200],['d','2026-09','pending','s2',999]],
        'refunds': [['order_id','refund_amount'],['a',10],['a',20],['b',50],['c',20]],
        'stores': [['store_id','region'],['s1','East'],['s2','West']],
    }
    ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    types = '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    workbook = f'<workbook xmlns="{ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
    rels = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        for index, (name, rows) in enumerate(sheets.items(), 1):
            workbook += f'<sheet name="{name}" sheetId="{index}" r:id="rId{index}"/>'
            rels += f'<Relationship Id="rId{index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{index}.xml"/>'
            types += f'<Override PartName="/xl/worksheets/sheet{index}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            xml = f'<worksheet xmlns="{ns}"><sheetData>'
            for row_index, row in enumerate(rows, 1):
                xml += f'<row r="{row_index}">'
                for col, value in enumerate(row):
                    ref = f'{chr(65+col)}{row_index}'
                    xml += f'<c r="{ref}"><v>{value}</v></c>' if isinstance(value, (int,float)) else f'<c r="{ref}" t="inlineStr"><is><t>{escape(value)}</t></is></c>'
                xml += '</row>'
            z.writestr(f'xl/worksheets/sheet{index}.xml', xml + '</sheetData></worksheet>')
        z.writestr('xl/workbook.xml', workbook + '</sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels', rels + '</Relationships>')
        z.writestr('[Content_Types].xml', types + '</Types>')


def prepare(root, name, node):
    work = root / name
    (work / 'data').mkdir(parents=True)
    (work / 'bin').mkdir()
    (work / '.shell').mkdir()
    # Login shells can reorder inherited PATH; keep the per-run CLI first.
    path_prefix = str(work/'bin') + os.pathsep + str(Path(node).parent)
    (work/'.shell/.zprofile').write_text('export PATH=' + shlex.quote(path_prefix) + ':"$PATH"\n')
    shutil.copytree(REPO / 'skills/ava', work / '.agents/skills/ava')
    subprocess.run(['git','init','-q',str(work)], check=True)
    (work / 'AGENTS.md').write_text('Work within this project and use only its provided inputs. Keep source data read-only; write results in this directory. Do not inspect credentials, other projects, or evaluation logs. Remote URLs in this fixture are inaccessible: do not make network requests; report missing access instead. Do not publish or modify Git history.\n')
    wrapper = work / 'bin/ava'
    wrapper.write_text('#!' + shutil.which('python3') + '\n' +
        'import json,os,subprocess,sys,time\n' +
        f'cmd={[node,str(REPO / "lib/cli/index.js")]!r}+sys.argv[1:]\n' +
        'env=dict(os.environ)\n' +
        'for key in ("OPENAI_API_KEY","OPENAI_MODEL","OPENAI_BASE_URL"): env.pop(key,None)\n' +
        'r=subprocess.run(cmd,input=sys.stdin.buffer.read(),capture_output=True,env=env)\n' +
        f'with open({str(root / (name+"-cli.jsonl"))!r},"a") as f: f.write(json.dumps({{"time":time.time(),"args":sys.argv[1:],"exitCode":r.returncode,"stdout":r.stdout.decode(errors="replace"),"stderr":r.stderr.decode(errors="replace")}})+"\\n")\n' +
        'sys.stdout.buffer.write(r.stdout);sys.stderr.buffer.write(r.stderr);sys.exit(r.returncode)\n')
    wrapper.chmod(0o755)
    if name == 'csv':
        with (work/'data/orders.csv').open('w') as f:
            w=csv.writer(f);w.writerow(['order_id','month','status','amount','refund_amount']);w.writerows(ROWS)
    elif name == 'excel':
        write_xlsx(work/'data/operations.xlsx')
    elif name == 'json':
        events=[{'service':s,'status':status,'duration_ms':duration} for s,status,duration in [('api','ok',100),('api','error',300),('worker','ok',50),('worker','error',None),('worker','ok',50)]]
        (work/'data/events.json').write_text(json.dumps(events))
    elif name == 'sqlite':
        with sqlite3.connect(work/'data/shop.sqlite') as db:
            db.executescript("CREATE TABLE customers(id INTEGER,region TEXT); INSERT INTO customers VALUES(1,'East'),(2,'West'),(3,'West'); CREATE TABLE orders(id INTEGER,customer_id INTEGER,status TEXT,amount INTEGER); INSERT INTO orders VALUES(1,1,'paid',100),(2,1,'paid',200),(3,2,'paid',200),(4,3,'paid',100),(5,3,'pending',900);")
    elif name == 'negative':
        (work/'notes.txt').write_text('订单导入流程：待审核。\n')
    return work


def equal(actual, expected):
    if isinstance(expected, dict):
        return isinstance(actual,dict) and actual.keys()==expected.keys() and all(equal(actual[k],v) for k,v in expected.items())
    return isinstance(actual,(int,float)) and not isinstance(actual,bool) and abs(actual-expected)<=1e-6


def score(root, name, returncode):
    try:
        events = [json.loads(line) for line in (root/f'{name}-events.jsonl').read_text().splitlines() if line.strip()]
    except ValueError as error:
        return {'case': name, 'processExitCode': returncode, 'infrastructureError': 'Invalid event JSON: '+str(error)}
    completed = returncode == 0 and any(e.get('type') == 'turn.completed' for e in events) and not any(e.get('type') == 'turn.failed' for e in events)
    skill_text = (root/name/'.agents/skills/ava/SKILL.md').read_text().strip()
    evidence, cli = [], []
    for event in events:
        if event.get('type') != 'item.completed':
            continue
        item = event.get('item', {})
        output = item.get('aggregated_output', '')
        command = item.get('command', '')
        # A filename/catalog hit is not proof that the agent loaded the body.
        if command and skill_text in output:
            evidence.append({'itemId': item.get('id'), 'command': command})
        for match in re.finditer(r'(?:^|[^\w-])(?:\./bin/)?ava\s+(source|schema|semantic|profile|query|dispose|--help)\b', command):
            cli.append({'command': match.group(1), 'exitCode': item.get('exit_code'), 'output': output})
    path = root/name/'result.json'
    correct, result_error = None, None
    if name in EXPECTED:
        if not path.exists():
            correct, result_error = False, 'Missing result.json'
        else:
            try:
                correct = equal(json.loads(path.read_text()), EXPECTED[name])
            except (ValueError, TypeError) as error:
                correct, result_error = False, str(error)
    elif name == 'negative':
        notes = root/name/'notes.txt'
        correct = notes.exists() and notes.read_text() == '订单导入流程：已审核。\n'
    query_succeeded = any(call['command'] == 'query' and call['exitCode'] == 0 for call in cli)
    failures = [call for call in cli if call['exitCode'] not in (0, None)]
    return {
        'case': name,
        'processExitCode': returncode,
        'runCompleted': completed,
        'infrastructureError': None if completed else 'Codex turn did not complete successfully',
        'targetSkillRead': bool(evidence),
        'skillReadEvidence': evidence,
        'cliCommands': [call['command'] for call in cli],
        'avaQuerySucceeded': query_succeeded,
        'cliFailures': failures,
        'taskCorrect': correct,
        'resultError': result_error,
        'expectedSelection': name != 'negative',
        'selectionMatchesExpectation': bool(evidence) == (name != 'negative') if completed else None,
        'scope': 'routing and missing-access handling only' if name == 'feishu' else 'local data task',
        'finalReply': (root/f'{name}-reply.txt').read_text() if (root/f'{name}-reply.txt').exists() else None,
    }


def run_case(root, name, args):
    work=prepare(root,name,args.node)
    (root/f'{name}-prompt.txt').write_text(CASES[name])
    command=[args.codex,'exec','--ephemeral','--skip-git-repo-check','--json','--color','never','--approve-for-me','-C',str(work),'-o',str(root/f'{name}-reply.txt')]
    # Disable only the installed older copy for this process; preserve other skills.
    disabled=[{'path':str(Path(p).expanduser()),'enabled':False} for p in args.disable_skill]
    if disabled:
        command+=['-c','skills.config=['+','.join('{path='+json.dumps(d['path'])+',enabled=false}' for d in disabled)+']']
    env=dict(os.environ)
    env['PATH']=str(work/'bin')+os.pathsep+str(Path(args.node).parent)+os.pathsep+env.get('PATH','')
    env['ZDOTDIR']=str(work/'.shell')
    with (root/f'{name}-events.jsonl').open('w') as out, (root/f'{name}-stderr.txt').open('w') as err:
        process=subprocess.Popen(command+['-'],stdin=subprocess.PIPE,stdout=out,stderr=err,env=env,text=True,start_new_session=True)
        try:
            process.communicate(CASES[name],timeout=args.timeout)
        except subprocess.TimeoutExpired:
            import signal
            os.killpg(process.pid,signal.SIGTERM)
            try:
                process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid,signal.SIGKILL)
                process.wait()
            cleanup(root, name, args.node)
            return {'case':name,'processExitCode':process.returncode,'infrastructureError':'timeout; inspect retained trace before scoring'}
    result = score(root, name, process.returncode)
    # Keep a completed case even if later cleanup or another case fails.
    (root/f'{name}-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    result['cleanupComplete'] = all(item['closedOrAlreadyClosed'] for item in cleanup(root, name, args.node))
    return result


def cleanup(root, name, node):
    trace = root/f'{name}-cli.jsonl'
    if not trace.exists():
        return []
    ids, outcomes = set(), []
    for line in trace.read_text().splitlines():
        call = json.loads(line)
        args = call['args']
        if not args or args[0] != 'source' or call['exitCode'] != 0 or '--help' in args or '-h' in args:
            continue
        try:
            payload = json.loads(call['stdout'])
            dataset_id = payload.get('datasetId') if isinstance(payload, dict) else None
        except ValueError:
            dataset_id = None
        if not isinstance(dataset_id, str):
            outcomes.append({'closedOrAlreadyClosed': False, 'error': 'Successful source did not return a dataset ID'})
        else:
            ids.add(dataset_id)
    for dataset_id in sorted(ids):
        try:
            result = subprocess.run([node, str(REPO/'lib/cli/index.js'), 'dispose', dataset_id], capture_output=True, text=True, timeout=15)
            outcomes.append({'datasetId': dataset_id, 'closedOrAlreadyClosed': result.returncode == 0 or 'unavailable' in result.stderr, 'stderr': result.stderr})
        except (OSError, subprocess.TimeoutExpired) as error:
            outcomes.append({'datasetId': dataset_id, 'closedOrAlreadyClosed': False, 'error': str(error)})
    (root/f'{name}-cleanup.json').write_text(json.dumps(outcomes, indent=2)+'\n')
    return outcomes


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--case',action='append',choices=CASES)
    parser.add_argument('--output',type=Path)
    parser.add_argument('--node',default=shutil.which('node'))
    parser.add_argument('--codex',default=shutil.which('codex'))
    parser.add_argument('--disable-skill',action='append',default=[])
    parser.add_argument('--jobs',type=int,default=1)
    parser.add_argument('--timeout',type=int,default=360)
    args=parser.parse_args()
    if not args.node or not args.codex: parser.error('Node.js and Codex CLI are required.')
    if args.jobs<1 or args.timeout<1: parser.error('--jobs and --timeout must be positive.')
    if not (REPO/'lib/cli/index.js').exists(): parser.error('Build the AVA CJS CLI first.')
    names=args.case or list(CASES)
    if len(names)!=len(set(names)): parser.error('Do not repeat a case in one run.')
    root=args.output.resolve() if args.output else Path(tempfile.mkdtemp(prefix='ava-discovery-'))
    if args.output: root.mkdir(parents=True,exist_ok=False)
    manifest = {
        'skillCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
        'skillSha256': hashlib.sha256((REPO/'skills/ava/SKILL.md').read_bytes()).hexdigest(),
        'runnerSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'codexVersion': subprocess.check_output([args.codex, '--version'], text=True).strip(),
        'explicitInvocation': False,
        'caseNames': names,
        'disabledSkills': args.disable_skill,
        'model': 'user-configured Codex default; no override',
        'rawEventsAreLocalOnly': True,
        'createdAt': time.time(),
    }
    (root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(root,flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        results=list(pool.map(lambda name:run_case(root,name,args),names))
    (root/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps([{k:r.get(k) for k in ['case','processExitCode','targetSkillRead','avaQuerySucceeded','taskCorrect','selectionMatchesExpectation','infrastructureError']} for r in results],ensure_ascii=False),flush=True)


if __name__=='__main__':
    main()
