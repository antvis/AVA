"""Independently check money calculations against raw rows, using Decimal rounding."""

import sqlite3
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def verify():
    conn = sqlite3.connect(f"file:{ROOT / 'sales-investment.sqlite'}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    assert conn.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    assert not conn.execute("PRAGMA foreign_key_check").fetchall()
    assert conn.execute("""SELECT COUNT(*) FROM inventory_daily
        WHERE closing_quantity != opening_quantity + received_quantity + restocked_quantity - shipped_quantity
           OR closing_quantity < 0""").fetchone()[0] == 0
    assert conn.execute("""SELECT COUNT(*) FROM orders o WHERE merchandise_paid_cents !=
        (SELECT SUM(quantity * unit_customer_paid_cents) FROM order_items i WHERE i.order_id = o.order_id)""").fetchone()[0] == 0
    refunds = defaultdict(lambda: [0, 0])
    for row in conn.execute("""SELECT * FROM refund_requests WHERE status='completed'
        AND completed_at <= '2026-10-18 23:59:59' AND fulfillment_id IS NOT NULL"""):
        refunds[row["fulfillment_id"]][0] += row["refund_customer_cents"] + row["clawback_subsidy_cents"]
        if row["restocked_at"] and row["restocked_at"] <= "2026-10-18 23:59:59":
            refunds[row["fulfillment_id"]][1] += row["restocked_quantity"]
    expected = {}
    for row in conn.execute("""SELECT f.*, o.order_kind, o.paid_at, o.status,
        i.unit_customer_paid_cents, i.unit_platform_subsidy_cents,
        t.revenue_mode, t.commission_bps, po.unit_cost_cents
        FROM fulfillments f JOIN order_items i USING(order_item_id)
        JOIN orders o USING(order_id) JOIN commercial_terms t USING(term_id)
        JOIN purchase_orders po USING(purchase_order_id)"""):
        if (row["order_kind"] != "customer_sale" or not row["paid_at"]
                or row["status"] not in ("paid", "completed") or not row["delivered_at"]
                or row["delivered_at"] > "2026-10-18 23:59:59"):
            continue
        refund, restock = refunds[row["fulfillment_id"]]
        base = row["quantity"] * (row["unit_customer_paid_cents"] + row["unit_platform_subsidy_cents"]) - refund
        assert base >= 0 and 0 <= restock <= row["quantity"]
        revenue = base if row["revenue_mode"] == "owned" else int(
            (Decimal(base) * row["commission_bps"] / 10000).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
        cogs = (row["quantity"] - restock) * row["unit_cost_cents"] if row["revenue_mode"] == "owned" else 0
        contribution = revenue - cogs - row["fulfillment_cost_cents"] - row["payment_fee_cents"]
        expected[row["fulfillment_id"]] = (revenue, cogs, contribution)
    sql = (ROOT / "financial-model.sql").read_text()
    actual = {r["fulfillment_id"]: (r["net_sales_cents"], r["net_cogs_cents"], r["contribution_before_ads_cents"])
              for r in conn.execute(sql)}
    assert len(actual) > 10000 and expected == actual
    conn.close()
    print(f"Verified database integrity, inventory equations, order amounts and {len(actual):,} financial rows.")


if __name__ == "__main__":
    verify()
