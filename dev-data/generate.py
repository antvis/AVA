"""Build the synthetic sales/investment case using only Python's standard library."""

import math
import os
import random
import sqlite3
from collections import defaultdict, deque
from datetime import date, datetime, time, timedelta
from pathlib import Path

from build_semantic import write_semantic


ROOT = Path(__file__).resolve().parent
DATABASE = ROOT / "sales-investment.sqlite"
START = date(2026, 7, 6)
ORDER_END = date(2026, 10, 11)
SNAPSHOT = date(2026, 10, 18)
SEED = 20261022

# Product IDs are stable so reference queries can follow business keys, not answer labels.
PRODUCTS = [
    (1, "D-PRO", "智升 Pro 电动升降桌", "升降桌", 329900, 171500, .17),
    (2, "D-LITE", "智升 Lite 电动升降桌", "升降桌", 219900, 127500, .10),
    (3, "C-PRO", "久坐 Pro 人体工学椅", "办公椅", 189900, 105000, .12),
    (4, "C-LITE", "轻享人体工学椅", "办公椅", 79900, 43500, .10),
    (5, "MON-27", "27 寸办公显示器", "显示器", 149900, 107000, .05),
    (6, "ARM", "双轴显示器支架", "桌面配件", 29900, 13500, .06),
    (7, "KEY", "静音机械键盘", "桌面配件", 39900, 18800, .07),
    (8, "MOUSE", "轻办公无线鼠标", "桌面配件", 19900, 8200, .06),
    (9, "LAMP", "护眼桌面灯", "桌面配件", 24900, 11200, .05),
    (10, "CART", "移动文件柜", "收纳", 34900, 18400, .03),
    (11, "FOOT", "可调脚踏", "桌面配件", 14900, 6100, .04),
    (12, "CABLE", "理线套装", "桌面配件", 8900, 2900, .03),
    (13, "MAT", "桌面软垫", "桌面配件", 11900, 4100, .04),
    (14, "C-SELECT", "精选旗舰办公椅", "精选代销", 429900, 0, .03),
    (15, "AIR", "精选空气净化器", "精选代销", 309900, 0, .02),
    (16, "BOX", "桌面收纳套装", "收纳", 12900, 5600, .03),
]
BASE_SHARES = {1: .28, 2: .22, 3: .14, 4: .16, 5: .10, 6: 0, 7: .10}
CAMPAIGN_BY_CHANNEL = {3: 1, 4: 2, 5: 3, 6: 4}
CPC = {1: 160, 2: 240, 3: 110, 4: 175}


def days(first, last):
    for offset in range((last - first).days + 1):
        yield first + timedelta(days=offset)


def timestamp(day, hour=12, minute=0):
    return datetime.combine(day, time(hour, minute)).isoformat(sep=" ")


def poisson(rng, mean):
    threshold = math.exp(-mean)
    product, count = 1.0, 0
    while product > threshold:
        product *= rng.random()
        count += 1
    return max(0, count - 1)


def binomial(rng, count, probability):
    return sum(rng.random() < probability for _ in range(count))


def generate():
    rng = random.Random(SEED)
    # Build next to the destination and replace only after all rows pass validation.
    temporary = DATABASE.with_suffix(".building.sqlite")
    if temporary.exists():
        raise FileExistsError(f"Remove the unfinished build explicitly first: {temporary}")
    conn = sqlite3.connect(temporary)
    conn.executescript((ROOT / "schema.sql").read_text())
    cursor = conn.cursor()
    counters = defaultdict(int)

    def insert(table, values):
        cursor.execute(f"INSERT INTO {table} VALUES ({','.join('?' for _ in values)})", values)

    def next_id(table):
        counters[table] += 1
        return counters[table]

    regions = [
        ("华东", ["杭州", "上海"], ["杭州", "宁波", "温州", "金华", "上海", "苏州", "南京", "无锡"]),
        ("华南", ["深圳", "广州"], ["深圳", "东莞", "惠州", "珠海", "广州", "佛山", "中山", "江门"]),
        ("华北", ["北京", "天津"], ["北京", "石家庄", "保定", "廊坊", "天津", "济南", "青岛", "烟台"]),
        ("西部", ["成都", "重庆"], ["成都", "绵阳", "德阳", "乐山", "重庆", "贵阳", "昆明", "西安"]),
    ]
    markets = {}
    store_region = {}
    for region_index, (region, store_cities, cities) in enumerate(regions):
        for local, city in enumerate(store_cities):
            store_id = region_index * 2 + local + 1
            insert("stores", (store_id, city + "体验中心", region, city))
            store_region[store_id] = region
        for local, city in enumerate(cities):
            market_id = region_index * 8 + local + 1
            store_id = region_index * 2 + local // 4 + 1
            factor = (1.65 if region == "华东" else 1.0) * rng.uniform(.9, 1.1)
            markets[market_id] = (region, store_id, factor)
            insert("markets", (market_id, city, region, store_id))

    for row in [
        (1, "自然搜索", "organic"), (2, "直接访问", "direct"),
        (3, "品牌词搜索", "paid"), (4, "通用词搜索", "paid"),
        (5, "社交重定向", "paid"), (6, "社交拓新", "paid"), (7, "线下到店", "offline"),
    ]:
        insert("channels", row)
    products = {row[0]: row for row in PRODUCTS}
    weights = {row[0]: row[6] for row in PRODUCTS}
    distributions = {}
    for channel in BASE_SHARES:
        distribution = dict(weights)
        if channel == 4:
            distribution = {pid: weight * (2 if pid in (1, 2, 3) else .6) for pid, weight in weights.items()}
        if channel == 6:
            distribution = {14: .50, 15: .25, 4: .25}
        total = sum(distribution.values())
        distributions[channel] = {pid: weight / total for pid, weight in distribution.items()}
    for pid, sku, name, category, price, cost, weight in PRODUCTS:
        insert("products", (pid, sku, name, category, price))
        for phase, first, last in [(0, "2026-01-01", "2026-08-30"), (1, "2026-08-31", "2026-12-31")]:
            agency = pid in (14, 15)
            insert("commercial_terms", (
                pid * 10 + phase, pid, first, last, "consignment" if agency else "owned",
                (1400 if pid == 14 else 1800) if agency else 10000,
                "优选联合供应" if agency else ("安坐家具" if pid == 4 else "自营供应链"),
            ))

    campaign_rows = [
        (1, "品牌搜索常开", 3, "2026-01-01", "2026-12-31", 7, "7日点击，支付商品金额，不扣退款", "品牌相关搜索人群"),
        (2, "办公升级通用词", 4, "2026-01-01", "2026-12-31", 7, "7日点击，支付商品金额，不扣退款", "办公桌椅需求人群"),
        (3, "访客重定向", 5, "2026-01-01", "2026-12-31", 1, "1日曝光或点击，支付商品金额，不扣退款", "近期访问与加购人群"),
        (4, "秋季精选拓新", 6, "2026-08-31", "2026-12-31", 7, "7日点击，支付商品金额，不扣退款", "精选商品兴趣拓新人群"),
    ]
    for row in campaign_rows:
        insert("campaigns", row)
    insert("experiments", (
        1, "品牌词预算上调分区域实验", 1, "market_id", "按大区分层，每层8个市场随机分配4个实验、4个对照",
        "2026-08-10", "2026-08-30", "2026-08-31", "2026-09-20",
        "实验市场品牌词预算和出价上调；对照市场保持原策略。其他活动按全市场规则运行。",
    ))
    groups = {}
    for region, _, _ in regions:
        ids = [mid for mid, value in markets.items() if value[0] == region]
        rng.shuffle(ids)
        for index, mid in enumerate(ids):
            groups[mid] = "treatment" if index < 4 else "control"
            insert("experiment_assignments", (1, mid, region, groups[mid], "2026-08-01 09:00:00"))

    customer_pool = defaultdict(list)
    for mid in markets:
        for _ in range(180):
            cid = next_id("customers")
            first = START - timedelta(days=rng.randint(20, 380))
            insert("customers", (cid, mid, timestamp(first - timedelta(days=rng.randint(0, 40))), timestamp(first), rng.choice([1, 2, 3, 4, 7])))
            customer_pool[mid].append(cid)

    # FIFO lots make partial fulfillment, supplier cost and returns reconcilable.
    stock = defaultdict(deque)
    purchase_meta = {}
    arrivals = defaultdict(list)
    restocks = defaultdict(list)
    inventory = defaultdict(lambda: [0, 0, 0, 0])
    claimed = defaultdict(lambda: [0, 0])
    traffic = []
    ad_clicks = defaultdict(int)

    expected_daily = {}
    addon_ids = [6, 7, 8, 9, 11, 12, 13, 16]
    for store_id in store_region:
        factor = sum(value[2] for value in markets.values() if value[1] == store_id)
        for pid in products:
            probability = sum(BASE_SHARES[ch] * distributions[ch].get(pid, 0) * (.032 if ch == 4 else .028) for ch in BASE_SHARES)
            addons = .028 * .30 / len(addon_ids) if pid in addon_ids else 0
            expected_daily[store_id, pid] = factor * 420 * (probability * 1.12 + addons)

    for store_id in store_region:
        for pid, product in products.items():
            for receipt_day in [START - timedelta(days=1)] + list(days(START + timedelta(days=6), SNAPSHOT))[::7]:
                first = receipt_day < START
                quantity = max(5, math.ceil(expected_daily[store_id, pid] * (9 if first else 7.4)))
                if receipt_day >= date(2026, 8, 31) and pid in (14, 15, 4):
                    quantity = math.ceil(quantity * (3.5 if pid in (14, 15) else 1.5))
                received_day = receipt_day
                reason = None
                if store_region[store_id] == "华东" and pid in (1, 2) and date(2026, 9, 6) <= receipt_day <= date(2026, 9, 13):
                    received_day += timedelta(days=16 if receipt_day.day == 6 else 10)
                    reason = "供应商电机模组延期，预约到仓时间顺延"
                lot = f"L{pid:02d}-{receipt_day:%m%d}"
                if pid == 4 and date(2026, 9, 6) <= receipt_day <= date(2026, 9, 20):
                    lot = "L04-0906-A"
                unit_cost = product[5]
                if receipt_day >= date(2026, 8, 31) and pid in (1, 2, 3, 4):
                    unit_cost = unit_cost * 108 // 100
                po = next_id("purchase_orders")
                received = received_day <= SNAPSHOT
                insert("purchase_orders", (
                    po, store_id, pid, timestamp(receipt_day - timedelta(days=7), 9), timestamp(receipt_day, 8),
                    timestamp(received_day, 8) if received else None, quantity, quantity if received else 0,
                    unit_cost, lot, reason,
                ))
                purchase_meta[po] = (store_id, pid, unit_cost, lot)
                if received_day < START:
                    stock[store_id, pid].append([po, quantity])
                elif received:
                    arrivals[received_day].append((store_id, pid, po, quantity))

    def available(store_id, pid):
        return sum(lot[1] for lot in stock[store_id, pid])

    def refund(oid_item, fid, delivered, quantity, unit_paid, unit_subsidy, po, channel, day):
        lot = purchase_meta[po][3]
        probability = .028 + (.065 if channel == 6 else 0)
        if lot == "L04-0906-A":
            probability += .27
        if rng.random() >= probability:
            return
        reason = "quality_defect" if lot == "L04-0906-A" else rng.choices(
            ["buyer_remorse", "not_as_described", "late_delivery", "quality_defect"], [45, 25, 20, 10]
        )[0]
        requested = delivered + timedelta(days=rng.randint(2, 13))
        if requested > SNAPSHOT:
            return
        completed = requested + timedelta(days=rng.randint(1, 4))
        returned = quantity if rng.random() < .7 else 1
        goodwill = rng.random() < .12
        if goodwill:
            customer_refund, subsidy_refund, returned = max(1, unit_paid * quantity // 8), 0, 0
        else:
            customer_refund, subsidy_refund = unit_paid * returned, unit_subsidy * returned
        complete = completed <= SNAPSHOT
        split = complete and customer_refund > 100 and rng.random() < .18
        chunks = [(customer_refund, subsidy_refund, returned, completed)]
        if split:
            first = customer_refund // 5
            chunks = [(first, 0, 0, completed - timedelta(days=1)), (customer_refund - first, subsidy_refund, returned, completed)]
        for amount, clawback, units, done in chunks:
            salable = units if complete and reason != "quality_defect" and rng.random() < .8 else 0
            restocked = done + timedelta(days=2)
            if restocked > SNAPSHOT:
                salable = 0
            insert("refund_requests", (
                next_id("refund_requests"), oid_item, fid, timestamp(requested, 10), timestamp(done, 15) if complete else None,
                "completed" if complete else "approved", amount, clawback, units, salable,
                timestamp(restocked, 8) if salable else None, reason,
            ))
            if salable:
                store_id, pid, _, _ = purchase_meta[po]
                restocks[restocked].append((store_id, pid, po, salable))
        if rng.random() < .12:
            insert("refund_requests", (
                next_id("refund_requests"), oid_item, fid, timestamp(requested, 9), None, "rejected",
                unit_paid * quantity, unit_subsidy * quantity, 0, 0, None, "duplicate_request",
            ))

    def add_order(day, mid, channel, pid):
        region, sales_store, _ = markets[mid]
        ship_store = sales_store
        sibling = sales_store + (1 if sales_store % 2 else -1)
        if rng.random() < .12 and available(sibling, pid) > 0:
            ship_store = sibling
        quantity = rng.choices([1, 2, 3], [88, 11, 1])[0]
        if available(ship_store, pid) < quantity:
            if available(ship_store, pid) == 0:
                return False
            quantity = 1
        kind = rng.choices(["customer_sale", "employee", "gift", "test"], [97, 1, 1, 1])[0]
        status = rng.choices(["completed", "pending_payment", "cancelled"], [95, 2, 3])[0]
        paid = status == "completed" or (status == "cancelled" and rng.random() < .6)
        hour, minute = rng.randint(9, 21), rng.randint(0, 59)
        paid_at = timestamp(day, hour, minute) if paid else None
        is_new = rng.random() < (.83 if channel == 6 else .07 if channel == 3 else .27)
        if is_new:
            cid = next_id("customers")
            insert("customers", (cid, mid, timestamp(day - timedelta(days=rng.randint(0, 10)), 8), paid_at if paid and kind == "customer_sale" else None, channel))
            customer_pool[mid].append(cid)
        else:
            cid = rng.choice(customer_pool[mid])
            if paid and kind == "customer_sale":
                cursor.execute("UPDATE customers SET first_paid_at=CASE WHEN first_paid_at IS NULL OR first_paid_at>? THEN ? ELSE first_paid_at END WHERE customer_id=?", (paid_at, paid_at, cid))
        oid = next_id("orders")
        campaign = CAMPAIGN_BY_CHANNEL.get(channel)
        sales_channel = "线下门店" if channel == 7 else rng.choices(["官网", "App", "平台店铺"], [45, 35, 20])[0]
        insert("orders", (oid, cid, sales_store, mid, channel, campaign, sales_channel, kind, status,
                          timestamp(day, max(0, hour - 1), minute), paid_at, 0, 0))
        basket = [(pid, quantity)]
        if rng.random() < .30:
            addon = rng.choice(addon_ids)
            if addon != pid and available(ship_store, addon) > 0:
                basket.append((addon, 1))
        total_paid, fulfillment_ids = 0, []
        for item_pid, units in basket:
            product = products[item_pid]
            price = product[4]
            discount_rate = rng.choice([0, 0, 0, .03, .05])
            if channel == 6:
                discount_rate = rng.choice([.10, .12, .15])
            if day >= date(2026, 8, 31) and item_pid == 4:
                discount_rate = max(discount_rate, .12)
            if kind == "employee":
                discount_rate = .30
            if kind == "gift":
                discount_rate = 1
            discount = int(price * discount_rate)
            unit_paid = price - discount
            subsidy = min(discount, price * 3 // 100) if sales_channel == "平台店铺" else 0
            item_id = next_id("order_items")
            phase = int(day >= date(2026, 8, 31))
            insert("order_items", (item_id, oid, item_pid, item_pid * 10 + phase, units, price, discount, unit_paid, subsidy))
            total_paid += unit_paid * units
            if status != "completed":
                if paid:
                    done = day + timedelta(days=1)
                    insert("refund_requests", (
                        next_id("refund_requests"), item_id, None, timestamp(day, 22), timestamp(done, 10) if done <= SNAPSHOT else None,
                        "completed" if done <= SNAPSHOT else "requested", unit_paid * units, 0, 0, 0, None, "cancel_before_shipping",
                    ))
                continue
            remaining = units
            while remaining:
                batch = stock[ship_store, item_pid][0]
                po, held = batch
                shipped = min(remaining, held)
                batch[1] -= shipped
                remaining -= shipped
                if batch[1] == 0:
                    stock[ship_store, item_pid].popleft()
                inventory[ship_store, item_pid][2] += shipped
                lag = rng.choices([1, 2, 3, 4, 9], [15, 45, 27, 10, 3])[0]
                delivered = day + timedelta(days=lag)
                fid = next_id("fulfillments")
                logistics = (5800 if item_pid in (1, 2) else 1600) + (700 if ship_store != sales_store else 0)
                fee = (unit_paid + subsidy) * shipped * 65 // 10000
                insert("fulfillments", (fid, item_id, ship_store, po, shipped, timestamp(day, 22),
                       timestamp(delivered, 16) if delivered <= SNAPSHOT else None, "云速快运" if lag < 9 else "经济大件", logistics, fee))
                fulfillment_ids.append((fid, delivered))
                refund(item_id, fid, delivered, shipped, unit_paid, subsidy, po, channel, day)
        freight = 0 if total_paid >= 39900 else 1200
        cursor.execute("UPDATE orders SET merchandise_paid_cents=?, freight_paid_cents=? WHERE order_id=?", (total_paid, freight, oid))
        if fulfillment_ids:
            cursor.execute("UPDATE fulfillments SET fulfillment_cost_cents=MAX(0, fulfillment_cost_cents-?) WHERE fulfillment_id=?", (freight, fulfillment_ids[0][0]))
            if any(delivered > SNAPSHOT for _, delivered in fulfillment_ids):
                cursor.execute("UPDATE orders SET status='paid' WHERE order_id=?", (oid,))
        if paid:
            touches = []
            if campaign:
                touches.append((campaign, datetime.fromisoformat(paid_at) - timedelta(hours=1), "click"))
            if rng.random() < .34:
                touches.append((3, datetime.fromisoformat(paid_at) - timedelta(hours=12), "view"))
            if campaign != 1 and rng.random() < .17:
                touches.append((1, datetime.fromisoformat(paid_at) - timedelta(days=2), "click"))
            for campaign_id, touched, touch_type in touches:
                insert("order_touches", (next_id("order_touches"), oid, campaign_id, touched.isoformat(sep=" "), touch_type))
            for campaign_id in {touch[0] for touch in touches}:
                claimed[day.isoformat(), campaign_id, mid][0] += 1
                claimed[day.isoformat(), campaign_id, mid][1] += total_paid
        return True

    for day in days(START, SNAPSHOT):
        inventory.clear()
        for key in expected_daily:
            inventory[key][0] = available(*key)
        for store_id, pid, po, quantity in arrivals[day]:
            stock[store_id, pid].append([po, quantity])
            inventory[store_id, pid][1] += quantity
        for store_id, pid, po, quantity in restocks[day]:
            stock[store_id, pid].append([po, quantity])
            inventory[store_id, pid][3] += quantity
        if day <= ORDER_END:
            for mid, (region, store_id, factor) in markets.items():
                shares = dict(BASE_SHARES)
                current = day >= date(2026, 8, 31)
                treatment = date(2026, 8, 31) <= day <= date(2026, 9, 20) and groups[mid] == "treatment"
                if current:
                    shares[6] = .30
                if treatment:
                    shares[1] -= .08
                    shares[2] -= .07
                    shares[3] += .15
                daily_factor = factor * (1.10 if day.weekday() >= 5 else 1) * rng.uniform(.93, 1.07)
                for channel, share in shares.items():
                    if share == 0:
                        continue
                    campaign = CAMPAIGN_BY_CHANNEL.get(channel)
                    for pid, product_share in distributions[channel].items():
                        views = poisson(rng, 420 * daily_factor * share * product_share)
                        if views == 0:
                            continue
                        carts = binomial(rng, views, .14 if channel == 6 else .16)
                        checkouts = binomial(rng, carts, .45 if channel == 6 else .50)
                        intents = binomial(rng, checkouts, .26 if channel == 6 else .40 if channel == 4 else .35)
                        stockouts, created = 0, 0
                        for _ in range(intents):
                            if add_order(day, mid, channel, pid):
                                created += 1
                            else:
                                stockouts += 1
                        unavailable = available(store_id, pid) == 0
                        out_views = max(stockouts, binomial(rng, views, .85 if unavailable else .01))
                        traffic.append((day.isoformat(), mid, channel, pid, views, carts, checkouts, created, min(views, out_views)))
                        if campaign:
                            ad_clicks[day.isoformat(), campaign, mid] += binomial(rng, views, .78)
                for campaign_id in (1, 2, 3, 4):
                    if campaign_id == 4 and not current:
                        continue
                    key = (day.isoformat(), campaign_id, mid)
                    clicks = ad_clicks[key]
                    cpc = CPC[campaign_id] * (1.25 if treatment and campaign_id == 1 else 1)
                    spend = int(clicks * cpc * rng.uniform(.94, 1.06))
                    conversions, value = claimed[key]
                    insert("ad_daily", (*key, clicks * rng.randint(14, 25) + rng.randint(30, 100), clicks, spend, conversions, value))
        for (store_id, pid), (opening, received, shipped, returned) in inventory.items():
            closing = available(store_id, pid)
            assert closing == opening + received + returned - shipped
            insert("inventory_daily", (day.isoformat(), store_id, pid, opening, received, shipped, returned, closing))
        if day.day in (1, 15):
            print(f"Generated through {day}", flush=True)

    cursor.executemany("INSERT INTO traffic_daily VALUES (?,?,?,?,?,?,?,?,?)", traffic)
    conn.commit()
    assert not conn.execute("PRAGMA foreign_key_check").fetchall()
    assert conn.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    conn.execute("ANALYZE")
    conn.close()
    os.replace(temporary, DATABASE)
    write_semantic(DATABASE)
    print(f"Built {DATABASE.name}: {DATABASE.stat().st_size / 1024 / 1024:.1f} MiB")


if __name__ == "__main__":
    generate()
