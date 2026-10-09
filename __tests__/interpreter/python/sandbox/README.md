# Python 核心测试

引擎单测（无需 Python、Docker 或模型密钥）：

```sh
pnpm exec vitest run __tests__/interpreter/python
```

本地结果序列化测试（需要 PATH 中的 `python3` 和 pandas，无需 Docker 或模型密钥）：

```sh
AVA_PYTHON_LOCAL_TEST=1 pnpm exec vitest run __tests__/interpreter/python/serialization.test.ts
```

Docker 集成与沙箱测试（默认跳过，需先启动 Docker）：

```sh
docker build -t ava-python-test:local __tests__/interpreter/python/sandbox
AVA_PYTHON_DOCKER_TEST=1 pnpm exec vitest run __tests__/interpreter/python
```

开启后，Docker 不可用或镜像缺失会使测试失败。可用 `AVA_PYTHON_DOCKER_IMAGE`
指定按本目录 Dockerfile 构建的其他镜像。

沙箱仅用于测试中的 Docker 执行器，默认本地 Python 执行不提供沙箱。
