# AVA 配置

## 运行环境

AVA 需要 Node.js 18 或更高版本。安装指定版本并验证命令：

```sh
npm install -g @antv/ava@4.0.0-alpha.1
ava --help
```

## 模型服务

AVA 通过 OpenAI 兼容协议连接模型服务。配置以下三项：

| 环境变量 | 值 | 用途 |
| --- | --- | --- |
| `OPENAI_API_KEY` | `<API Key>` | 服务商提供的访问密钥 |
| `OPENAI_MODEL` | `gpt-4o-mini` | 服务商支持的模型名称 |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI 兼容 API 地址 |

```sh
export OPENAI_API_KEY="<API Key>"
export OPENAI_MODEL="gpt-4o-mini"
export OPENAI_BASE_URL="https://api.openai.com/v1"
```

配置完成后重新执行原分析命令。
