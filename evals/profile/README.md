# DuckDB Profile 结果对照

`compare.py` 将同一份 Parquet 交给 AVA CLI 和 `fg-data-profiling`，按表、列和指标输出双方结果。参考源码固定在 `7f43aac68b2539bfe8f487f315aeaf44e965d29a`。评测使用独立 Python 环境，AVA 运行时使用 DuckDB。

```sh
npm run build:cjs
python3 evals/profile/compare.py > profile-parity.json
```

Python 环境需要安装该源码版本的 `fg-data-profiling[arrow]`。输出记录实际依赖版本。`--strict` 在出现差异时返回非零退出码。

浮点值使用相对容差 `1e-10`、绝对容差 `1e-12`。计数精确比较。时间单位转换为 Unix 毫秒，频数按值对齐，相关矩阵按列名对齐。NaN、无穷值和缺失值的统计口径差异保留在结果中。

当前对照范围为数值、类别、布尔、日期、重复分组和已实现的相关系数。新增能力应补充相应输入和对照项。
