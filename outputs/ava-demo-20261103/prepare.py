"""Prepare synthetic presentation data and independent reference answers."""
import csv
import json
import shutil
import sqlite3
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[1]
for folder in ('01-sales', '02-semantics', '03-retention', '04-product'):
    (OUT / folder).mkdir(exist_ok=True)

def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def sql(folder, name, text):
    (OUT / folder / (name + '.sql')).write_text(text.strip() + '\n')

shutil.copyfile(ROOT / 'site/public/examples/agent-skill/sales.csv', OUT / '01-sales/sales.csv')
sql('01-sales', 'products', """
SELECT product,
  SUM(CASE WHEN month='2025-01' THEN revenue ELSE 0 END) AS january,
  SUM(CASE WHEN month='2025-02' THEN revenue ELSE 0 END) AS february,
  february-january AS change
FROM data WHERE month IN ('2025-01','2025-02')
GROUP BY product ORDER BY change DESC, product;
""")

reference = {'01-sales': {'january': 30000, 'february': 37500, 'change': 7500, 'growth_pct': 25}}
with (OUT / '01-sales/sales.csv').open() as f:
    sales = list(csv.DictReader(f))
assert sum(int(r['revenue']) for r in sales if r['month']=='2025-01') == 30000
assert sum(int(r['revenue']) for r in sales if r['month']=='2025-02') == 37500

shutil.copyfile(ROOT / 'data/retail-semantics/sales.csv', OUT / '02-semantics/sales.csv')
retail = list(csv.DictReader((OUT / '02-semantics/sales.csv').open()))
for mode, time_field, statuses in (
    ('finance', 'completed_at', ('completed',)),
    ('trading', 'paid_at', ('paid', 'shipped', 'completed')),
):
    source = ROOT / f'data/retail-semantics/semantic-{mode}.json'
    shutil.copyfile(source, OUT / f'02-semantics/semantic-{mode}.json')
    semantic = json.loads(source.read_text())
    measure = semantic['cubes'][0]['measures'][0]['expression']
    where = f"{time_field} >= DATE '2026-08-01' AND {time_field} < DATE '2026-10-01'"
    sql('02-semantics', f'{mode}-monthly', f"""
SELECT strftime({time_field}, '%Y-%m') AS month, {measure} AS amount
FROM data WHERE {where} GROUP BY month ORDER BY month;
""")
    cte = f"""WITH monthly AS (
 SELECT selling_store_name, channel, product_name,
 strftime({time_field}, '%Y-%m') AS month, {measure} AS amount
 FROM data WHERE {where}
 GROUP BY selling_store_name, channel, product_name, month
), changes AS (
 SELECT selling_store_name, channel, product_name,
 SUM(CASE WHEN month='2026-08' THEN amount ELSE 0 END) AS august,
 SUM(CASE WHEN month='2026-09' THEN amount ELSE 0 END) AS september,
 september-august AS change
 FROM monthly GROUP BY selling_store_name, channel, product_name
)"""
    sql('02-semantics', f'{mode}-drivers', cte + '\nSELECT * FROM changes ORDER BY change, selling_store_name, channel, product_name;')
    if mode == 'finance':
        sql('04-product', 'stores', cte + """
SELECT selling_store_name, SUM(august) AS august, SUM(september) AS september,
 SUM(change) AS change FROM changes GROUP BY selling_store_name
 ORDER BY change, selling_store_name;
""")
        sql('04-product', 'store-detail', cte + """
SELECT * FROM changes WHERE selling_store_name='深圳南山店'
ORDER BY change, channel, product_name;
""")
    monthly = defaultdict(Decimal)
    grouped = defaultdict(lambda: defaultdict(Decimal))
    for r in retail:
        if r['order_kind'] != 'customer_sale' or r['status'] not in statuses:
            continue
        month = r[time_field][:7]
        if month not in ('2026-08', '2026-09'):
            continue
        paid, refund = Decimal(r['line_paid_amount']), Decimal(r['refund_amount'] or '0')
        if mode == 'finance':
            rate = Decimal(r['commission_rate'])
            net = (paid*rate).quantize(Decimal('.01'), rounding=ROUND_HALF_UP) - (refund*rate).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)
        else:
            net = paid-refund
        monthly[month] += net
        grouped[(r['selling_store_name'], r['channel'], r['product_name'])][month] += net
    drivers = [dict(store=k[0], channel=k[1], product=k[2], august=float(v['2026-08']), september=float(v['2026-09']), change=float(v['2026-09']-v['2026-08'])) for k,v in grouped.items()]
    drivers.sort(key=lambda r:(r['change'], r['store'], r['channel'], r['product']))
    change = monthly['2026-09'] - monthly['2026-08']
    assert round(sum(r['change'] for r in drivers), 2) == float(change)
    reference[mode] = {'monthly': {k:float(v) for k,v in monthly.items()}, 'change':float(change), 'growth_pct':float(change/monthly['2026-08']*100), 'drivers':drivers}
    if mode == 'finance':
        stores = defaultdict(lambda:defaultdict(Decimal))
        for k,v in grouped.items():
            for month, amount in v.items():
                stores[k[0]][month] += amount
        reference['04-product'] = sorted([{'store':k, 'august':float(v['2026-08']), 'september':float(v['2026-09']), 'change':float(v['2026-09']-v['2026-08'])} for k,v in stores.items()], key=lambda r:(r['change'], r['store']))

# Data are deliberately constructed to show a channel-mix effect, not a real business.
db_path = OUT / '03-retention/retention.sqlite'
if db_path.exists():
    raise FileExistsError('Use a new output folder; existing retention database is not replaced.')
db = sqlite3.connect(db_path)
db.executescript('CREATE TABLE users(user_id TEXT PRIMARY KEY, registered_at TEXT, channel TEXT); CREATE TABLE events(user_id TEXT, event_date TEXT, event_name TEXT, PRIMARY KEY(user_id,event_date,event_name));')
users, events = [], []
start, end = date(2026,6,17), date(2026,8,4)
for n in range(300):
    uid = f'old-{n:03d}'
    users.append((uid,'2026-06-01','历史用户'))
    for day in range((date(2026,8,11)-start).days+1):
        events.append((uid,(start+timedelta(days=day)).isoformat(),'core_action'))
for day in range((end-start).days+1):
    d = start+timedelta(days=day)
    for channel, count in (('自然渠道',80),('推广渠道',20 if d<date(2026,7,15) else 120)):
        for n in range(count):
            uid = f'{d.isoformat()}-{channel}-{n:03d}'
            users.append((uid,d.isoformat(),channel))
            for lag, pct in ((0,100),(1,80 if channel=='自然渠道' else 30),(3,70 if channel=='自然渠道' else 20),(7,60 if channel=='自然渠道' else 10)):
                if n < count*pct//100:
                    events.append((uid,(d+timedelta(days=lag)).isoformat(),'core_action'))
db.executemany('INSERT INTO users VALUES(?,?,?)',users)
db.executemany('INSERT INTO events VALUES(?,?,?)',events)
db.commit()
assert db.execute('SELECT COUNT(*) FROM users').fetchone()[0] == len(users)
assert db.execute('SELECT COUNT(*) FROM events').fetchone()[0] == len(events)
for name, rows, columns in [('users', users, ('user_id','registered_at','channel')), ('events', events, ('user_id','event_date','event_name'))]:
    with (OUT / f'03-retention/{name}.csv').open('w') as f:
        writer=csv.writer(f); writer.writerow(columns); writer.writerows(rows)

period = "CASE WHEN CAST(registered_at AS DATE) BETWEEN DATE '2026-07-01' AND DATE '2026-07-14' THEN '前期' ELSE '近期' END"
scope = "(CAST(registered_at AS DATE) BETWEEN DATE '2026-07-01' AND DATE '2026-07-14' OR CAST(registered_at AS DATE) BETWEEN DATE '2026-07-22' AND DATE '2026-08-04')"
sql('03-retention','new-users', f'SELECT {period} AS period, COUNT(*) AS new_users FROM users WHERE {scope} GROUP BY period;')
sql('03-retention','dau', """
WITH daily AS (
 SELECT CAST(event_date AS DATE) AS day, COUNT(DISTINCT user_id) AS dau
 FROM events WHERE event_name='core_action' GROUP BY day
)
SELECT CASE WHEN day BETWEEN DATE '2026-07-01' AND DATE '2026-07-14' THEN '前期' ELSE '近期' END AS period,
 AVG(dau) AS average_dau
FROM daily WHERE day BETWEEN DATE '2026-07-01' AND DATE '2026-07-14'
 OR day BETWEEN DATE '2026-07-22' AND DATE '2026-08-04' GROUP BY period;
""")
sql('03-retention','channel-retention',f"""
SELECT {period} AS period, u.channel, COUNT(DISTINCT u.user_id) AS new_users,
 COUNT(DISTINCT e.user_id) AS d7_users,
 100.0*COUNT(DISTINCT e.user_id)/COUNT(DISTINCT u.user_id) AS d7_pct
FROM users u LEFT JOIN events e ON u.user_id=e.user_id
 AND CAST(e.event_date AS DATE)=CAST(u.registered_at AS DATE)+INTERVAL 7 DAY
 AND e.event_name='core_action'
WHERE {scope} GROUP BY period, u.channel ORDER BY period, u.channel;
""")
sql('03-retention','cohort-trend', """
SELECT CAST(u.registered_at AS DATE) AS cohort_date, u.channel,
 COUNT(DISTINCT u.user_id) AS new_users, COUNT(DISTINCT e.user_id) AS d7_users,
 100.0*COUNT(DISTINCT e.user_id)/COUNT(DISTINCT u.user_id) AS d7_pct
FROM users u LEFT JOIN events e ON u.user_id=e.user_id
 AND CAST(e.event_date AS DATE)=CAST(u.registered_at AS DATE)+INTERVAL 7 DAY
 AND e.event_name='core_action'
WHERE CAST(u.registered_at AS DATE) BETWEEN DATE '2026-07-01' AND DATE '2026-08-04'
GROUP BY cohort_date,u.channel ORDER BY cohort_date,u.channel;
""")
sql('03-retention','retention-curve',f"""
WITH lags AS (SELECT * FROM (VALUES (0),(1),(3),(7)) t(lag))
SELECT {period} AS period, l.lag,
 COUNT(DISTINCT u.user_id) AS new_users, COUNT(DISTINCT e.user_id) AS retained_users,
 100.0*COUNT(DISTINCT e.user_id)/COUNT(DISTINCT u.user_id) AS retained_pct
FROM users u CROSS JOIN lags l LEFT JOIN events e ON u.user_id=e.user_id
 AND date_diff('day',CAST(u.registered_at AS DATE),CAST(e.event_date AS DATE))=l.lag
 AND e.event_name='core_action'
WHERE {scope} GROUP BY period,l.lag ORDER BY period,l.lag;
""")
retention=[]
for label,lo,hi in [('前期','2026-07-01','2026-07-14'),('近期','2026-07-22','2026-08-04')]:
    channels=db.execute("""SELECT u.channel,COUNT(DISTINCT u.user_id),COUNT(DISTINCT e.user_id) FROM users u LEFT JOIN events e ON u.user_id=e.user_id AND e.event_date=date(u.registered_at,'+7 days') AND e.event_name='core_action' WHERE registered_at BETWEEN ? AND ? GROUP BY u.channel ORDER BY u.channel""",(lo,hi)).fetchall()
    avg_dau=db.execute("SELECT AVG(n) FROM (SELECT event_date,COUNT(DISTINCT user_id) n FROM events WHERE event_name='core_action' AND event_date BETWEEN ? AND ? GROUP BY event_date)",(lo,hi)).fetchone()[0]
    retention.append(dict(period=label,new_users=sum(r[1] for r in channels),d7_users=sum(r[2] for r in channels),average_dau=avg_dau,channels=[dict(channel=r[0],new_users=r[1],d7_users=r[2],d7_pct=100*r[2]/r[1]) for r in channels]))
db.close()
assert [(r['new_users'],r['d7_users'],r['average_dau']) for r in retention] == [(1400,700,580),(2800,840,740)]
reference['03-retention']={'periods':retention,'users':len(users),'events':len(events),'snapshot':'2026-08-11','timezone':'Asia/Shanghai','note':'D7 is activity exactly seven calendar days after registration; all selected cohorts have full observation.'}
assert reference['finance']['monthly']=={'2026-08':4293025.42,'2026-09':3697575.18}
assert reference['trading']['monthly']=={'2026-08':6740687.05,'2026-09':7803998.06}
write_json(OUT/'reference-answers.json',reference)
live=OUT/'live-inputs'
for folder in ('01-sales','02-semantics','03-retention'):
    (live/folder).mkdir(parents=True,exist_ok=True)
for relative in ('01-sales/sales.csv','02-semantics/sales.csv','02-semantics/semantic-finance.json','02-semantics/semantic-trading.json','03-retention/retention.sqlite'):
    shutil.copyfile(OUT/relative,live/relative)
write_json(live/'03-retention/semantic.json',{'description':'教学合成数据，时间均按Asia/Shanghai自然日。users每人一行，events为去重的用户每日事件。新增用户按users.registered_at统计人数。DAU为当天发生core_action的去重用户数，包含历史用户；日均DAU是期间每天DAU的平均值。D7留存为注册当天后第7个自然日发生core_action的人数除以该注册队列人数，不是7天内任意活跃。前期注册队列为2026-07-01至2026-07-14，近期为2026-07-22至2026-08-04，均含首尾日。活动快照截至2026-08-11，所有对比队列均有完整D7观察。渠道按注册时users.channel归属。连接后计人数需去重；计算留存必须保留没有回访的注册用户。数据只有注册、渠道、活跃事实，没有渠道成本、版本发布、投放策略或故障记录。'})
print(json.dumps({'folder':str(OUT),'retention':reference['03-retention'],'stores':reference['04-product']},ensure_ascii=False))
