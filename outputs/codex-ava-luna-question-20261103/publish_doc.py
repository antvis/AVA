"""Verify the uploaded image and publish the user-authorized Yuque edit."""
from pathlib import Path
import json,subprocess,hashlib
R=Path(__file__).resolve().parent
CLI='/private/tmp/ava-yuque-runtime/node_modules/.bin/yuque'
DOC='banxuan.zyx/vufy91/mohbgkchz2funves'
change=json.loads((R/'yuque-change.json').read_text())
assert json.loads((R/'validation.json').read_text())['passed']
assert json.loads((R/'ui-validation.json').read_text())['passed']
detail=json.loads((R/'asset-detail.json').read_text())
assert detail.get('success',True) is not False
assert change['asset_id'] in json.dumps(detail,ensure_ascii=False)
# Public CDN link check; downloads nothing and sends no local file.
p=subprocess.run(['curl','--fail','--location','--silent','--show-error','--max-time','40','--output','/dev/null','--write-out','%{http_code} %{content_type} %{size_download}\n',change['asset_url']],capture_output=True,text=True,timeout=45)
assert p.returncode==0,p.stderr
assert p.stdout.startswith('200 image/png '),p.stdout
(R/'cdn-verification.txt').write_text(p.stdout)

def call(args,target):
 p=subprocess.run([CLI]+args,capture_output=True,text=True,timeout=90)
 (R/target).write_text(p.stdout)
 assert p.returncode==0,p.stderr
 return json.loads(p.stdout)
latest=call(['show','doc',DOC,'--format','ymd','--json'],'yuque-immediately-before.json')
assert hashlib.sha256(latest['body'].encode()).hexdigest()==change['before_body_sha256'],'Document changed since draft: rebase before publishing.'
receipt=call(['update','doc',DOC,'--body-file',str(R/'yuque-ready.ymd'),'--format','ymd','--json'],'yuque-update-receipt.json')
actual=call(['show','doc',DOC,'--format','ymd','--json'],'yuque-after.json')
body=actual['body'];assert change['asset_url'] in body
assert change['new_question'] in body
assert 'Codex CLI 有无 AVA 对照实测' in body
assert 'WeaveFox Builder 有无 AVA 对照测试' not in body
for heading in ['YLFPz','YCr4q','pHWta','yFT0p']:assert f'id="{heading}"' in body
for phrase in ['增长 15.8%','下降 13.9%','最终回答完整保留','两组均未被要求追问口径或生成图表']:
 assert phrase in body,phrase
verified={'published':True,'doc_id':actual['id'],'title':actual['title'],'updated_at':actual.get('updated_at'),'image_url':change['asset_url'],'image_present_in_readback':True,'question_present_in_readback':True,'all_four_scene_headings_preserved':True,'cdn':p.stdout.strip()}
(R/'publication-verification.json').write_text(json.dumps(verified,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(verified,ensure_ascii=False))
