"""Build a read-only Playground-style replay from explicitly cited real CLI excerpts."""
import html,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent
def inline(text, cwd):
    text=html.escape(text)
    def link(match):
        name, path=match.groups()
        target=(cwd/html.unescape(path).strip('<>')).resolve()
        if target.is_relative_to(cwd) and target.exists():
            return '<a href="'+html.escape(target.as_uri())+'">'+name+'</a>'
        return name
    text=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',link,text)
    text=re.sub(r'`([^`]+)`',r'<code>\1</code>',text)
    text=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',text)
    return text

def markdown(text,cwd):
    parts=[]
    for paragraph in text.strip().split('\n\n'):
        lines=paragraph.splitlines()
        if all(re.match(r'^\d+\.\s',line) for line in lines):
            parts.append('<ol>'+''.join('<li>'+inline(re.sub(r'^\d+\.\s','',line),cwd)+'</li>' for line in lines)+'</ol>')
        elif all(line.startswith('- ') for line in lines):
            parts.append('<ul>'+''.join('<li>'+inline(line[2:],cwd)+'</li>' for line in lines)+'</ul>')
        elif len(lines)>2 and '|' in lines[0] and re.fullmatch(r'[\s|:\-]+',lines[1]):
            rows=[]
            for n,line in enumerate([lines[0]]+lines[2:]):
                cell='th' if n==0 else 'td'
                rows.append('<tr>'+''.join(f'<{cell}>'+inline(c.strip(),cwd)+f'</{cell}>' for c in line.strip('|').split('|'))+'</tr>')
            parts.append('<table>'+''.join(rows)+'</table>')
        else:
            parts.append('<p>'+inline(paragraph,cwd).replace('\n','<br>')+'</p>')
    return '\n'.join(parts)


def panel(tool):
    parts=[]
    for b in tool['blocks']:
        if b['type']=='text':
            original=Path(b['source']).read_text()
            assert b['text'] in original, ('Excerpt absent from source',b['source'])
            parts.append('<pre>'+html.escape(b['text'])+'</pre>')
        elif b['type']=='image':
            image=Path(b['source']);assert image.exists()
            parts.append('<img class="chart-preview" src="'+image.as_uri()+'" alt="实际生成的图表">')
        elif b['type']=='table':
            data=json.loads(Path(b['source']).read_text())
            for key in b.get('path', ['data']):data=data[key]
            for row in b['rows']:assert row in data
            fields=b['fields']
            parts.append('<table class="result-table"><tr>'+''.join('<th>'+html.escape(f)+'</th>' for f in fields)+'</tr>'+''.join('<tr>'+''.join('<td>'+html.escape(str(row[f]))+'</td>' for f in fields)+'</tr>' for row in b['rows'])+'</table>')
    return '<details class="expanded-tool" open><summary><span class="chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg></span><span class="tool-label">'+('执行' if tool['title'].startswith('python3') else '读取' if tool['title']=='ava schema' else '加载' if tool['title'].startswith('ava semantic') else '查询')+'</span><b>'+html.escape(tool['title'])+' <span class="complete">· 已完成</span></b></summary><div class="tool-body"><div class="source-file">'+html.escape(tool['caption'])+'</div>'+''.join(parts)+'</div></details>'

p=json.loads((ROOT/'protocol.json').read_text());spec=json.loads((ROOT/'presentation.json').read_text());assert len(spec['conditions'])==len(p['conditions'])==2;columns=[]
for condition,view in zip(p['conditions'],spec['conditions']):
 assert condition['status']=='completed'
 cwd=Path(condition['cwd']);arm=condition['arm'];answer=(ROOT/(arm+'-answer.txt')).read_text()
 assert all(x in answer for x in view['answer_excerpts'])
 commentary=view.get('commentary','')
 if commentary:
  events=[json.loads(x) for x in (ROOT/(arm+'-events.jsonl')).read_text().splitlines()]
  assert any(commentary in e.get('item',{}).get('text','') for e in events)
 files=['sales.csv','semantic-finance.json'] if arm=='ava' else ['sales.csv']
 attachments=''.join('<span class="attachment"><span class="file-icon '+('csv' if f.endswith('.csv') else '')+'">'+('CSV' if f.endswith('.csv') else 'JSON')+'</span><span>'+f+'</span></span>' for f in files)
 columns.append('<section class="column"><div class="condition"><h2>'+('无 AVA' if arm=='no-ava' else '有 AVA')+'</h2><span>'+html.escape(view['context'])+'</span></div><div class="window"><div class="thread"><div class="user"><div class="user-message">'+html.escape(p['user_prompt'])+'</div><div class="attachments">'+attachments+'</div></div><div class="tools">'+''.join(panel(t) for t in view['tools'])+'</div><div class="answer">'+markdown('\n\n'.join(view['answer_excerpts']),cwd)+'</div></div><div class="composer-wrap"><div class="composer" aria-disabled="true"><span class="plus">＋</span><span class="placeholder">询问你的数据…</span><span class="model">GPT-6 Luna <small>Low</small>⌄</span><span class="new-chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M16 3l5 5M10 14l4-1 8-8a2.12 2.12 0 0 0-3-3l-8 8-1 4Z"/></svg></span><span class="send">↑</span></div></div></div></section>')

page='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AVA Playground 实测记录对照</title><link rel="stylesheet" href="playground.css"><main><div class="columns">'+''.join(columns)+'</div><div class="proof-note"><span>GPT-6 Luna · Low · 同一问题、同一 CSV</span><span>真实 CLI 记录 · Playground 样式复排</span></div></main></html>'
(ROOT/'comparison.html').write_text(page)
print('Built Playground comparison.html; every text excerpt checked against its recorded source.')
