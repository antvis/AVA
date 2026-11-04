from pathlib import Path
import json,subprocess,concurrent.futures
R=Path(__file__).resolve().parent
p=subprocess.run(['node',str(R/'check_ui.cjs')],capture_output=True,text=True,timeout=60)
assert p.returncode==0,p.stderr
print(p.stdout.strip(),flush=True)
def run(args,target):
 p=subprocess.run(args,capture_output=True,text=True,timeout=120)
 (R/target).write_text(p.stdout)
 assert p.returncode==0,p.stderr
 return json.loads(p.stdout)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 upload=pool.submit(run,['huamei','asset','upload',str(R/'playground-v1.png'),'--space-id','S_t5qynC','--json'],'asset-upload.json')
 doc=pool.submit(run,['/private/tmp/ava-yuque-runtime/node_modules/.bin/yuque','show','doc','banxuan.zyx/vufy91/mohbgkchz2funves','--format','ymd','--json'],'yuque-before.json')
 u,d=upload.result(),doc.result()
 assert u['success'] and u['uploaded']==1
 print(json.dumps({'upload':u['results'][0]['asset'],'doc_id':d['id'],'doc_updated_at':d.get('updated_at')},ensure_ascii=False),flush=True)
