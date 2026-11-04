"""Deterministic mock inputs for the two AVA 4.0 visualization cases."""

from pathlib import Path

import numpy as np
import pandas as pd

root = Path(__file__).parent
rng = np.random.default_rng(20261027)

baseline = rng.lognormal(np.log(780), 0.22, 2000)
current = np.concatenate([rng.normal(500, 70, 1200), rng.normal(1250, 110, 800)])
assert np.all(current > 0)
orders = pd.concat([
    pd.DataFrame({"period": period, "amount": np.round(values / values.mean() * 800, 2)})
    for period, values in [("基期", baseline), ("本期", current)]
], ignore_index=True)
assert len(orders) == 4000 and abs(orders.groupby("period").amount.mean().diff().dropna().iloc[0]) < 0.01
orders.to_csv(root / "orders.csv", index=False)

stores = []
for center_orders, center_amount, order_sd, amount_sd in [(1200, 360, 135, 55), (670, 740, 100, 85), (310, 1380, 65, 130)]:
    for _ in range(40):
        count = max(1, round(rng.normal(center_orders, order_sd)))
        amount = round(max(1, rng.normal(center_amount, amount_sd)), 2)
        stores.append({"store_id": f"S{len(stores) + 1:03d}", "monthly_orders": count,
                       "avg_order_value": amount, "sales": round(count * amount, 2)})
stores = pd.DataFrame(stores)
assert len(stores) == stores.store_id.nunique() == 120
stores.to_csv(root / "stores.csv", index=False)
print("Generated 4,000 order observations and 120 stores.")
