# Environment Setup

## CLI

Requires AVA CLI ≥4.0.0-alpha, Node.js ≥22.13, and macOS or Linux. The runtime must support long-lived background processes and Unix sockets. Calls must share the same user, runtime environment, and temporary directory.

Check the Node.js version and confirm that the CLI is available:

```sh
node --version
ava source --help
```

Prefer an installation or build already available in the project. In a standalone environment where AVA is not installed, run:

```sh
npm install -g '@antv/ava@>=4.0.0-alpha'
```

## Python

When using `--engine python`, select an existing virtual environment or a Python environment for the current task, and put its `python3` on `PATH`.

Check the dependencies in that environment. pandas is required; Parquet also requires a supported reader (such as `pyarrow`), and XLSX requires `openpyxl`. For example:

```sh
python3 -c 'import pandas; print(pandas.__version__)'
```

Install any missing packages in the same environment, then create the session. Switching Python environments requires a new session.

By default, execution runs in a local subprocess with the current user's file and network permissions; it is not a security sandbox. For isolation, run the entire CLI inside a sandbox provided by the host.
