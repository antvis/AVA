"""Build AVA Semantic definitions from the SQLite contract and business annotations."""

import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parent

# Each entry follows physical column order; a schema change must update its annotations.
TABLES = {
    "stores": ("门店维表，一行一个门店；销售责任门店与实际发货门店须分别关联。", [
        "门店主键", "门店名称", "门店所属大区", "门店所在城市"]),
    "markets": ("市场维表，一行一个顾客市场；市场也是预算实验的随机分配单位。", [
        "市场主键", "市场名称", "市场所属大区，实验分层使用", "默认服务门店；实际发货可跨门店"]),
    "channels": ("获客渠道维表；渠道来源不等于广告的因果贡献。", [
        "渠道主键", "渠道名称", "渠道类型：organic自然、direct直接、paid付费、offline线下"]),
    "products": ("商品维表，一行一个SKU；当前标价不能替代历史成交单价。", [
        "商品主键", "唯一SKU编码", "商品名称", "商品品类", "当前商品标价单价，非历史实付"]),
    "commercial_terms": ("按有效期版本化的商品商务条款；以订单明细term_id匹配成交时条款，不能仅按product_id连接。", [
        "条款版本主键", "条款对应商品", "条款生效日期，含当天", "条款失效日期，含当天",
        "owned自营确认净货款；consignment代销仅确认净货款的佣金",
        "佣金比例，基点；10000表示100%；代销净结算基数乘此比例后按交付四舍五入到分", "供应商名称"]),
    "customers": ("CRM顾客维表，包含数据窗口之前的首购信息；库内首次订单不等于首购。", [
        "顾客主键", "顾客所属市场", "CRM注册时间", "CRM历史首次支付时间；无支付为空", "顾客最初获客渠道，区别于每次订单来源"]),
    "campaigns": ("广告活动维表；平台归因允许活动间重复，不能视作增量收入。", [
        "广告活动主键", "广告活动名称", "活动所属渠道", "活动开始日期", "活动结束日期",
        "平台归因窗口天数", "平台归因方法", "目标受众说明"]),
    "experiments": ("预算实验设计，一行一个实验；分组必须结合experiment_assignments，不按触点筛选样本。", [
        "实验主键", "实验名称", "被调整预算的活动", "随机分配单位", "随机分配方法",
        "前期开始日期", "前期结束日期", "实验期开始日期", "实验期结束日期", "实验干预说明"]),
    "experiment_assignments": ("一行一个实验×市场的事前分组；按分配组纳入所有渠道支付订单，市场为统计单位。", [
        "实验编号，联合主键之一", "市场编号，联合主键之一", "随机化分层", "control对照组、treatment实验组", "分配时间，早于实验开始"]),
    "purchase_orders": ("一行一个门店商品采购批次；实际批次成本与到货时间是库存、质量、利润分析依据。", [
        "采购批次主键", "入库门店", "采购商品", "采购下单时间", "预计到货时间", "实际到货时间；未到货为空",
        "采购数量", "实际收到数量", "该采购批次商品单位成本", "供应商生产批号，可跨门店采购单重复", "延期原因；无记录为空"]),
    "orders": ("一行一单；连接明细、交付、退款、触点后不可重复汇总整单金额。收入不使用支付日期归期。", [
        "订单主键", "下单顾客", "销售责任门店，收入地域归属使用此字段", "顾客市场，实验分组使用此字段",
        "本次交易来源渠道", "本次交易来源活动；非广告订单为空，不代表因果归因", "销售场景：线上或线下",
        "customer_sale外部销售、employee员工内购、gift赠品、test测试；净销售额只含customer_sale",
        "pending_payment待付、cancelled取消、paid已付部分或尚未交付、completed全部交付；退款不重写此状态",
        "下单时间", "实际支付时间，未支付为空", "整单商品实付，退款前、不含运费；不可在连接明细后重复求和", "顾客支付运费，不计商品销售额"]),
    "order_items": ("一行一个订单商品明细；可拆为多个采购批次交付。各单价为成交时历史值。", [
        "订单明细主键", "所属订单", "明细商品", "成交时条款版本，优先按此键关联条款", "原购买数量",
        "成交时商品标价单价", "每件商家折扣，实付已扣除，不能重复扣", "每件商品顾客实付，标价减折扣", "每件平台承担补贴，属于商品结算基数"]),
    "fulfillments": ("一行一笔商品交付，按采购批次拆分；收入以已交付部分确认，需先汇总退款再连接。", [
        "交付主键，财务派生模型的唯一粒度", "所属订单明细", "实际发货门店，不替代销售责任门店",
        "实际出库采购批次，连接成本及生产批号", "本次交付件数", "发货时间", "交付完成时间，未交付为空；净销售额按此日归期",
        "承运商", "本笔履约成本，已抵减顾客承担运费", "本笔支付手续费，退款不会自动返还"]),
    "refund_requests": ("一行一次退款申请，同一交付可有多笔部分退款及被拒重复申请；必须按fulfillment_id先聚合。", [
        "退款申请主键", "退款所属明细", "对应交付；发货前取消退款为空，不属于已交付收入的扣减",
        "申请时间", "退款完成时间；未完成为空",
        "requested申请、approved批准未完成、completed已完成、rejected拒绝；只扣快照日前completed",
        "退还顾客的商品款，不含运费", "向平台退回的商品补贴", "本申请实际退货件数；部分补偿可为0",
        "实际可再次销售且已回仓的数量，只有此数量冲回成本", "实际回仓时间；未回仓为空", "退款原因代码"]),
    "order_touches": ("一行一次可观测营销触点；同单可多活动、多次点击或曝光，不可直接连接后汇总收入。", [
        "触点主键", "对应订单", "对应广告活动", "触点时间", "click点击、view曝光；观测到触点不证明增量效果"]),
    "ad_daily": ("一行日期×活动×市场；广告花费可加，平台归因订单及金额跨活动可重复。与销售先各自聚合后连接。", [
        "广告发生日期，平台归因值按订单支付日", "广告活动，联合主键之一", "市场，联合主键之一", "曝光次数", "点击次数",
        "广告花费", "平台归因订单数，含后续取消等情况；不同活动间可能重复", "平台归因商品实付全额，退款前、代销未转佣金；不是公司收入"]),
    "traffic_daily": ("一行日期×市场×获客渠道×商品；页面浏览是PV，跨商品求和不能称为去重UV。", [
        "浏览发生日期", "市场", "获客渠道", "商品", "商品页面浏览次数，非去重用户数", "加购次数", "发起结算次数", "成功创建订单次数，含后续未付和取消", "显示缺货提示的商品浏览次数"]),
    "inventory_daily": ("一行日期×发货门店×商品的库存流水；日末=日初+到货+可售退货回仓−发货，日末库存不可跨日期求和。", [
        "库存快照日期", "库存所属门店", "商品", "日初库存件数", "当日采购到货件数", "当日发货件数", "当日可售退货回仓件数", "日末库存件数；需取指定日期或日均，不能累计为库存"]),
}


def measure(name, expression, description, unit="CNY_cent", type_="BIGINT"):
    return {"name": name, "expression": expression, "type": type_,
            "description": description, "properties": {"unit": unit}}


def dimension(name, type_="INTEGER", expression=None):
    return {"name": name, "expression": expression or name, "type": type_}


def write_semantic(database=ROOT / "sales-investment.sqlite"):
    conn = sqlite3.connect(f"file:{database}?mode=ro", uri=True)
    models, relationships = [], []
    tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}
    assert tables == TABLES.keys(), "Annotate every physical table before rebuilding semantic.json"
    for table, (description, descriptions) in TABLES.items():
        fields = conn.execute(f'PRAGMA table_info("{table}")').fetchall()
        indexes = conn.execute(f'PRAGMA index_list("{table}")').fetchall()
        has_pk_index = any(index[3] == "pk" for index in indexes)
        assert len(fields) == len(descriptions), f"Update field annotations: {table}"
        keys = [field[1] for field in sorted(fields, key=lambda f: f[5]) if field[5]]
        columns = []
        for (_, name, type_, not_null, _, pk), label in zip(fields, descriptions):
            properties = {"description": label}
            if name.endswith("_cents"):
                properties["unit"] = "CNY_cent"
            elif name == "commission_bps":
                properties["unit"] = "basis_point"
            columns.append({"name": name, "type": type_, "notNull": bool(not_null or (pk and not has_pk_index)),
                            "isPrimaryKey": bool(pk), "properties": properties})
        model = {"name": table, "tableReference": {"table": table}, "primaryKey": keys[0] if len(keys) == 1 else keys,
                 "properties": {"description": description}, "columns": columns}
        unique = []
        for index in indexes:
            if index[2] and index[3] != "pk":
                names = [r[2] for r in conn.execute(f'PRAGMA index_info("{index[1]}")')]
                unique.append(names[0] if len(names) == 1 else names)
        if unique:
            model["uniqueKeys"] = unique
        models.append(model)
        for (_, _, target, source_column, target_column, *_) in conn.execute(f'PRAGMA foreign_key_list("{table}")'):
            relationships.append({
                "name": f"{table}_{source_column}_to_{target}", "models": [table, target],
                "joinType": "MANY_TO_ONE", "condition": f'"{table}"."{source_column}" = "{target}"."{target_column}"',
                "properties": {"description": f"{table}.{source_column}对应{target}.{target_column}；按事实表粒度防止重复汇总。"},
            })

    sql = (ROOT / "financial-model.sql").read_text()
    derived = conn.execute(f"SELECT * FROM ({sql}) LIMIT 0")
    physical_labels = {c["name"]: c["properties"]["description"] for m in models for c in m["columns"]}
    labels = {
        "market_name": "顾客市场名称", "selling_region": "销售责任大区", "selling_city": "销售责任城市",
        "paid_date": "订单支付日期，获客批次及实验归期使用", "delivered_date": "交付完成日期，经营收入归期使用",
        "customer_type": "new为CRM首购同日的订单；returning为更早已首购的顾客；不是逐订单的首次标记",
        "delivered_quantity": "本交付记录原交付件数，未扣退货", "gross_settlement_cents": "本交付商品实付加平台补贴，退款前，代销未转佣金",
        "refund_cents": "本交付快照日前已完成的商品退款加补贴追回；按交付预聚合，代销未转佣金",
        "net_cogs_cents": "自营批次成本减已回仓可售退货成本；代销为0",
        "net_sales_cents": "净销售额：自营净结算全额、代销净结算乘佣金比例；每笔交付四舍五入到分",
        "gross_profit_cents": "商品毛利，净销售额减净商品成本",
        "contribution_before_ads_cents": "履约后贡献，商品毛利减履约成本及支付手续费，未扣广告与固定费用",
    }
    text_columns = {"market_name", "store_name", "selling_region", "selling_city", "sku", "product_name", "category",
                    "channel_name", "channel_type", "sales_channel", "revenue_mode", "lot_code", "paid_date", "delivered_date", "customer_type"}
    financial_columns = []
    for field in derived.description:
        name = field[0]
        properties = {"description": labels[name] if name in labels else physical_labels[name]}
        if name.endswith("_cents"):
            properties["unit"] = "CNY_cent"
        financial_columns.append({"name": name, "type": "TEXT" if name in text_columns else "BIGINT", "properties": properties})
    models.append({"name": "delivered_sales", "refSql": sql, "dialect": "duckdb", "primaryKey": "fulfillment_id",
                   "columns": financial_columns, "properties": {
                       "description": "已交付外部客户销售，一行一笔交付；快照截至2026-10-18。先聚合有效退款再连接，避免多笔退款重复计数。",
                       "execution": "逻辑模型不会自动建表。查询须将refSql展开为CTE delivered_sales或子查询。",
                       "time_rule": "经营复盘按delivered_date；投放实验按paid_date，二者不可混用。"}})

    financial_dimensions = [dimension(n, "TEXT" if n in text_columns else "BIGINT") for n in (
        "selling_region", "selling_city", "sales_store_id", "store_name", "market_id", "market_name",
        "category", "product_id", "sku", "product_name", "acquisition_channel_id", "channel_name", "channel_type",
        "acquisition_campaign_id", "sales_channel", "revenue_mode", "customer_type", "lot_code", "fulfillment_store_id")]
    cubes = [{
        "name": "sales_finance", "baseObject": "delivered_sales",
        "measures": [
            measure("net_sales", "SUM(net_sales_cents)", "净销售额，分；展示元时除以100", type_="HUGEINT"),
            measure("effective_orders", "COUNT(DISTINCT order_id)", "已交付有效订单数；不同商品分组间不可直接相加", "order"),
            measure("gross_profit", "SUM(gross_profit_cents)", "商品毛利，分", type_="HUGEINT"),
            measure("contribution_before_ads", "SUM(contribution_before_ads_cents)", "履约后贡献，尚未扣广告及固定费用", type_="HUGEINT"),
            measure("net_aov", "SUM(net_sales_cents) * 1.0 / NULLIF(COUNT(DISTINCT order_id), 0)", "净客单价，分/单；不能平均分组客单价", "CNY_cent/order", "DOUBLE"),
            measure("net_margin", "SUM(gross_profit_cents) * 1.0 / NULLIF(SUM(net_sales_cents), 0)", "商品毛利率，分子分母均按同一范围汇总", "ratio", "DOUBLE"),
        ],
        "dimensions": financial_dimensions,
        "timeDimensions": [dimension(n, "DATE", f"CAST({n} AS DATE)") for n in ("delivered_date", "paid_date")],
        "hierarchies": {"sales_geography": ["selling_region", "selling_city", "sales_store_id"], "product": ["category", "product_id"]},
        "properties": {"default_time_dimension": "delivered_date", "join_rule": "广告花费另按相同期间/市场聚合，不能与交付逐行连接后求和。退款率另按原交付成熟队列核算。"},
    }, {
        "name": "advertising", "baseObject": "ad_daily",
        "measures": [
            measure("spend", "SUM(spend_cents)", "广告花费", type_="HUGEINT"),
            measure("clicks", "SUM(clicks)", "广告点击次数", "click", "HUGEINT"),
            measure("platform_attributed_value", "SUM(platform_reported_value_cents)", "平台归因商品款；跨活动可重复，非公司收入", type_="HUGEINT"),
            measure("platform_roas", "SUM(platform_reported_value_cents) * 1.0 / NULLIF(SUM(spend_cents), 0)", "平台口径ROAS，不代表增量收益或利润", "ratio", "DOUBLE"),
        ], "dimensions": [dimension("campaign_id"), dimension("market_id")],
        "timeDimensions": [dimension("day", "DATE", "CAST(day AS DATE)")],
    }, {
        "name": "product_funnel", "baseObject": "traffic_daily",
        "measures": [
            measure("product_views", "SUM(product_views)", "商品浏览PV，不是UV", "view", "HUGEINT"),
            measure("created_orders", "SUM(orders_created)", "创建订单次数，含后续取消和未付款", "order", "HUGEINT"),
            measure("view_to_order_rate", "SUM(orders_created) * 1.0 / NULLIF(SUM(product_views), 0)", "浏览到创建订单率，非支付转化率", "ratio", "DOUBLE"),
            measure("out_of_stock_view_rate", "SUM(out_of_stock_views) * 1.0 / NULLIF(SUM(product_views), 0)", "商品浏览中缺货提示比例，不能直接等同损失收入", "ratio", "DOUBLE"),
        ], "dimensions": [dimension(n) for n in ("market_id", "channel_id", "product_id")],
        "timeDimensions": [dimension("day", "DATE", "CAST(day AS DATE)")],
    }, {
        "name": "inventory_flow", "baseObject": "inventory_daily",
        "measures": [
            measure("received_units", "SUM(received_quantity)", "期间采购到货件数", "unit", "HUGEINT"),
            measure("shipped_units", "SUM(shipped_quantity)", "期间发货件数", "unit", "HUGEINT"),
            measure("restocked_units", "SUM(restocked_quantity)", "期间可售退货回仓件数", "unit", "HUGEINT"),
            measure("zero_closing_store_product_days", "SUM(CASE WHEN closing_quantity = 0 THEN 1 ELSE 0 END)", "日末零库存的门店商品天数，不代表全天无货", "store_product_day", "HUGEINT"),
        ], "dimensions": [dimension("store_id"), dimension("product_id")],
        "timeDimensions": [dimension("day", "DATE", "CAST(day AS DATE)")],
        "properties": {"stock_rule": "opening_quantity和closing_quantity是时点库存，不跨日期求和；日末库存需限定同一日期。"},
    }]
    semantic = {
        "description": "办公用品零售合成数据的经营分析语义模型。净销售额采用已交付外部客户销售的确认净收入；自营确认净货款，代销仅确认佣金。完整口径见properties.business_rules。",
        "properties": {
            "currency": "CNY", "amount_storage": "integer cents", "timezone": "Asia/Shanghai", "synthetic": True,
            "snapshot_at": "2026-10-18 23:59:59",
            "default_current_period": ["2026-08-31", "2026-09-27"],
            "default_baseline_period": ["2026-08-03", "2026-08-30"],
            "business_rules": (ROOT / "business-context.md").read_text(),
        }, "models": models, "relationships": relationships, "cubes": cubes,
    }
    conn.close()
    (ROOT / "semantic.json").write_text(json.dumps(semantic, ensure_ascii=False, indent=2) + "\n")
    print(f"Built semantic.json: {len(models)} models, {len(relationships)} relationships, {len(cubes)} cubes")


if __name__ == "__main__":
    write_semantic()
