"""Render only the fresh pair, keeping every model statement and result unchanged."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent
protocol=json.loads((ROOT/'protocol.json').read_text())
cases=[]
for condition in ['bare','ava']:
 directory=ROOT/'pair-01'/condition
 if not (directory/'record.json').exists(): continue
 record=json.loads((directory/'record.json').read_text())
 if not record['completed']: continue
 messages=json.loads((directory/'messages.json').read_text())
 events=[json.loads(line) for line in (directory/'events.jsonl').read_text().splitlines()]
 outputs={e['toolCallId']:e['output'] for e in events if e['type']=='tool-result'}
 parts=[];calls={}
 for message in messages:
  for item in message.get('content',[]):
   if item['type']=='text':parts.append({'type':'text','text':item['text']})
   elif item['type']=='tool-call':
    name=item['toolName']; assert name!='visualize'
    part={'type':'dynamic-tool' if condition=='bare' else 'tool-'+name,'toolName':name,'toolCallId':item['toolCallId'],'input':item['input'],'state':'input-available'}
    parts.append(part);calls[item['toolCallId']]=part
   elif item['type']=='tool-result':
    part=calls[item['toolCallId']]
    if item['output']['type'] in ['error-text','error-json']:
     part.update(state='output-error',errorText=str(item['output'].get('value')))
    else:
     assert item['toolCallId'] in outputs
     part.update(state='output-available',output=outputs[item['toolCallId']])
 answer=(directory/'final-answer.txt').read_text()
 assert parts[-1]['type']=='text' and parts[-1]['text']==answer
 for stage in ['main-review','main-review-format']:
  review=directory/stage/'answer.txt'
  if not review.exists():continue
  answer=review.read_text()
  review_messages=json.loads((directory/stage/'messages.json').read_text())
  review_parts=[item for message in review_messages for item in message.get('content',[]) if item['type']=='text']
  assert ''.join(item['text'] for item in review_parts)==answer
  parts.extend([{'type':'step-start'},*review_parts])
 ids={output.get('resultId') for output in outputs.values() if isinstance(output,dict)}
 citations=re.findall(r'\[\[result:([^\]\s]+)\]\]',answer)
 assert set(citations)<=ids, 'Unknown result reference in final answer'
 assert len(calls)==record['tools']
 cases.append({'id':condition,'title':'裸 Agent' if condition=='bare' else 'AVA + Semantic','context':'无 AVA、无语义；普通文字/Markdown 答复，保留可展开的真实工具过程。' if condition=='bare' else 'AVA 分析 + 业务语义；五张图在结论引用处展开，保留真实分析与复核过程。','dataset':protocol['dataset'],'rows':protocol['rows'],'semantic':json.loads((ROOT/'inputs/semantic.json').read_text())['description'] if condition=='ava' else '',
 'messages':[{'role':'user','text':protocol['question'],'attachments':[protocol['dataset']]},{'role':'assistant','text':answer,'parts':parts}]})
 (directory/'citation-audit.json').write_text(json.dumps({'result_ids':sorted(x for x in ids if x),'references':citations,'all_resolve':True,'text_unchanged':True},ensure_ascii=False,indent=2))
(ROOT/'cases.json').write_text(json.dumps(cases,ensure_ascii=False,indent=2))
Path('site/app/analysis-review/cases.json').write_text(json.dumps(cases,ensure_ascii=False,indent=2))
print('Fresh recorded conditions:',[case['id'] for case in cases])
