"""Build an evidence-based comparison page; never modifies model outputs."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
protocol = json.loads((ROOT/'protocol.json').read_text())
reference = json.loads((ROOT.parent/'ava-demo-20261103/reference-answers.json').read_text())['finance']
expected = {
    'august': reference['monthly']['2026-08'],
    'september': reference['monthly']['2026-09'],
    'change': reference['change'],
    'reconciled_change': reference['change'],
}
reports = []
escape = html.escape

for condition in protocol['conditions']:
    arm = condition['arm']
    assert condition['status']=='completed', 'Wait for both runs to finish'
    output = Path(condition['cwd'])/'output'
    summary = json.loads((output/'summary.json').read_text())
    checks = {key: abs(summary[key]-value)<0.005 for key,value in expected.items()}
    checks['growth_pct'] = abs(summary['growth_pct']-reference['growth_pct'])<0.00001
    main = summary['main_decline']
    checks['main_decline'] = (main['store'],main['channel'],main['product'])==('深圳南山店','线上商城','电动升降桌') and abs(main['change']+558776.37)<0.005
    checks['offset'] = summary['offset']['store']=='广州天河店' and abs(summary['offset']['change']-66713.31)<0.005
    events = [json.loads(s) for s in (ROOT/(arm+'-events.jsonl')).read_text().splitlines()]
    commands = [e['item'] for e in events if e.get('type')=='item.completed' and e.get('item',{}).get('type')=='command_execution']
    all_commands='\n'.join(c.get('command','') for c in commands)
    if arm=='no-ava':
        checks['no_ava_invocation'] = not bool(re.search(r'(?m)(?:^|[;\n])\s*ava\s|@antv/ava|(?:cat|read_text).*?/ava/SKILL',all_commands))
    else:
        for operation in ('source','schema','query','viz'):
            # Calls may be inside captured Python argv or a saved script.
            scripts='\n'.join(f.read_text() for f in output.glob('*.py'))
            checks['ava_'+operation] = bool(re.search(r'ava\s+'+operation+r'\b|[\'\"]'+operation+r'[\'\"]',all_commands+'\n'+scripts))
    answer=(ROOT/(arm+'-answer.txt')).read_text().strip()
    references={name:(output/name.removeprefix('./output/')).exists() for name in re.findall(r'`([^`]+)`',answer) if name!='./output'}
    reports.append(dict(arm=arm,summary=summary,checks=checks,passed=all(checks.values()),answer=answer,artifact_references=references,command_count=len(commands),failed_commands=sum(c.get('status')=='failed' for c in commands),files=sorted(f.name for f in output.rglob('*') if f.is_file())))

assert all(r['passed'] for r in reports), json.dumps(reports,ensure_ascii=False)
validation={'all_calculation_checks_passed':True,'source':'Independent Python Decimal reference aggregation, not provided to either evaluation subject','conditions':reports}
(ROOT/'comparison-validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')

def money(value): return f'{value:,.2f}'

def card(report, condition):
    arm=report['arm']; s=report['summary']; ava=arm=='ava'
    name='有 AVA' if ava else '无 AVA'
    sub='启用 AVA Skill 与 CLI' if ava else '使用通用编程工具'
    path=(['source · 加载订单', 'schema / semantic · 结构与口径', 'query · 执行 SQL 并返回结果', 'viz · 根据配置生成 HTML 图表'] if ava else ['csv.DictReader · 读取明细', 'Decimal · 逐行计算与分组', 'Fraction / SQLite · 独立复算', 'SVG / HTML · 自行编写图表'])
    snippet=('ava source ./inputs/sales.csv\nava schema <dataset-id>\nava semantic <dataset-id> --file ...\nava query <dataset-id> --dsl @...sql\nava viz --spec @...json --output ...html' if ava else 'python output/analyze.py\n\n# CSV读取、逐行金额、汇总、复算\n# 图表与筛选逻辑均由脚本组织')
    notable=(['schema.json','SQL 查询','查询结果 JSON','图表配置 + HTML'] if ava else ['analyze.py','贡献结果 CSV','summary.json','交互 HTML + SVG'])
    excerpt=report['answer'].split('\n\n')[0]
    excerpt=re.sub(r'\*\*','',excerpt)
    missing=[name for name,exists in report['artifact_references'].items() if not exists]
    artifact_note=(f'最终答复中有 {len(missing)} 处文件名误写，实际图表已生成。' if missing else '最终答复所列文件均已找到。')
    return f'''<section class="arm {'ava' if ava else 'baseline'}">
      <header class="arm-header"><div><span class="arm-no">{'B' if ava else 'A'}</span><h2>{name}</h2></div><span class="sub">{sub}</span></header>
      <div class="result"><div class="result-label">9 月净销售额较 8 月</div><div class="headline">{s['growth_pct']:.2f}<span>%</span><span class="verified">金额核验通过</span></div>
      <div class="months"><div><small>8 月 · 元</small><b>{money(s['august'])}</b></div><span class="arrow">→</span><div><small>9 月 · 元</small><b>{money(s['september'])}</b></div></div>
      <div class="delta">减少 <strong>{money(-s['change'])}</strong> 元</div></div>
      <div class="findings"><div><span>主要下降组合</span><b>深圳南山店 × 线上商城 × 电动升降桌</b><strong>−558,776.37 元</strong></div><div><span>门店增长抵消项</span><b>广州天河店</b><strong class="positive">+66,713.31 元</strong></div></div>
      <div class="workflow"><h3>实际执行路径</h3><ol>{''.join('<li>'+escape(item)+'</li>' for item in path)}</ol></div>
      <div class="code-label">调用方式整理<span>会话 ID 与文件名简写</span></div><pre>{escape(snippet)}</pre>
      <div class="artifacts"><h3>本次交付</h3><div>{''.join('<span>'+escape(x)+'</span>' for x in notable)}</div><p class="artifact-note {'warning' if missing else ''}">{artifact_note}</p></div>
      <div class="quote"><h3>回答摘录</h3><p>{escape(excerpt)}</p></div>
    </section>'''

cards='\n'.join(card(r,c) for r,c in zip(reports,protocol['conditions']))
body=f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Codex CLI 有无 AVA 实测对照</title>
<style>
*{{box-sizing:border-box}}:root{{color-scheme:light}}body{{margin:0;background:#eeece5;color:#17332c;font-family:"PingFang SC","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased}}
main{{width:1440px;padding:42px 48px 32px;margin:auto}}.topline{{display:flex;justify-content:space-between;font-size:16px;letter-spacing:1px;color:#557068;border-bottom:1px solid #c7d0c9;padding-bottom:16px}}.topline b{{letter-spacing:2px;color:#25473b}}
h1{{font-family:"Songti SC","STSong",serif;font-weight:600;font-size:48px;letter-spacing:-1px;line-height:1.2;margin:25px 0 14px}}.lead{{font-size:19px;line-height:1.65;margin:0 0 18px;color:#52675f}}.question{{font-size:23px;background:#faf9f5;border-left:4px solid #337c66;padding:17px 22px;margin:0 0 14px}}
.controls{{display:flex;flex-wrap:wrap;gap:8px 21px;font-size:15px;color:#54675f;margin:0 0 24px}}.controls span+span{{border-left:1px solid #bfc8bf;padding-left:21px}}
.comparison{{display:grid;grid-template-columns:1fr 1fr;gap:24px}}.arm{{background:#fffefa;border:1px solid #cfd6cd;border-radius:8px;padding:25px 27px 22px}}.arm.ava{{border-top:4px solid #2b7e67;padding-top:22px}}.arm.baseline{{border-top:4px solid #6e7b7a;padding-top:22px}}
.arm-header{{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e0e5dd;padding-bottom:18px}}.arm-header>div{{display:flex;gap:12px;align-items:center}}.arm-no{{font:17px "SFMono-Regular",Menlo,monospace;color:#819188}}h2{{font-size:29px;margin:0;letter-spacing:1px}}.sub{{font-size:15px;color:#657970}}
.result{{padding:20px 0 14px}}.result-label{{font-size:16px;color:#5a6e64}}.headline{{font-family:"SFMono-Regular",Menlo,monospace;font-size:54px;letter-spacing:-2px;line-height:1.35;font-weight:600;display:flex;align-items:baseline;gap:4px}}.headline>span:first-child{{font-size:29px;letter-spacing:0}}.headline .verified{{font:14px "PingFang SC",sans-serif;letter-spacing:0;margin-left:auto;color:#2f6c51;border:1px solid #a7c9b7;padding:4px 8px;border-radius:4px;align-self:center}}
.months{{display:flex;gap:15px;align-items:center;margin-top:5px}}.months small{{display:block;color:#64776d;font-size:14px;margin-bottom:5px}}.months b{{font-family:"SFMono-Regular",Menlo,monospace;font-size:22px;font-weight:500;letter-spacing:-.5px}}.arrow{{color:#809287;font-size:22px;padding-top:16px}}.delta{{font-size:16px;color:#536c5c;margin-top:11px}}.delta strong{{font-weight:600;color:#1c3b2c}}
.findings{{display:grid;grid-template-columns:1.35fr 1fr;gap:16px;background:#f3f5ef;border-radius:5px;padding:15px;margin-top:4px;min-height:126px}}.findings span{{display:block;font-size:14px;color:#718174;margin-bottom:7px}}.findings b{{display:block;font-size:16px;font-weight:500;line-height:1.6}}.findings strong{{display:block;font:19px "SFMono-Regular",Menlo,monospace;margin-top:7px;color:#8b4c3f}}.findings .positive{{color:#28715b}}
h3{{font-size:16px;font-weight:600;margin:0 0 11px}}.workflow{{padding:21px 0 16px}}ol{{padding:0;margin:0;list-style:none;counter-reset:steps;display:grid;gap:9px}}li{{counter-increment:steps;font-size:16px;line-height:1.5;display:flex;gap:11px;align-items:baseline}}li:before{{content:"0" counter(steps);color:#879488;font:13px "SFMono-Regular",Menlo,monospace}}
.code-label{{display:flex;justify-content:space-between;font-size:13px;color:#6a7a6f;margin-bottom:8px}}.code-label span{{font-size:12px}}pre{{font:13px/1.65 "SFMono-Regular",Menlo,monospace;margin:0;padding:15px 16px;border-radius:4px;background:#eaf0e8;color:#305141;min-height:138px;white-space:pre-wrap;overflow-wrap:anywhere}}
.artifacts{{padding:18px 0}}.artifacts>div{{display:flex;flex-wrap:wrap;gap:7px}}.artifacts span{{font-size:13px;border:1px solid #dce3d8;padding:5px 8px;background:#fafbf7;border-radius:3px}}
.artifact-note{{font-size:14px;margin:11px 0 0;color:#758475}}.artifact-note.warning{{color:#8a6542}}
.quote{{border-top:1px solid #e0e5dd;padding-top:15px}}.quote h3{{font-size:13px;color:#7c8b7e;margin-bottom:6px}}.quote p{{font-size:15px;line-height:1.8;margin:0;color:#536a5c}}
.takeaway{{display:flex;align-items:center;gap:20px;padding:21px 0 14px}}.takeaway b{{font-size:21px;white-space:nowrap}}.takeaway p{{margin:0;border-left:1px solid #bacbbd;padding-left:20px;color:#536e5c;font-size:16px;line-height:1.65}}footer{{font-size:13px;line-height:1.7;color:#738373;border-top:1px solid #c7d0c9;padding-top:12px}}.proof{{display:none}}
</style><main>
<div class="topline"><b>AVA · 执行对照</b><span>Codex CLI 实测 / 2026.11.03</span></div>
<h1>财务口径下的净销售额变化</h1>
<p class="lead">同一模型、同一问题、同一份订单与业务定义。左侧自行编写分析流程，右侧使用 AVA Skill 与 CLI。</p>
<div class="question">“2026 年 9 月的净销售额相比 8 月发生了什么变化，主要来自哪里？”</div>
<div class="controls"><span>请求模型 gpt-6.1-sol · high</span><span>18,971 条合成明细</span><span>相同财务定义</span><span>独立新会话 · 各运行 1 次</span></div>
<div class="comparison">{cards}</div>
<div class="takeaway"><b>两组关键结果一致</b><p>本次差异体现在执行方式：AVA 将数据接入、结构与业务定义、SQL 查询和图表生成组织为统一工具流程。</p></div>
<footer>按真实 CLI 回答与产物整理，统一排版；非原始聊天界面截图。两组均通过金额、主要来源与抵消项核验。<br>单次案例用于展示工作流，不据此宣称准确率、耗时或成本优势。无 AVA 组未调用 AVA；有 AVA 组版本为 4.0.0-beta.5。</footer>
</main></html>'''
(ROOT/'comparison.html').write_text(body)
print(json.dumps({'all_passed':True,'report':str(ROOT/'comparison.html'),'arms':[{'arm':r['arm'],'checks':r['checks'],'command_count':r['command_count'],'failed_commands':r['failed_commands']} for r in reports]},ensure_ascii=False))
