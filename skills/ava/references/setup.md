# 环境准备

## CLI

需要 AVA CLI ≥4.0.0-alpha、Node.js ≥22.13 和 macOS/Linux。运行环境须支持持续运行的后台进程和 Unix socket，各次调用共享用户、运行环境和临时目录。

先检查 Node.js 版本和 CLI 是否可用：

```sh
node --version
ava source --help
```

优先使用项目已有安装或构建；独立环境未安装时运行：

```sh
npm install -g '@antv/ava@>=4.0.0-alpha'
```

## Python

使用 `--engine python` 时，先选择已有虚拟环境或本任务的 Python 环境，将其 `python3` 放入 PATH。

在该环境检查依赖：pandas 必需；Parquet 还需可用的读取引擎（如 `pyarrow`），XLSX 需 `openpyxl`。例如：

```sh
python3 -c 'import pandas; print(pandas.__version__)'
```

缺包时在同一环境安装，依赖就绪后再创建会话。切换 Python 环境需新建会话。

默认执行为本地子进程，具有当前用户的文件和网络权限，并非安全沙箱。需要隔离时，在宿主的隔离环境中运行整个 CLI。
