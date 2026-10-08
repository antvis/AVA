# Python Docker 集成测试

启动本机 Docker 后执行：

```sh
docker build -t ava-python-test:local __tests__/python/sandbox
AVA_PYTHON_DOCKER_TEST=1 pnpm exec vitest run __tests__/python
```

默认跳过容器测试。可用 `AVA_PYTHON_DOCKER_IMAGE` 指定已有的 Python/pandas 镜像。
测试通过 AVA 的执行回调启动一次性容器，验证真实 pandas 聚合、非 root 用户、
只读根文件系统及禁网，并在结束后清理容器。容器设有 CPU、内存和进程数限制。

执行回调现在仅接收完整的 Python `code`，运行后返回标准输出解析得到的 JSON。
数据加载、分析及截断均由 engine 生成的脚本完成；容器超时由运行环境配置。

本测试使用内联 JSON，不需要开放网络；本地文件应只读挂载，URL 输入需要运行环境允许访问对应地址。
