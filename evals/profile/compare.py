"""Compare DuckDB profiles with fg-data-profiling on the same Parquet files."""

import argparse
import json
import math
import os
import subprocess
import tempfile
import warnings
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import scipy
from PIL import Image
from data_profiling import ProfileReport, __version__
from data_profiling.config import Settings
from data_profiling.model.pandas.describe_timeseries_pandas import compute_gap_stats, get_fft, get_fft_peaks, stationarity_test
from data_profiling.model.pandas.timeseries_index_pandas import pandas_get_time_index_description
from data_profiling.model.pairwise import get_scatter_tasks
from data_profiling.report.presentation.frequency_table_utils import extreme_obs_table
from data_profiling.visualisation.charts.builders import acf_pacf, missing_matrix, scatter, timeseries


ROOT = Path(__file__).resolve().parents[2]
TABLE_METRICS = ["row_count", "table_summary", "pearson", "spearman", "kendall", "cramers", "auto", "missing_correlation",
                 "missing_matrix", "missing_bands", "scatter_pairs"]
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
REFERENCE_TYPES = {"Numeric": "numeric", "Categorical": "string", "Text": "string", "Boolean": "boolean",
                   "DateTime": "date", "URL": "string", "Path": "string", "File": "string", "Image": "string",
                   "TimeSeries": "numeric", "Unsupported": "unknown"}
MISSING = object()
os.environ.setdefault("LOKY_MAX_CPU_COUNT", "1")


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
    yield "unicode", pa.table({
        'quoted "label"': ["Straße!"] * 4 + ["e\u0301  É"] * 5 + ["İSTANBUL\u00a0ΟΣ"] * 2
                          + ["", None, "👩\u200d💻 中文\u0378\U0001f7f0"],
        "case": ["A"] * 4 + ["AB"] * 3 + ["ABC"] * 2 + ["A😀CD"] + ["ABCDEF"] * 3 + [""],
        "score": [0, 1, 2, 5, 3, 2, 1, 2, 6, 7, 8, 8, 9, 11],
    }), {'quoted "label"': "Categorical", "case": "Categorical", "score": "Numeric"}
    yield "sparse", pa.table({
        "single": [None, 3., None, None, None, None],
        "constant": [1., 1., None, 1., 1., 1.],
        "empty": pa.nulls(6, pa.float64()),
        "date": pa.array([None, datetime(1900, 1, 1), datetime(1970, 1, 1), None, datetime(1970, 1, 2), None],
                         type=pa.timestamp("ns")),
    }), {"single": "Numeric", "constant": "Numeric", "empty": "Numeric", "date": "DateTime"}
    yield "urls", pa.table({"url": [
        "HTTPS://Example.com/a?name=A%20B#top", "HTTPS://Example.com/a?name=A%20B#top",
        "http://name:pwd@[::1]:8080/路径?next=/a?b#header#body", "https://example.net", "ftp://a.example/file.tar.gz",
    ]}), {"url": "URL"}
    yield "paths", pa.table({"path": [
        "/srv/报告/.env", "/srv/报告/.env", "/srv/报告/.env.dev", "/srv/报告/...file",
        "/srv/报告/subdir/", "/srv/报告/archive.tar.gz", "/srv/报告/.ext\nsuffix",
    ]}), {"path": "Path"}
    order = [3, 6, 0, 2, 8, 5, 1, 4, 7]
    values = [4., 2., 3., 1., 2., 5., 3., 6., None]
    yield "time_series", pa.table({
        "time": pa.array([datetime(2026, 1, 1) + timedelta(hours=i + (8 if i >= 7 else 0)) for i in order],
                         type=pa.timestamp("ns")),
        "signal": [values[i] for i in order],
    }), {"time": "DateTime", "signal": "Numeric"}
    t = np.arange(101)
    signal = 20 * np.sin(2 * np.pi * 13 * t / len(t)) + np.sin(2 * np.pi * 29 * t / len(t)) + 8 * (t * 17 % 23) / 23
    yield "seasonal", pa.table({
        "time": pa.array([datetime(2026, 1, 1) + timedelta(hours=int(i)) for i in t], type=pa.timestamp("ns")),
        "signal": signal,
    }), {"time": "DateTime", "signal": "TimeSeries"}
    yield "inferred", pa.table({
        "code": [1, 3, 3, 1, 2, 2, 3, 3, 2, 1, 1, 3],
        "name": ["North", "South", "East", "North", "North", "South", "East", "North", "North", "South", "North", "South"],
        "description": [f"Reference description {i}" for i in range(12)],
        "amount": [0., 4., 3., 5., 10., 7., -8., 2., 10., 11., 12., -12.],
        "price": ["1.0", "2.3", "3e0", "1.0", "-2.5", "7.01", "8.7", "4.2", "-6.04", "5.2", None, "6.9"],
        "event_date": ["2026-01-01", "2 Jan 2026", None, "2026/01/03", "2026-02", "Jan 4, 2026", "NaT",
                       "2026-01-06", "2026-02-03", "2026-02-04", "2026-02-05", "2026-02-06"],
        "flag": ["True", "NO", "T", "false", "y", "f", "YES", "n", "True", "f", "y", "no"],
    }), {"code": "Categorical", "name": "Categorical", "description": "Text", "amount": "Numeric",
         "price": "Numeric", "event_date": "DateTime", "flag": "Boolean"}
    yield "phi_k", pa.table({
        "amount": [float(i % 80 + 20 * (i % 3)) for i in range(240)],
        "segment": ["A", "B", "C"] * 80,
        "flag": [i % 7 < 2 + (i % 3) for i in range(240)],
    }), {"amount": "Numeric", "segment": "Categorical", "flag": "Boolean"}


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


def equal(left, right, abs_tol=1e-12):
    if isinstance(left, dict) and isinstance(right, dict):
        return left.keys() == right.keys() and all(equal(left[key], right[key], abs_tol) for key in left)
    if isinstance(left, list) and isinstance(right, list):
        return len(left) == len(right) and all(equal(a, b, abs_tol) for a, b in zip(left, right))
    if type(left) is bool or type(right) is bool:
        return type(left) is type(right) and left == right
    if isinstance(left, (int, float)) and isinstance(right, (int, float)):
        return left == right if isinstance(left, int) and isinstance(right, int) else math.isclose(
            left, right, rel_tol=1e-10, abs_tol=abs_tol,
        )
    return left == right


def scale_checks(path, rows):
    positions = np.arange(rows)
    types = {"id": "Numeric", "amount": "Numeric", "region": "Categorical", "flag": "Boolean"}
    pq.write_table(pa.table({
        "id": positions,
        "amount": pa.array((positions % 4093 - 2046) / 8, mask=positions % 17 == 0),
        "region": pa.array(["North", "South", "West"]).take(pa.array((positions * 13) % 3)),
        "flag": positions % 5 == 0,
    }), path)
    metrics = {key: COLUMN_METRICS[key] for key in (
        "valid_count", "null_count", "distinct_count", "unique_count", "min", "max", "mean", "median", "sum", "stddev",
    )}
    dataset = cli("source", str(path), "--engine", "duckdb")["datasetId"]
    try:
        actual = cli("profile", dataset, "--options", "-", payload={
            "metrics": ["table_summary", *metrics], "semantics": "data-profiling", "typeSchema": {"data": types},
        })["models"][0]
    finally:
        cli("dispose", dataset)

    with warnings.catch_warnings(record=True) as emitted:
        warnings.simplefilter("always")
        expected = ProfileReport(pd.read_parquet(path), minimal=True, type_schema=types,
                                 progress_bar=False, pool_size=1).get_description()
    comparisons = [("table.row_count", actual["metrics"]["table_summary"]["row_count"], expected.table["n"]),
                   ("table.null_cell_count", actual["metrics"]["table_summary"]["null_cell_count"], expected.table["n_cells_missing"])]
    for column in actual["columns"]:
        name = column["name"]
        reference = expected.variables[name]
        comparisons.extend((f"{name}.{key}", column["metrics"].get(key, MISSING), reference[source])
                           for key, source in metrics.items() if source in reference)
    checks = [{"metric": name, "ava": None if value is MISSING else value, "reference": json_value(reference),
               "status": "missing_ava" if value is MISSING else "match" if equal(value, json_value(reference)) else "different"}
              for name, value, reference in comparisons]
    return checks, sorted({f"{warning.category.__name__}: {warning.message}" for warning in emitted})


def cli(*args, payload=None):
    result = subprocess.run(
        ["node", str(ROOT / "lib/cli/index.js"), *args], cwd=ROOT, text=True,
        input=json.dumps(payload) if payload is not None else None, capture_output=True,
        env={**os.environ, "OPENAI_API_KEY": ""},
    )
    if result.returncode != 0:
        raise RuntimeError(f"ava {args[0]} failed: {result.stderr.strip()}")
    return json.loads(result.stdout)


def compare(path, types, infer_types=False, file_root=None, phik=False):
    metrics = [*TABLE_METRICS, *COLUMN_METRICS, "value_counts", "histogram", "quantiles", "nan_count", "word_counts",
               "character_counts", "unicode_summary", "monotonicity", "duplicate_count", "length_histogram", "mode", "mode_count",
               "extreme_values", "text_examples",
               {"id": "row_duplicates", "limit": 0}, {"id": "row_sample", "head": 3, "tail": 3}]
    if "URL" in types.values():
        metrics.append("url_summary")
    methods = ["pearson", "spearman", "kendall", "cramers", "auto"]
    if phik:
        metrics.append("phi_k")
        methods.append("phi_k")
    has_image = "Image" in types.values()
    if {"Path", "File", "Image"} & set(types.values()):
        metrics.append("path_summary")
    if file_root is not None:
        metrics.append({"id": "image_summary", "root": str(file_root), "exif": True}
                       if has_image else {"id": "file_summary", "root": str(file_root)})
    if "time" in types:
        metrics.append({"id": "time_index", "orderBy": "time"})
        metrics.append({"id": "time_series", "orderBy": "time"})
        metrics.append({"id": "autocorrelation", "orderBy": "time", "lags": 4})
        metrics.append({"id": "time_series_gaps", "orderBy": "time"})
        metrics.append({"id": "frequency_spectrum", "orderBy": "time"})
        metrics.append({"id": "adf", "orderBy": "time"})
    dataset = cli("source", str(path), "--engine", "duckdb")["datasetId"]
    try:
        inference = {"url": "URL" in types.values(), "path": bool({"Path", "File", "Image"} & set(types.values()))}
        if file_root is not None:
            inference.update(fileRoot=str(file_root), image=has_image)
        if "TimeSeries" in types.values():
            inference["timeSeries"] = {"orderBy": "time"}
        type_options = {"inferTypes": inference} if infer_types else {"typeSchema": {"data": types}}
        actual = cli("profile", dataset, "--options", "-", payload={
            "metrics": metrics, "semantics": "data-profiling", **type_options,
        })["models"][0]
        quality = cli("quality", dataset)["models"][0]["alerts"]
    finally:
        cli("dispose", dataset)

    config = Settings(
        progress_bar=False, pool_size=1, infer_dtypes=infer_types,
        missing_diagrams={"bar": False, "matrix": False, "heatmap": False},
        interactions={"continuous": False}, samples={"head": 3, "tail": 3, "random": 0},
        vars={"num": {"low_categorical_threshold": 5 if infer_types else 0, "chi_squared_threshold": 0.999},
              "cat": {"length": True, "characters": True, "words": True},
              "url": {"active": "URL" in types.values()},
              "path": {"active": bool({"Path", "File", "Image"} & set(types.values()))},
              "file": {"active": file_root is not None}, "image": {"active": has_image, "exif": has_image},
              "timeseries": {"pacf_acf_lag": 4, "active": "TimeSeries" in types.values()}},
        correlations={method: {"calculate": True, "threshold": 0.9} for method in methods},
    )
    frame = pd.read_parquet(path)
    source_schema = pq.read_schema(path)
    integer_columns = {field.name for field in source_schema if pa.types.is_integer(field.type)}
    date_columns = {field.name for field in source_schema if pa.types.is_date(field.type) or pa.types.is_timestamp(field.type)}
    with warnings.catch_warnings(record=True) as emitted:
        warnings.simplefilter("always")
        expected = ProfileReport(frame, config=config, tsmode="TimeSeries" in types.values(),
                                 type_schema=None if infer_types else types).get_description()
    checks = []

    def check(name, received, reference, abs_tol=1e-12):
        reference = json_value(reference)
        if received is MISSING:
            checks.append({"metric": name, "status": "missing_ava", "reference": reference})
            return
        checks.append({"metric": name, "status": "match" if equal(received, reference, abs_tol) else "different",
                       "ava": received, "reference": reference})

    summary = actual["metrics"]["table_summary"]
    for native, source in {"row_count": "n", "column_count": "n_var", "null_cell_count": "n_cells_missing",
                           "null_cell_ratio": "p_cells_missing", "columns_with_nulls": "n_vars_with_missing",
                           "all_null_columns": "n_vars_all_missing"}.items():
        check(f"table.{native}", summary[native], expected.table[source])
    check("table.type_counts", summary["type_counts"], {
        logical: sum(REFERENCE_TYPES[description["type"]] == logical for description in expected.variables.values())
        for logical in set(REFERENCE_TYPES.values())
    })
    if "time_index" in actual["metrics"]:
        expected_index = pandas_get_time_index_description(config, frame.sort_values("time").set_index("time"), expected.table)
        check("table.time_index", actual["metrics"]["time_index"], expected_index)
    continuous = [name for name, description in expected.variables.items() if description["type"] in {"Numeric", "TimeSeries"}]
    config.interactions.continuous = True
    pairs = []
    for x, y in get_scatter_tasks(config, continuous):
        xs, ys = pd.to_numeric(frame[x]), pd.to_numeric(frame[y])
        valid = np.isfinite(xs) & np.isfinite(ys)
        plot = scatter(config, xs[valid], ys[valid], x, y, int(valid.sum()), gridsize=15)
        pairs.append({"x_column": x, "y_column": y, "count": plot.n_points,
                      "points": [{"x": a, "y": b} for a, b in zip(plot.x, plot.y)]})
    check("table.scatter_pairs", [{key: value for key, value in pair.items() if key in {"x_column", "y_column", "count", "points"}}
                                   for pair in actual["metrics"]["scatter_pairs"]], pairs)
    check("table.row_duplicates.group_count", actual["metrics"]["row_duplicates"]["group_count"], expected.table["n_duplicates"])
    for rule in ("constant", "duplicates", "empty", "high_cardinality", "imbalance", "infinite", "missing", "non_stationary",
                 "rejected", "seasonal", "skewed", "uniform", "unique", "unsupported", "zeros"):
        check(f"quality.{rule}", sorted(alert.get("column", "") for alert in quality if alert["rule"] == rule),
              sorted(alert.column_name or "" for alert in expected.alerts if alert.alert_type.name == rule.upper()))
    check("quality.high_correlation", sorted(sorted([alert["column"], alert["relatedColumn"]])
                                             for alert in quality if alert["rule"] == "high_correlation"),
          [list(pair) for pair in sorted({tuple(sorted([alert.column_name, other]))
                                         for alert in expected.alerts if alert.alert_type.name == "HIGH_CORRELATION"
                                         for other in alert.values["fields"]})])

    def decoded(name, value):
        if value is None:
            return None
        if name in integer_columns:
            return int(value)
        if name in date_columns:
            return json_value(pd.Timestamp(value))
        return value

    for sample in expected.sample:
        received = actual["metrics"]["row_sample"][sample.id]
        for row in received:
            for name, value in row["row_values"].items():
                row["row_values"][name] = decoded(name, value)
        check(f"table.row_sample.{sample.id}", received,
              [{"index": int(index), "row_values": row.to_dict()} for index, row in sample.data.iterrows()])
    missing = frame.isna()
    check("table.missing_matrix", actual["metrics"]["missing_matrix"], {
        "columns": list(frame.columns), "row_count": len(frame),
        "rows": ["".join("1" if item else "0" for item in row) for row in missing.itertuples(index=False, name=None)],
    })
    bands = actual["metrics"]["missing_bands"]
    rendered = missing_matrix(config, (~missing).to_numpy(), list(frame.columns), len(frame))
    compressed = []
    for i in range(len(bands["columns"])):
        runs = []
        for band in bands["bands"]:
            fraction = band["present"][i]
            coverage = fraction if fraction in (0, 1) else round(min(max(fraction, 0.05), 0.95), 1)
            if runs and runs[-1][2] == coverage:
                runs[-1][1] = band["end"]
            else:
                runs.append([band["start"], band["end"], coverage])
        compressed.append(runs)
    check("table.missing_bands", {"columns": bands["columns"], "rows": bands["row_count"], "bands": compressed},
          {"columns": rendered.columns, "rows": rendered.nrows, "bands": rendered.bands})
    partial = [name for name in frame if 0 < missing[name].sum() < len(frame)]
    check("table.missing_correlation", actual["metrics"]["missing_correlation"],
          {"columns": partial, "matrix": missing[partial].corr().to_numpy()} if len(partial) >= 2 else None)

    for column in actual["columns"]:
        name, observed = column["name"], column["metrics"]
        reference = expected.variables[name]
        check(f"{name}.type", column["properties"]["logicalType"], REFERENCE_TYPES[reference["type"]])
        check(f"{name}.profile_type", column["properties"].get("profileType", MISSING), reference["type"])
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
            counts, edges = reference["histogram"] or ([], [])
            if reference["type"] == "DateTime":
                edges = edges * 1000
            check(f"{name}.histogram", observed.get("histogram", MISSING), {"counts": counts, "bin_edges": edges})
        if "5%" in reference:
            check(f"{name}.quantiles", observed.get("quantiles", MISSING), [
                {"probability": p, "value": reference[f"{p:.0%}"]} for p in (0.05, 0.25, 0.5, 0.75, 0.95)
            ])
        if "n_distinct" in reference:
            check(f"{name}.duplicate_count", observed.get("duplicate_count", MISSING),
                  reference["count"] - reference["n_distinct"])
        if "first_rows" in reference:
            check(f"{name}.text_examples", observed.get("text_examples", MISSING), reference["first_rows"].tolist())
        if "extreme_values" in observed:
            frequencies = reference["value_counts_index_sorted"]
            check(f"{name}.extreme_values", {
                side: [{"value": decoded(name, item["value"]), "count": item["count"]} for item in values]
                for side, values in observed["extreme_values"].items()
            }, {side: [{"value": row["label"], "count": row["count"]}
                       for row in extreme_obs_table(freqs, 5, len(frame))[0]]
                for side, freqs in (("lowest", frequencies), ("highest", frequencies[::-1]))})
        if "length_histogram" in reference:
            check(f"{name}.length_histogram", observed.get("length_histogram", MISSING),
                  [{"length": length, "count": count} for length, count in reference["length_histogram"].sort_index().items()])
        if "top" in reference:
            check(f"{name}.mode_count", observed.get("mode_count", MISSING), reference["freq"])
            if (reference["value_counts_without_nan"] == reference["freq"]).sum() <= 1:
                check(f"{name}.mode", observed.get("mode", MISSING), reference["top"])
        if reference["type"] == "URL":
            for part in ("scheme", "netloc", "path", "query", "fragment"):
                key = part + "_counts"
                check(f"{name}.{key}", {item["value"]: item["count"] for item in observed["url_summary"][key]},
                      reference[key].to_dict())
        if reference["type"] in ("Path", "File", "Image"):
            check(f"{name}.common_prefix", observed["path_summary"]["common_prefix"], reference["common_prefix"])
            for part in ("stem", "suffix", "name", "parent", "anchor"):
                key = part + "_counts"
                check(f"{name}.{key}", {item["value"]: item["count"] for item in observed["path_summary"][key]},
                      reference[key].to_dict())
                unique = f"n_{part}_unique"
                check(f"{name}.{unique}", observed["path_summary"][unique], reference[unique])
        if reference["type"] == "File":
            files = {}
            for value, group in frame.groupby(name):
                index = group.index[0]
                files[value] = {"count": len(group), "size": int(reference["file_size"].loc[index])}
                for native, key in (("created_at", "file_created_time"), ("accessed_at", "file_accessed_time"),
                                    ("modified_at", "file_modified_time")):
                    timestamp = datetime.strptime(reference[key].loc[index], "%Y-%m-%d %H:%M:%S")
                    files[value][native] = int(timestamp.timestamp() * 1000)
            check(f"{name}.file_summary", {file["value"]: {k: v for k, v in file.items() if k != "value"}
                                           for file in observed["file_summary"]["files"]}, files)
            counts, edges = reference["histogram_file_size"]
            check(f"{name}.histogram_file_size", observed["file_summary"]["histogram_file_size"],
                  {"counts": counts, "bin_edges": edges})
        if reference["type"] == "Image":
            images = observed["image_summary"]
            check(f"{name}.n_truncated", images["n_truncated"], reference["n_truncated"])
            check(f"{name}.image_dimensions", sorted(images["image_dimensions"], key=lambda x: (x["width"], x["height"])),
                  [{"width": w, "height": h, "count": n} for (w, h), n in sorted(reference["image_dimensions"].value_counts().items())])
            for dimension in ("width", "height", "area"):
                check(f"{name}.{dimension}", images[dimension],
                      {stat: reference[f"{stat}_{dimension}"] for stat in ("min", "max", "mean", "median")})
            check(f"{name}.exif_keys_counts", {entry["value"]: entry["count"] for entry in images["exif_keys_counts"]},
                  reference["exif_keys_counts"])
            check(f"{name}.exif_data", {entry["tag"]: {item["value"]: item["count"] for item in entry["values"]}
                                       for entry in images["exif_data"]},
                  {key: val.to_dict() for key, val in reference["exif_data"].items() if key != "exif_keys"})
        if "autocorrelation" in observed:
            series = frame.sort_values("time")[name].dropna()
            with warnings.catch_warnings(record=True) as chart_warnings:
                chart = acf_pacf(config, series)
            emitted.extend(chart_warnings)
            check(f"{name}.autocorrelation", observed["autocorrelation"], {"count": len(series), **{
                panel.title.lower(): [{"lag": lag, "value": value, "lower": value + lo, "upper": value + hi}
                                      for lag, (value, lo, hi) in enumerate(zip(panel.values, panel.conf_low, panel.conf_high))]
                for panel in chart.rows[0]
            }})
        if "time_series" in observed:
            chart = timeseries(config, frame.sort_values("time").set_index("time")[name], mini=False)
            points = [{"x": x * 1000, "y": y} for x, y in zip(chart.series[0].x, chart.series[0].y)]
            check(f"{name}.time_series", observed["time_series"], {"date_index": True, "count": len(frame), "points": points})
        if "time_series_gaps" in observed:
            gaps = compute_gap_stats(frame.sort_values("time").set_index("time")[name])
            check(f"{name}.time_series_gaps", observed["time_series_gaps"], {
                **{key: gaps[key] for key in ("n_gaps", "min", "max", "mean", "std")},
                "gaps": [[pd.Timestamp(endpoint) for endpoint in interval] for interval in gaps["gaps"]],
            })
        if "frequency_spectrum" in observed:
            spectrum = observed["frequency_spectrum"]
            with warnings.catch_warnings(record=True) as spectrum_warnings:
                fft = get_fft(frame.sort_values("time")[name].dropna())
                threshold, peaks, selected = get_fft_peaks(fft)
            emitted.extend(spectrum_warnings)

            def power(points):
                return [{"frequency": frequency, "power": 0.0 if amplitude == "-Infinity" else 10 ** (amplitude / 10)}
                        for frequency, amplitude in points]

            for key, dataframe in (("points", fft), ("peaks", peaks), ("selected_peaks", selected)):
                check(f"{name}.frequency_spectrum.{key}", power((point["frequency"], point["decibels"])
                                                                for point in spectrum[key]),
                      power(dataframe[["freq", "ampl"]].itertuples(index=False, name=None)))
            check(f"{name}.frequency_spectrum.threshold", spectrum["threshold"], threshold)
            check(f"{name}.frequency_spectrum.periods", spectrum["periods"], (1 / selected["freq"]).tolist())
            check(f"{name}.frequency_spectrum.seasonal", spectrum["seasonal"], not selected.empty)
        if "adf" in observed:
            with warnings.catch_warnings(record=True) as adf_warnings:
                stationary, probability = stationarity_test(config, frame.sort_values("time")[name])
            emitted.extend(adf_warnings)
            check(f"{name}.adf.pvalue", observed["adf"]["pvalue"], probability)
            check(f"{name}.adf.stationary", observed["adf"]["stationary"], stationary)
        if "n_characters" in reference:
            unicode = observed["unicode_summary"]
            check(f"{name}.character_count", unicode["character_count"], reference["n_characters"])
            check(f"{name}.distinct_character_count", unicode["distinct_character_count"], reference["n_characters_distinct"])
            for native, key in (("category", "category_alias_char_counts"), ("block", "block_alias_char_counts"),
                                ("script", "script_char_counts")):
                def ordered(groups):
                    return sorted([{
                        **group, "characters": sorted(group["characters"], key=lambda item: item["value"]),
                    } for group in groups], key=lambda group: json.dumps(group["value"]))

                check(f"{name}.unicode_summary.{native}", ordered(unicode[native]), ordered([
                    {"value": value, "count": int(frequencies.sum()),
                     "characters": [{"value": char, "count": int(count)} for char, count in frequencies.items()]}
                    for value, frequencies in reference[key].items()
                ]))
        for native, source in (("value_counts", "value_counts_without_nan"), ("word_counts", "word_counts"),
                               ("character_counts", "character_counts")):
            if source in reference and reference["type"] != "DateTime":
                frequencies = [{"value": json_value(value), "count": int(count)}
                               for value, count in reference[source].items()]
                key = lambda entry: json.dumps(entry["value"], sort_keys=True)
                received = observed.get(native, MISSING)
                if received is not MISSING:
                    received = sorted([{"value": item["value"] if reference["type"] == "Categorical" else decoded(name, item["value"]), "count": item["count"]}
                                       for item in received], key=key)
                check(f"{name}.{native}", received, sorted(frequencies, key=key))

    for method in methods:
        native = actual["metrics"].get(method)
        reference = expected.correlations.get(method)
        if native is not None and reference is not None and set(native["columns"]) == set(reference.columns):
            columns = native["columns"]
            check(f"table.{method}", native, {"columns": columns, "matrix": reference.loc[columns, columns].to_numpy()},
                  abs_tol=1e-5 if method == "phi_k" else 1e-12)
        else:
            check(f"table.{method}.columns", sorted(native["columns"]) if native and native["columns"] else None,
                  sorted(reference.columns) if reference is not None else None)
    return checks, sorted({f"{warning.category.__name__}: {warning.message}" for warning in emitted})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict", action="store_true", help="Fail if any compared metric differs")
    args = parser.parse_args()
    results = {}
    reference_warnings = {}
    with tempfile.TemporaryDirectory(prefix="ava-profile-parity-") as directory:
        for name, table, types in fixtures():
            path = Path(directory) / f"{name}.parquet"
            pq.write_table(table, path)
            results[name], reference_warnings[name] = compare(path, types, infer_types=name in {"inferred", "urls", "paths", "seasonal"}, phik=name == "phi_k")
        for rows in (10_000, 1_000_000):
            name = f"scale_{rows}"
            results[name], reference_warnings[name] = scale_checks(Path(directory) / f"{name}.parquet", rows)
        file_root = Path(directory).resolve() / "profile-files"
        file_root.mkdir()
        files = [file_root / name for name in ("first.txt", "second.csv", "third.bin")]
        for i, file in enumerate(files):
            file.write_bytes(b"x" * (10 + i * 15))
        path = Path(directory) / "files.parquet"
        pq.write_table(pa.table({"file": [str(files[0]), str(files[1]), str(files[0]), str(files[2])]}), path)
        results["files"], reference_warnings["files"] = compare(path, {"file": "File"}, infer_types=True, file_root=file_root)
        first_image, second_image, truncated_image = [file_root / name for name in ("first.jpg", "second.png", "partial.jpg")]
        exif = Image.Exif()
        exif[271], exif[272] = "Test Camera", "Profile Fixture"
        Image.new("RGB", (15, 21), "white").save(first_image, exif=exif)
        Image.new("RGB", (24, 13), "blue").save(second_image)
        truncated_image.write_bytes(first_image.read_bytes()[:-2])
        path = Path(directory) / "images.parquet"
        pq.write_table(pa.table({"image": [str(first_image), str(second_image), str(first_image), str(truncated_image)]}), path)
        results["images"], reference_warnings["images"] = compare(path, {"image": "Image"}, infer_types=True, file_root=file_root)
        path = Path(directory) / "date_validation.parquet"
        pq.write_table(pa.table({"date": [
            "2026/01/02", "Jan 3, 2026", "31/01/2026", "20260405", "2026", "2026-02",
            "2026-02-30", "bad", "bad", "NaT", "1600-01-01", None,
        ]}), path)
        dataset = cli("source", str(path), "--engine", "duckdb")["datasetId"]
        custom = {"name": "Selected records", "caption": "Reviewed manually", "data": [{"date": "2026-01-02"}]}
        try:
            profile = cli("profile", dataset, "--options", "-", payload={
                "metrics": ["date_validation", "valid_count", "min", "max", "range"],
                "typeSchema": {"data": {"date": "DateTime"}},
            })
            actual = profile["models"][0]["columns"][0]["metrics"]
            sample = cli("profile", dataset, "--options", "-", payload={
                "metrics": [{"id": "row_sample", "custom": custom}],
            })["models"][0]["metrics"]["row_sample"]["custom"]
        finally:
            cli("dispose", dataset)
        with warnings.catch_warnings(record=True) as emitted:
            profile = ProfileReport(pd.read_parquet(path), minimal=True, progress_bar=False,
                                    sample={**custom, "data": pd.DataFrame(custom["data"])},
                                    type_schema={"date": "DateTime"}).get_description()
        reference = profile.variables["date"]
        expected = {key: json_value(reference[key]) for key in ("min", "max", "range")}
        expected["valid_count"] = json_value(reference["count"])
        expected["date_validation"] = {key: json_value(reference[key]) for key in actual["date_validation"]}
        results["date_validation"] = [{"metric": f"date.{key}", "ava": value, "reference": expected[key],
                                       "status": "match" if equal(value, expected[key]) else "different"}
                                      for key, value in actual.items()]
        sample_reference = {"name": profile.sample[0].name, "caption": profile.sample[0].caption,
                            "data": profile.sample[0].data.to_dict(orient="records")}
        results["date_validation"].append({"metric": "table.row_sample.custom", "ava": sample,
                                           "reference": sample_reference,
                                           "status": "match" if equal(sample, sample_reference) else "different"})
        reference_warnings["date_validation"] = sorted({f"{warning.category.__name__}: {warning.message}" for warning in emitted})
    print(json.dumps({"reference": {"data_profiling": __version__, "pandas": pd.__version__,
                                   "numpy": np.__version__, "scipy": scipy.__version__}, "fixtures": results,
                     "reference_warnings": reference_warnings},
                     indent=2, ensure_ascii=False, allow_nan=False))
    return int(args.strict and any(check["status"] != "match" for checks in results.values() for check in checks))


if __name__ == "__main__":
    raise SystemExit(main())
