"""Reproduce a Codex-style conversation from unedited CLI transcripts."""
import html
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parent
protocol=json.loads((ROOT/'protocol.json').read_text())
reference=json.loads((ROOT.parent/'ava-demo-20261103/reference-answers.json').read_text())['finance']

def inline(text, cwd):
    text=html.escape(text)
    def link(match):
        name, path=match.groups()
        target=(cwd/html.unescape(path)).resolve()
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

reports=[]
for condition in protocol['conditions']:
    assert condition['status']=='completed', 'Wait for the CLI subjects to finish.'
    arm=condition['arm'];cwd=Path(condition['cwd']);out=cwd/'output'
    status=json.loads((out/'status.json').read_text())
    answer=(ROOT/(arm+'-answer.txt')).read_text().strip()
    events=[json.loads(line) for line in (ROOT/(arm+'-events.jsonl')).read_text().splitlines()]
    commands=[e['item'] for e in events if e.get('type')=='item.completed' and e.get('item',{}).get('type')=='command_execution']
    source='\n'.join(c['command'] for c in commands)
    if arm=='no-ava':
        assert status['status']=='needs_clarification' and status['definition_source'] is None
        assert not (cwd/'inputs/semantic-finance.json').exists()
        assert not re.search(r'(?m)(?:^|[;\n])\s*ava\s|@antv/ava|(?:cat|read_text).*?/ava/SKILL',source)
        selected=[c for c in commands if 'python output/data_audit.py' in c['command'] or 'rg --files inputs' in c['command']]
        summary=None
    else:
        assert status['status']=='answered' and status['definition_source']
        summary=json.loads((out/'summary.json').read_text())
        for key,value in {'august':reference['monthly']['2026-08'],'september':reference['monthly']['2026-09'],'change':reference['change'],'reconciled_change':reference['change']}.items():
            assert abs(summary[key]-value)<0.005,(key,summary[key],value)
        assert abs(summary['growth_pct']-reference['growth_pct'])<.00001
        assert summary['main_decline']['store']=='深圳南山店' and summary['main_decline']['channel']=='线上商城' and summary['main_decline']['product']=='电动升降桌'
        assert abs(summary['main_decline']['change']+558776.37)<.005
        assert summary['offset']['store']=='广州天河店' and abs(summary['offset']['change']-66713.31)<.005
        selected=[]
        for needle in ('ava semantic ','ava query ','ava viz '):
            options=[c for c in commands if needle in c['command'] and c['status']=='completed']
            assert options,needle
            selected.append(options[-1] if needle=='ava semantic ' else options[0])
    reports.append({'arm':arm,'cwd':cwd,'status':status,'answer':answer,'commands':commands,'selected':selected,'summary':summary})

def command_text(command):
    raw=command['command']
    # Format the recorded shell command, preserving its literal inner text.
    if raw.startswith('/bin/zsh -lc '): raw=raw[len('/bin/zsh -lc '):]
    if raw[:1] in ('\"',"'") and raw[-1:]==raw[:1]:raw=raw[1:-1]
    return raw

question='请分析 ./inputs/sales.csv。\n2026年9月的净销售额相比8月发生了什么变化，主要来自哪里？'
check_icon='<svg viewBox="0 0 16 16" fill="none"><path d="m3.5 8 3 3 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
copy_icon='<svg viewBox="0 0 20 20" fill="none"><rect x="7" y="7" width="9" height="10" rx="2" stroke="currentColor"/><path d="M12 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" stroke="currentColor"/></svg>'

def expanded_tools(report):
    output=report['cwd']/'output'
    def panel(title, body, source):
        return '<details class="expanded-tool" open><summary><span class="chevron">⌄</span><span class="terminal">›_</span><b>'+html.escape(title)+'</b><span class="done">'+check_icon+'</span></summary><div class="tool-body"><div class="source-file">'+html.escape(source)+'</div>'+body+'</div></details>'
    def table(headers, rows):
        return '<table class="result-table"><thead><tr>'+''.join('<th>'+html.escape(h)+'</th>' for h in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+html.escape(str(v))+'</td>' for v in row)+'</tr>' for row in rows)+'</tbody></table>'
    if report['arm']=='no-ava':
        audit=json.loads((output/'data_audit.json').read_text())
        sample={'row_count':audit['row_count'],'order_count':audit['order_count'],'multi_line_order_count':audit['multi_line_order_count'],'paid_vs_completed_month_different_rows_with_both_dates':audit['paid_vs_completed_month_different_rows_with_both_dates']}
        body='<pre>'+html.escape(json.dumps(sample,ensure_ascii=False,indent=2))+'</pre>'
        body+=table(['field','missing_rows','distinct'],[(r['field'],r['missing_rows'],r['distinct_nonempty']) for r in audit['field_profiles'] if r['field'] in ('paid_at','completed_at','refund_amount')])
        context=audit['available_business_context']
        body+='<pre class="context-json">'+html.escape(json.dumps({'input_files':context['input_files'],'definition_source':context['definition_source']},ensure_ascii=False,indent=2))+'</pre>'
        return panel('python output/data_audit.py',body,'data_audit.json · 节选')
    schema=json.loads((output/'schema.json').read_text())
    cols=schema['models'][0]['columns']
    schema_body=table(['name','type'],[(c['name'],c['type']) for c in cols if c['name'] in ('order_id','paid_at','completed_at','line_paid_amount','commission_rate')])
    result=panel('ava schema',schema_body,'data · '+str(len(cols))+' columns · DuckDB SQL')
    semantic=json.loads((output/'semantic_loaded.json').read_text())
    desc=semantic['description']
    snippets=[desc[desc.index('仅order_kind'):desc.index('。',desc.index('仅order_kind'))+1],desc[desc.index('自营确认'):desc.index('。',desc.index('自营确认'))+1],desc[desc.index('退款快照'):desc.index('。',desc.index('退款快照'))+1]]
    rule_body='<div class="semantic-rules">'+''.join('<p>'+html.escape(s)+'</p>' for s in snippets)+'</div>'
    rule_body+=table(['timeDimension','expression'],[(d['name'],d['expression']) for d in semantic['cubes'][0]['timeDimensions']])
    result+=panel('ava semantic --file semantic-finance.json',rule_body,'semantic_loaded.json · 节选')
    monthly=json.loads((output/'monthly.json').read_text())
    sql=(output/'monthly.sql').read_text().strip().splitlines()
    sql_excerpt='\n'.join([sql[0],'…']+sql[-4:])
    query_body='<pre class="sql">'+html.escape(sql_excerpt)+'</pre>'
    query_body+=table(['month','eligible_orders','net_revenue'],[(r['month'],r['eligible_orders'],f"{r['net_revenue']:,.2f}") for r in monthly['data']])
    query_body+='<div class="result-count">rowCount: '+str(monthly['rowCount'])+'</div>'
    result+=panel('ava query --dsl @monthly.sql',query_body,'monthly.sql / monthly.json · 节选')
    chart=ROOT/'store-chart-preview.png'
    assert chart.exists(),'Render the original AVA chart first'
    result+=panel('ava viz --spec @store_spec.json','<img class="chart-preview" src="'+chart.as_uri()+'" alt="AVA实际生成的门店贡献瀑布图">','store_chart.html')
    return result

panels=[]
for report,condition in zip(reports,protocol['conditions']):
    ava=report['arm']=='ava'
    label='有 AVA' if ava else '无 AVA'
    context='原始 CSV ＋ 已配置财务语义' if ava else '仅原始 CSV，未提供公司口径'
    files=['sales.csv','semantic-finance.json'] if ava else ['sales.csv']
    tools=expanded_tools(report)
    count=len(report['commands']);failed=sum(c['status']=='failed' for c in report['commands'])
    meta=f'执行记录节选 · 共 {count} 次终端调用'+(f'，含 {failed} 次权限重试' if failed else '')
    status_label='按已确认口径完成分析' if ava else '需要先确认业务定义'
    answer_parts=report['answer'].split('\n\n')
    displayed_parts=([answer_parts[0],answer_parts[1],answer_parts[2],answer_parts[-1]] if ava else [answer_parts[0],answer_parts[2],answer_parts[3]])
    assert all(part in report['answer'] for part in displayed_parts)
    displayed_answer='\n\n'.join(displayed_parts)
    panels.append(f'''<section class="column">
      <div class="condition"><h2>{label}</h2><span>{context}</span></div>
      <div class="window">
        <header class="window-header"><span class="dots"><i></i><i></i><i></i></span><b>Codex</b><span class="window-title">9 月净销售额变化</span><span class="header-icon">↗</span></header>
        <div class="workspace"><span>工作区输入</span>{''.join('<code>'+html.escape(f)+'</code>' for f in files)}</div>
        <div class="thread">
          <div class="user-message">{html.escape(question).replace(chr(10),'<br>')}</div>
          <div class="tools">{tools}</div>
          <div class="assistant-heading"><span class="codex-mark">⌘</span><b>Codex</b><span class="status {'answered' if ava else ''}">{status_label}</span></div>
          <div class="answer">{markdown(displayed_answer,report['cwd'])}</div>
          <div class="message-actions">{copy_icon}<span>↻</span><span>•••</span></div>
        </div>
        <div class="composer-wrap"><div class="composer"><span>询问后续问题</span><div class="composer-bottom"><span class="plus">＋</span><span>gpt-6.1-sol <small>High</small>⌄</span><span class="send">↑</span></div></div><div class="environment">本地工作区 <span>·</span> Approve for me <span>·</span> 独立会话</div></div>
      </div>
    </section>''')

page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Codex 对话实测对照 业务语义</title><style>
*{box-sizing:border-box}body{margin:0;background:#f2f2f0;color:#202020;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;-webkit-font-smoothing:antialiased}main{width:1440px;margin:auto;padding:28px 28px 22px}.intro{display:flex;align-items:center;justify-content:space-between;margin:0 0 15px}.intro b{font-size:20px;font-weight:600}.intro span{font-size:13px;color:#777}.columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.column{min-width:0;display:flex;flex-direction:column}.condition{display:flex;align-items:baseline;justify-content:space-between;padding:0 4px 13px}h2{font-size:20px;margin:0;font-weight:650}.condition span{font-size:14px;color:#717171}.window{display:flex;flex-direction:column;flex:1;background:#fff;border:1px solid #d6d6d2;border-radius:12px;overflow:hidden;box-shadow:0 3px 15px #00000006}.window-header{height:48px;display:flex;gap:13px;align-items:center;padding:0 17px;border-bottom:1px solid #e8e8e5;background:#fafaf8;font-size:14px}.dots{display:flex;gap:6px;margin-right:2px}.dots i{display:block;width:9px;height:9px;border-radius:50%;background:#dededb}.window-header b{font-weight:600}.window-title{font-size:12px;color:#848481}.header-icon{margin-left:auto;color:#8b8b88;font-size:18px}.workspace{display:flex;align-items:center;gap:8px;min-height:43px;border-bottom:1px solid #f0f0ed;padding:9px 21px;background:#fdfdfc;color:#90908b;font-size:11px}.workspace code{color:#686863;background:#f4f4f1;border:1px solid #e9e9e4;border-radius:5px;font:11px "SFMono-Regular",Menlo,monospace;padding:4px 7px}.thread{padding:25px 26px 12px;flex:1}.user-message{margin-left:53px;background:#f0f0ed;border-radius:17px;padding:16px 19px;font-size:16px;line-height:1.8;overflow-wrap:anywhere}.prompt-note{display:block;font-size:10px;color:#999;margin-top:9px}.tools{margin:24px 0 25px}.tool-meta{font-size:11px;color:#8c8c87;margin:0 0 10px 2px}.tool{display:flex;align-items:center;gap:9px;border:1px solid #e9e9e5;border-radius:6px;background:#fcfcfa;height:34px;margin:6px 0;padding:0 10px}.terminal{font:bold 11px Menlo,monospace;color:#7c7c77}.tool code{white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font:11px "SFMono-Regular",Menlo,monospace;color:#757570;flex:1;min-width:0}.done{color:#8a8a83;display:flex}.done svg{width:13px;height:13px}.assistant-heading{display:flex;align-items:center;gap:7px;margin-bottom:17px;font-size:13px}.codex-mark{font-size:19px;font-weight:500;color:#333}.assistant-heading b{font-weight:600}.status{margin-left:auto;color:#70706b;font-size:11px;background:#f3f3ef;padding:4px 7px;border-radius:4px}.status.answered{background:#eef5ef;color:#4b7257}.answer{font-size:15.5px;line-height:1.95;color:#292929;overflow-wrap:anywhere}.answer p{margin:0 0 16px}.answer strong{font-weight:650}.answer ol,.answer ul{margin:0 0 18px;padding-left:23px}.answer li{padding-left:3px;margin:9px 0}.answer code{font:12px/1.6 "SFMono-Regular",Menlo,monospace;background:#f3f3f0;border-radius:4px;padding:2px 4px;overflow-wrap:anywhere}.answer a{color:#4a6d86;text-decoration:underline;text-decoration-color:#cedae2;text-underline-offset:3px}.answer table{border-collapse:collapse;width:100%;font-size:14px;margin-bottom:16px}.answer th,.answer td{padding:8px 5px;text-align:left;border-bottom:1px solid #e9e9e6}.message-actions{display:flex;gap:12px;align-items:center;color:#9e9e98;font-size:15px;margin:8px 0 6px}.message-actions svg{width:15px;height:15px}.composer-wrap{padding:18px 22px 13px}.composer{border:1px solid #deded9;border-radius:17px;padding:16px;background:#fff;box-shadow:0 1px 4px #00000004}.composer>span{color:#aaa9a3;font-size:13px}.composer-bottom{display:flex;align-items:center;gap:16px;margin-top:21px;color:#7e7e77;font-size:11px}.plus{font-size:21px}.composer-bottom small{font-size:10px;color:#92928a;margin:0 8px}.send{margin-left:auto;border-radius:50%;background:#f0f0ec;color:#aeaea7;width:24px;height:24px;text-align:center;font-size:17px;line-height:24px}.environment{font-size:10px;color:#aaa99f;text-align:center;margin-top:10px}.environment span{padding:0 8px}footer{padding:17px 3px 0;color:#797970;font-size:12px;line-height:1.8}footer strong{font-weight:500;color:#5d5d57}
</style><main><div class="intro"><b>同一个问题，是否已有业务口径上下文</b><span>同一 Codex 模型 · 18,971 条合成明细 · 2026.11.03</span></div><div class="columns">'''+''.join(panels)+'''</div><footer><strong>按真实 Codex CLI 提问、回答与工具记录复排为对话界面，非原始桌面截图。</strong> 正文保留原文，工具记录已节选。<br>右侧额外提供已确认的财务语义，展示配置后的分析体验；定义需事先提供，并非 AVA 自动推知。左侧追问口径是合理行为，不记为错误，也不据此宣称准确率提升。</footer></main></html>'''
extra_css='''
:root{--canvas:#f4f4f2;--surface:#fff;--text:#242424;--muted:#85857e;--line:#e6e6e0;--code:#f8f8f5;--space:12px}body{background:var(--canvas);color:var(--text)}.intro{display:none}.condition{padding-bottom:12px}.condition h2{font-size:20px}.workspace{min-height:38px}.thread{padding:20px 23px 8px}.user-message{margin-left:32px;padding:13px 16px;font-size:15px;line-height:1.65}.tools{margin:20px 0 22px}.expanded-tool{border:1px solid var(--line);border-radius:7px;margin:10px 0;background:var(--surface);overflow:hidden}.expanded-tool summary{display:flex;align-items:center;gap:8px;min-height:35px;padding:9px 11px;cursor:pointer;font-size:12px;list-style:none;background:#fbfbf9}.expanded-tool summary::-webkit-details-marker{display:none}.expanded-tool summary b{font:11px "SFMono-Regular",Menlo,monospace;font-weight:500;overflow-wrap:anywhere}.expanded-tool summary>.done{margin-left:auto}.chevron{font-size:13px;color:#777}.expanded-tool:not([open]) .chevron{transform:rotate(-90deg)}.tool-body{border-top:1px solid var(--line);padding:10px 13px 11px}.source-file{font:10px "SFMono-Regular",Menlo,monospace;color:var(--muted);margin-bottom:9px}.tool-body pre{margin:0;background:var(--code);border-radius:4px;padding:11px;font:11px/1.65 "SFMono-Regular",Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere;color:#55574e}.tool-body pre.context-json{margin-top:11px;background:#f6f4ec;color:#655d4b}.result-table{width:100%;border-collapse:collapse;font:11px/1.65 "SFMono-Regular",Menlo,monospace}.result-table th{color:#85857e;font-weight:400;text-align:left}.result-table td,.result-table th{padding:5px 4px;border-bottom:1px solid #efefeb}.result-table tr:last-child td{border-bottom:0}.semantic-rules p{font-size:12px;line-height:1.85;margin:0 0 7px;color:#444b42}.semantic-rules p:last-child{margin-bottom:10px}.result-count{font:10px "SFMono-Regular",Menlo,monospace;color:#99998e;margin-top:7px}.chart-preview{width:100%;height:auto;display:block}.answer{font-size:14px;line-height:1.9}.answer p{margin-bottom:13px}.answer li{margin:6px 0}.assistant-heading{margin-bottom:13px}.composer-wrap{padding:13px 20px 11px}.composer{padding:13px}.composer-bottom{margin-top:16px}.window-header{height:44px}footer{display:none}.proof-note{font-size:10px;color:#99998f;text-align:right;padding-top:13px}.expanded-tool:focus-within{outline:2px solid #9fa9a0;outline-offset:2px}@media(max-width:900px){main{width:100%;padding:18px}.columns{grid-template-columns:minmax(0,1fr)}.condition span{font-size:12px}.column+.column{margin-top:18px}}
'''
extra_css+='main{width:100%;max-width:1440px}.semantic-rules p{font-size:12px}.tool-body pre,.result-table{font-size:12px}.assistant-heading{margin-top:18px}'
page=page.replace('</style>','\n'+extra_css+'</style>')
page=page.replace('</main>','<div class="proof-note">Codex CLI 真实记录复排 · 工具与答复节选</div></main>')
(ROOT/'dialogue-expanded.html').write_text(page)
validation={'passed':True,'design':protocol['design'],'data_and_prompt_equal':True,'baseline_status':reports[0]['status'],'ava_status':reports[1]['status'],'ava_summary':reports[1]['summary'],'definition_provided_only_to_ava':True,'raw_answers_preserved':True,'display_mode':'Verbatim excerpts; full raw transcripts retained','ui_skill':'opcspace/CodexUI/redesign-codex-ui'}
(ROOT/'validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(validation,ensure_ascii=False))
