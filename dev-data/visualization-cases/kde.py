import numpy as np

assert set(df.period) == {"基期", "本期"} and len(df) == 4000
assert (df.amount > 0).all() and not df.isna().any().any()
bandwidth = 1.06 * df.amount.std(ddof=1) * 2000 ** (-0.2)
grid = np.linspace(0, 2400, 121)
rows = []
for period in ["基期", "本期"]:
    amounts = df.loc[df.period == period, "amount"].to_numpy()
    # Reflect at zero to keep the order-amount density on its nonnegative domain.
    z = (grid[:, None] - amounts) / bandwidth
    reflected = (grid[:, None] + amounts) / bandwidth
    density = (np.exp(-z * z / 2) + np.exp(-reflected * reflected / 2)).mean(axis=1) / (bandwidth * np.sqrt(2 * np.pi))
    assert abs(np.trapz(density, grid) - 1) < 0.01
    for amount, value in zip(grid, density):
        rows.append({"period": period, "amount": float(amount), "density_per_1000": float(value * 1000),
                     "mean": float(amounts.mean()), "sample_size": len(amounts), "bandwidth": float(bandwidth),
                     "below_600_pct": float((amounts < 600).mean() * 100),
                     "above_1100_pct": float((amounts > 1100).mean() * 100)})
result = pd.DataFrame(rows)
