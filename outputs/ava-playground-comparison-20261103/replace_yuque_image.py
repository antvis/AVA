"""Replace only the published comparison image and its style description."""
from pathlib import Path
import json,subprocess,hashlib
R=Path(__file__).resolve().parent
OLD=R.parent/'codex-ava-luna-question-20261103'
CLI='/private/tmp/ava-yuque-runtime/node_modules/.bin/yuque'
DOC='banxuan.zyx/vufy91/mohbgkchz2funves'
assert json.loads((R/'validation.json').read_text())['answers_byte_identical_to_published_run']
assert json.loads((R/'ui-validation.json').read_text())['passed']
u=json.loads((R/'asset-upload.json').read_text());entry=u['results'][0];asset=entry['asset'];assert u['success'] and entry['spaceId']=='S_t5qynC'

def run(args,target,timeout=120):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 (R/target).write_text(p.stdout)
 assert p.returncode==0,p.stderr
 return json.loads(p.stdout)
detail=run(['huamei','asset','get-detail',asset['assetId'],'--json'],'asset-detail.json')
assert detail['success']
a=next(a for a in detail['assets'] if a['assetId']==asset['assetId'])
assert a['spaceId']=='S_t5qynC' and a['assetUrl']==asset['assetUrl'] and a['width']==2880
print('Asset detail verified.',flush=True)
p=subprocess.run(['curl','--fail','--location','--silent','--show-error','--max-time','40','--output','/dev/null','--write-out','%{http_code} %{content_type} %{size_download}\n',asset['assetUrl']],capture_output=True,text=True,timeout=45)
assert p.returncode==0 and p.stdout.startswith('200 image/png '),(p.stdout,p.stderr)
(R/'cdn-verification.txt').write_text(p.stdout)

before=json.loads((R/'yuque-before.json').read_text());body=before['body']
old_url=json.loads((OLD/'publication-verification.json').read_text())['image_url']
assert body.count(old_url)==1
body=body.replace(old_url,asset['assetUrl'])
replacements={
 '图为真实 Codex CLI 记录复排的 Codex 风格对话界面，并非原始桌面截图；工具输出节选，最终回答完整保留。':'图为真实 Codex CLI 记录按本仓库 Site Playground 样式复排的对话界面，并非 Playground 运行截图；仅更换展示样式，工具输出节选，最终回答完整保留。',
 '界面排版使用[redesign-codex-ui Skill](https://github.com/opcspace/CodexUI/tree/main/skills/redesign-codex-ui)，仅生成只读记录复排，未修改已安装的Codex客户端。':'界面排版沿用仓库 Site Playground 的 ChatPanel、ToolRow、ChatWorkspace 和 PromptBar 样式：黑色提问气泡、附件标签、浅色工具标签和展开详情竖线。仅生成只读记录复排，底层仍为同一次Codex CLI实测，未在Playground重新运行，也未修改产品源码。',
 '本机证据目录：/Users/banxuan/Documents/AVA/outputs/codex-ava-luna-question-20261103。':'本次截图目录：/Users/banxuan/Documents/AVA/outputs/ava-playground-comparison-20261103。原始实测证据目录：/Users/banxuan/Documents/AVA/outputs/codex-ava-luna-question-20261103。'
}
for old,new in replacements.items():
 assert body.count(old)==1,old
 body=body.replace(old,new,1)
(R/'yuque-ready.ymd').write_text(body)
# Preserve all other text, including the four scenario scripts and numeric findings.
undo=body.replace(asset['assetUrl'],old_url)
for old,new in replacements.items():undo=undo.replace(new,old,1)
assert undo==before['body']
latest=run([CLI,'show','doc',DOC,'--format','ymd','--json'],'yuque-immediately-before.json')
assert latest['body']==before['body'],'Document changed; rebase instead of overwriting.'
receipt=run([CLI,'update','doc',DOC,'--body-file',str(R/'yuque-ready.ymd'),'--format','ymd','--json'],'yuque-update-receipt.json')
after=run([CLI,'show','doc',DOC,'--format','ymd','--json'],'yuque-after.json')
assert asset['assetUrl'] in after['body'] and old_url not in after['body']
assert 'Site Playground 样式复排' in after['body']
assert '2026 年 9 月净销售额相比 8 月有什么变化，主要来自哪里？' in after['body']
assert all(f'id="{x}"' in after['body'] for x in ['YLFPz','YCr4q','pHWta','yFT0p'])
v={'published':True,'doc_id':after['id'],'updated_at':after.get('updated_at'),'asset_id':asset['assetId'],'asset_url':asset['assetUrl'],'cdn':p.stdout.strip(),'old_image_replaced':True,'answers_and_results_unchanged':True,'other_doc_text_preserved':True,'style':'Local Site Playground','underlying_execution':'Original Codex CLI pair; no new model run'}
(R/'publication-verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(v,ensure_ascii=False),flush=True)
