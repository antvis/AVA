# DuckDB Profile 结果对照

`compare.py` 将同一份 Parquet 交给 AVA CLI 和 `fg-data-profiling`，按表、列和指标输出双方结果。参考源码固定在 `7f43aac68b2539bfe8f487f315aeaf44e965d29a`。评测使用独立 Python 环境，AVA 运行时使用 DuckDB。

```sh
npm run build:cjs
python3 evals/profile/compare.py > profile-parity.json
```

Python 环境需要安装该源码版本的 `fg-data-profiling[arrow]`。输出记录实际依赖版本。`--strict` 在出现差异时返回非零退出码。

浮点值使用相对容差 `1e-10`、绝对容差 `1e-12`。计数精确比较。时间单位转换为 Unix 毫秒，频数按值对齐，相关矩阵按列名对齐。对照使用 `semantics: 'data-profiling'`，让 DuckDB 和 pandas 都把 NaN 算作缺失。统计口径差异保留在结果中。

对照覆盖数值、类别、布尔、日期、Unicode、稀疏及非有限值、类型推断、相关和散点、缺失模式、重复分组和样本、时序、文件和图片。另对 1 万和 100 万行的 Parquet 验证计数及数值统计。Phi-k 使用 `1e-5` 的绝对容差，以容纳两种求根实现的差异。AVA 保留空表画像，参考库拒绝空 DataFrame。两者的内存指标使用各自的数据表示。

Unicode 分类表由 [Unicode Character Database 13.0.0](https://www.unicode.org/Public/13.0.0/) 生成，对齐 `tangled_up_in_unicode` 0.2.0 实际使用的字符属性。用 `python3 evals/profile/generate_unicode_properties.py /path/to/UCD.zip` 重建，脚本会核验源归档的 SHA-256。

## 扫描性能复现

```sh
npm run build:cjs
node evals/profile/benchmark.cjs > profile-benchmark.json
```

默认生成一千到一千万行的 12 列 Parquet，使用 DuckDB 的 AVA 默认配置（1 线程、512 MB 内存限制）。每组两次预热，随后记录七次画像调用耗时和中位数。Parquet 生成、连接初始化及 schema 读取在计时前完成。`--rows`、`--runs`、`--threads` 和 `--memory` 可覆盖这些设置。`--baseline` 可指定已编译的基线工作树，基线使用同一份 Parquet 对照默认画像。`--workloads` 可选表概览 `scan`、默认画像 `default`、完整性 `completeness`、分布 `distribution` 和关联 `associations`，默认全部运行。

每组另跑一次 `EXPLAIN (ANALYZE, FORMAT JSON)`，记录扫描行数、扫描算子数量及耗时之和、DuckDB 查询耗时、缓冲区峰值和临时文件峰值。并行时扫描算子耗时之和可能高于经过的时间。画像调用耗时包含 SQL 生成、执行和结果解码。这里测量的是预热后的执行，未清除文件系统缓存。查询或基线对照失败会保留在 JSON，并返回非零退出码。
