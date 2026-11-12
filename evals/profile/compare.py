"""Compare DuckDB profiles with fg-data-profiling on the same Parquet files."""

import argparse
import json
import math
import os
import subprocess
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import scipy
from data_profiling import ProfileReport, __version__
from data_profiling.config import Settings


ROOT = Path(__file__).resolve().parents[2]
TABLE_METRICS = ["row_count", "table_summary", "pearson", "spearman", "kendall", "cramers", "auto", "missing_correlation"]
COLUMN_METRICS = {
    "valid_count": "count",
    "null_count": "n_missing",
    "null_ratio": "p_missing",
    "distinct_count": "n_distinct",
    "distinct_ratio": "p_distinct",
    "unique_count": "n_unique",
    "unique_ratio": "p_unique",
    "is_unique": "is_unique",
    "min": "min",
    "max": "max",
    "mean": "mean",
    "sum": "sum",
    "stddev": "std",
    "variance": "variance",
    "median": "50%",
    "mad": "mad",
    "iqr": "iqr",
    "cv": "cv",
    "range": "range",
    "skewness": "skewness",
    "kurtosis": "kurtosis",
    "zero_count": "n_zeros",
    "zero_ratio": "p_zeros",
    "negative_count": "n_negative",
    "negative_ratio": "p_negative",
    "infinite_count": "n_infinite",
    "infinite_ratio": "p_infinite",
    "min_length": "min_length",
    "max_length": "max_length",
    "mean_length": "mean_length",
    "median_length": "median_length",
    "imbalance": "imbalance",
    "chi_squared": "chi_squared",
}
REFERENCE_TYPES = {"Numeric": "numeric", "Categorical": "string", "Boolean": "boolean", "DateTime": "date"}
MISSING = object()


def fixtures():
    timestamps = pd.date_range("2026-01-01", periods=12, freq="h", tz="UTC")
    yield "mixed", pa.table({
        "amount": [1., 2., 2., 4., 0., -1., None, 8., 3., 4., 6., 1.],
        "units": [2., 4., 7., 3., 1., None, 9., 7., 2., 4., 6., 2.],
        "region": ["West", "East", "West", "East", "East", "West", None, "East", "West", "West", "East", "West"],
        "channel": ["App", "App", "Web", "Web", "Web", "App", "App", None, "App", "Web", "Web", "App"],
        "flag": [True, True, False, False, True, False, None, True, False, True, False, True],
        "day": pa.array([*timestamps[:-1], timestamps[0]], type=pa.timestamp("ns", tz="UTC")),
    }), {"amount": "Numeric", "units": "Numeric", "region": "Categorical", "channel": "Categorical",
         "flag": "Boolean", "day": "DateTime"}
    yield "nonfinite", pa.table({
        "amount": pa.array([0., None, np.nan, np.inf, -np.inf, -1., 0., 1., 2.], type=pa.float64()),
        "units": [1., 2., 2., None, 0., 1., 1., 3., 4.],
        "region": ["A", "A", "B", "B", None, "A", "A", "B", "B"],
    }), {"amount": "Numeric", "units": "Numeric", "region": "Categorical"}


def json_value(value):
    if value is pd.NA or value is pd.NaT:
        return None
    if isinstance(value, datetime):
        return pd.Timestamp(value).value // 1_000_000
    if isinstance(value, timedelta):
        return pd.Timedelta(value).value // 1_000_000
    if isinstance(value, np.ndarray):
        return [json_value(item) for item in value]
    if isinstance(value, np.generic):
        return json_value(value.item())
    if isinstance(value, (tuple, list)):
        return [json_value(item) for item in value]
    if isinstance(value, dict):
        return {key: json_value(item) for key, item in value.items()}
    if isinstance(value, float) and not math.isfinite(value):
        return None if math.isnan(value) else ("Infinity" if value > 0 else "-Infinity")
    return value


def equal(left, right):
    if isinstance(left, dict) and isinstance(right, dict):
        return left.keys() == right.keys() and all(equal(left[key], right[key]) for key in left)
    if isinstance(left, list) and isinstance(right, list):
        return len(left) == len(right) and all(equal(a, b) for a, b in zip(left, right))
    if type(left) is bool or type(right) is bool:
        return type(left) is type(right) and left == right
    if isinstance(left, (int, float)) and isinstance(right, (int, float)):
        return left == right if isinstance(left, int) and isinstance(right, int) else math.isclose(
            left, right, rel_tol=1e-10, abs_tol=1e-12,
        )
    return left == right


def cli(*args, payload=None):
    result = subprocess.run(
        ["node", str(ROOT / "lib/cli/index.js"), *args], cwd=ROOT, check=True, text=True,
        input=json.dumps(payload) if payload is not None else None, capture_output=True,
        env={**os.environ, "OPENAI_API_KEY": ""},
    )
    return json.loads(result.stdout)


def compare(path, types):
    metrics = [*TABLE_METRICS, *COLUMN_METRICS, "value_counts", "histogram", "quantiles", "nan_count", "word_counts", "character_counts", "monotonicity",
               {"id": "row_duplicates", "limit": 0}, {"id": "row_sample", "head": 3, "tail": 3}]
    dataset = cli("source", str(path), "--engine", "duckdb")["datasetId"]
    try:
        actual = cli("profile", dataset, "--options", "-", payload={"metrics": metrics, "semantics": "data-profiling"})["models"][0]
        quality = cli("quality", dataset, "--rules", "uniform")["models"][0]["alerts"]
    finally:
        cli("dispose", dataset)

    config = Settings(
        progress_bar=False, pool_size=1, infer_dtypes=False, missing_diagrams={"bar": False, "matrix": False, "heatmap": False},
        interactions={"continuous": False}, samples={"head": 3, "tail": 3, "random": 0},
        vars={"num": {"low_categorical_threshold": 0, "chi_squared_threshold": 0.999},
              "cat": {"length": True, "characters": True, "words": True}},
        correlations={method: {"calculate": True} for method in ("pearson", "spearman", "kendall", "cramers", "auto")},
    )
    frame = pd.read_parquet(path)
    expected = ProfileReport(frame, config=config, type_schema=types).get_description()
    checks = []

    def check(name, received, reference):
        reference = json_value(reference)
        if received is MISSING:
            checks.append({"metric": name, "status": "missing_ava", "reference": reference})
            return
        checks.append({"metric": name, "status": "match" if equal(received, reference) else "different",
                       "ava": received, "reference": reference})

    summary = actual["metrics"]["table_summary"]
    for native, source in {"row_count": "n", "column_count": "n_var", "null_cell_count": "n_cells_missing",
                           "null_cell_ratio": "p_cells_missing", "columns_with_nulls": "n_vars_with_missing",
                           "all_null_columns": "n_vars_all_missing"}.items():
        check(f"table.{native}", summary[native], expected.table[source])
    check("table.row_duplicates.group_count", actual["metrics"]["row_duplicates"]["group_count"], expected.table["n_duplicates"])
    check("quality.uniform", sorted(alert["column"] for alert in quality),
          sorted(alert.column_name for alert in expected.alerts if alert.alert_type.name == "UNIFORM"))
    for sample in expected.sample:
        received = actual["metrics"]["row_sample"][sample.id]
        for row in received:
            for name, value in row["row_values"].items():
                if types[name] == "DateTime" and value is not None:
                    row["row_values"][name] = json_value(pd.Timestamp(value))
        check(f"table.row_sample.{sample.id}", received,
              [{"index": int(index), "row_values": row.to_dict()} for index, row in sample.data.iterrows()])
    missing = frame.isna()
    partial = [name for name in frame if 0 < missing[name].sum() < len(frame)]
    check("table.missing_correlation", actual["metrics"]["missing_correlation"],
          {"columns": partial, "matrix": missing[partial].corr().to_numpy()} if len(partial) >= 2 else None)

    for column in actual["columns"]:
        name, observed = column["name"], column["metrics"]
        reference = expected.variables[name]
        check(f"{name}.type", column["properties"]["logicalType"], REFERENCE_TYPES[reference["type"]])
        for native, source in COLUMN_METRICS.items():
            if source in reference:
                check(f"{name}.{native}", observed.get(native, MISSING), reference[source])
        if "monotonic" in reference:
            check(f"{name}.monotonicity", observed.get("monotonicity", MISSING), {
                "increasing": reference["monotonic_increase"], "decreasing": reference["monotonic_decrease"],
                "strictly_increasing": reference["monotonic_increase_strict"],
                "strictly_decreasing": reference["monotonic_decrease_strict"], "direction": reference["monotonic"],
            })
        if "histogram" in reference:
            counts, edges = reference["histogram"]
            if reference["type"] == "DateTime":
                edges = edges * 1000
            check(f"{name}.histogram", observed.get("histogram", MISSING), {"counts": counts, "bin_edges": edges})
        if "5%" in reference:
            check(f"{name}.quantiles", observed.get("quantiles", MISSING), [
                {"probability": p, "value": reference[f"{p:.0%}"]} for p in (0.05, 0.25, 0.5, 0.75, 0.95)
            ])
        for native, source in (("value_counts", "value_counts_without_nan"), ("word_counts", "word_counts"),
                               ("character_counts", "character_counts")):
            if source in reference and reference["type"] != "DateTime":
                frequencies = [{"value": json_value(value), "count": int(count)}
                               for value, count in reference[source].items()]
                key = lambda entry: json.dumps(entry["value"], sort_keys=True)
                received = sorted(observed[native], key=key) if native in observed else MISSING
                check(f"{name}.{native}", received, sorted(frequencies, key=key))

    for method in ("pearson", "spearman", "kendall", "cramers", "auto"):
        native = actual["metrics"].get(method)
        reference = expected.correlations.get(method)
        if native is not None and reference is not None and set(native["columns"]) == set(reference.columns):
            columns = native["columns"]
            check(f"table.{method}", native, {"columns": columns, "matrix": reference.loc[columns, columns].to_numpy()})
        else:
            check(f"table.{method}.columns", native and sorted(native["columns"]),
                  sorted(reference.columns) if reference is not None else None)
    return checks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict", action="store_true", help="Fail if any compared metric differs")
    args = parser.parse_args()
    results = {}
    with tempfile.TemporaryDirectory(prefix="ava-profile-parity-") as directory:
        for name, table, types in fixtures():
            path = Path(directory) / f"{name}.parquet"
            pq.write_table(table, path)
            results[name] = compare(path, types)
    print(json.dumps({"reference": {"data_profiling": __version__, "pandas": pd.__version__,
                                   "numpy": np.__version__, "scipy": scipy.__version__}, "fixtures": results},
                     indent=2, ensure_ascii=False, allow_nan=False))
    return int(args.strict and any(check["status"] != "match" for checks in results.values() for check in checks))


if __name__ == "__main__":
    raise SystemExit(main())
