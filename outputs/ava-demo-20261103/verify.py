"""Run reference queries and render charts. Pass the three live dataset IDs."""
import json
import subprocess
import sys
from pathlib import Path

OUT=Path(__file__).resolve().parent
sales_id, retail_id, retention_id=sys.argv[1:]
reference=json.loads((OUT/'reference-answers.json').read_text())

def call(*args):
    p=subprocess.run(['ava',*args],check=True,capture_output=True,text=True)
    return json.loads(p.stdout)

def save(path, value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def chart(folder, name, kind, data, title, **kwargs):
    spec={'chartType':kind,'config':{'type':kind,'title':title,'data':data,**kwargs}}
    path=OUT/folder/(name+'.spec.json')
    save(path,spec)
    output=OUT/folder/(name+'.html')
    if output.exists():
        raise FileExistsError(output)
    call('viz','--spec','@'+str(path),'--output',str(output))

results={}
try:
    for folder, dataset_id in [('01-sales',sales_id),('02-semantics',retail_id),('03-retention',retention_id),('04-product',retail_id)]:
        save(OUT/folder/'schema.json',call('schema',dataset_id))
        if folder=='02-semantics':
            call('semantic',dataset_id,'--file',str(OUT/folder/'semantic-finance.json'))
            saved=call('semantic',dataset_id)
            save(OUT/folder/'semantic-readback.json',saved)
        for path in sorted((OUT/folder).glob('*.sql')):
            result=call('query',dataset_id,'--dsl','@'+str(path),'--max-rows','1000')
            assert not result.get('truncated'), path
            save(path.with_suffix('.result.json'),result)
            results[path.stem]=result['data']
    products=results['products']
    assert sum(r['january'] for r in products)==30000
    assert sum(r['february'] for r in products)==37500
    assert sum(r['change'] for r in products)==7500
    for mode in ['finance','trading']:
        for r in results[mode+'-monthly']:
            assert abs(r['amount']-reference[mode]['monthly'][r['month']])<0.005
        rows=results[mode+'-drivers']
        expected={(r['store'],r['channel'],r['product']):r for r in reference[mode]['drivers']}
        assert len(rows)==len(expected)
        for r in rows:
            e=expected[(r['selling_store_name'],r['channel'],r['product_name'])]
            for key in ['august','september','change']:
                assert abs(r[key]-e[key])<0.005, (mode,r,e)
        assert abs(sum(r['change'] for r in rows)-reference[mode]['change'])<0.005
    for r in results['stores']:
        e=next(e for e in reference['04-product'] if e['store']==r['selling_store_name'])
        for key in ['august','september','change']:
            assert abs(r[key]-e[key])<0.005
    for r in results['channel-retention']:
        period=next(p for p in reference['03-retention']['periods'] if p['period']==r['period'])
        expected=next(c for c in period['channels'] if c['channel']==r['channel'])
        assert all(r[k]==expected[k] for k in ['new_users','d7_users','d7_pct'])
    assert {r['period']:r['average_dau'] for r in results['dau']}=={'前期':580,'近期':740}
    assert {r['period']:r['new_users'] for r in results['new-users']}=={'前期':1400,'近期':2800}
    assert {r['period']:r['retained_pct'] for r in results['retention-curve'] if r['lag']==7}=={'前期':50,'近期':30}
    chart('01-sales','product-change','bar',[{'category':r['product'],'value':r['change']} for r in products],'各产品收入变化 2025年2月较1月 美元',axisXTitle='产品',axisYTitle='收入变化 美元')
    chart('02-semantics','definitions','column',[{'category':r['month'],'value':r['amount'],'group':label} for mode,label in [('finance','财务确认收入'),('trading','净支付交易额')] for r in results[mode+'-monthly']],'同一份订单 两种业务口径 人民币元',group=True,axisXTitle='月份',axisYTitle='金额 人民币元')
    chart('03-retention','retention-curve','line',[{'time':f"D{r['lag']}",'value':r['retained_pct'],'group':r['period']} for r in results['retention-curve']],'注册队列留存 前期7月1至14日 近期7月22日至8月4日',axisXTitle='注册后天数',axisYTitle='留存率 %')
    chart('03-retention','channel-mix','column',[{'category':r['period'],'value':r['new_users'],'group':r['channel']} for r in results['channel-retention']],'新增用户的渠道结构 人',group=True,axisXTitle='注册期间',axisYTitle='新增用户 人')
    chart('04-product','store-change','bar',[{'category':r['selling_store_name'],'value':r['change']} for r in results['stores']],'财务口径 各门店9月较8月净销售额变化 人民币元',axisXTitle='销售责任门店',axisYTitle='变化 人民币元')
    save(OUT/'validation.json',{'passed':True,'checks':'AVA query results cross-checked with independent Python Decimal and SQLite aggregations; all returned results untruncated.','agent_dialogue_run':False,'sdk_integration_run':False,'chart_browser_preview':'pending'})
    print(json.dumps({'passed':True,'charts':5,'retail_groups':len(results['finance-drivers']),'cohort_rows':len(results['cohort-trend'])},ensure_ascii=False))
finally:
    for dataset_id in [sales_id,retail_id,retention_id]:
        try:
            call('dispose',dataset_id)
        except subprocess.CalledProcessError as error:
            print('Failed to dispose '+dataset_id+': '+error.stderr,file=sys.stderr)
