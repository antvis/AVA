import numpy as np

assert df.store_id.is_unique and len(df) == 120
features = df[["monthly_orders", "avg_order_value"]].to_numpy(dtype=float)
assert np.isfinite(features).all() and (features > 0).all()
scaled = (features - features.mean(axis=0)) / features.std(axis=0)


def kmeans(values, k, seed):
    rng = np.random.default_rng(seed)
    centers = [values[rng.integers(len(values))]]
    for _ in range(k - 1):
        distances = ((values[:, None] - np.array(centers)) ** 2).sum(axis=2).min(axis=1)
        centers.append(values[rng.choice(len(values), p=distances / distances.sum())])
    centers = np.array(centers)
    for _ in range(100):
        labels = ((values[:, None] - centers) ** 2).sum(axis=2).argmin(axis=1)
        assert len(np.unique(labels)) == k
        updated = np.array([values[labels == label].mean(axis=0) for label in range(k)])
        if np.allclose(updated, centers, atol=1e-8):
            break
        centers = updated
    inertia = float(((values - centers[labels]) ** 2).sum())
    return inertia, labels


# Check the Lloyd iterations and initialization against two unambiguous groups.
test = np.array([[0., 0.], [0., 1.], [10., 10.], [10., 11.]])
_, check = kmeans(test, 2, 1)
assert check[0] == check[1] and check[2] == check[3] and check[0] != check[2]

distances = np.sqrt(((scaled[:, None] - scaled[None, :]) ** 2).sum(axis=2))
candidates = []
for k in range(2, 6):
    inertia, labels = min((kmeans(scaled, k, seed) for seed in range(10)), key=lambda run: run[0])
    silhouettes = []
    for i, label in enumerate(labels):
        same = labels == label
        same[i] = False
        if not same.any():
            silhouettes.append(0.)
            continue
        a = distances[i, same].mean()
        b = min(distances[i, labels == other].mean() for other in range(k) if other != label)
        silhouettes.append((b - a) / max(a, b))
    candidates.append((float(np.mean(silhouettes)), k, labels))

score, selected_k, labels = max(candidates, key=lambda candidate: candidate[0])
assert selected_k == 3 and score > 0.5
ordered = sorted(range(selected_k), key=lambda label: -features[labels == label, 0].mean())
names = dict(zip(ordered, ["高频低客单", "中频中客单", "低频高客单"]))
result = df.copy()
result["cluster"] = [names[label] for label in labels]
result["selected_k"] = selected_k
result["silhouette"] = score
