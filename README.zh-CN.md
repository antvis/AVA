# AVA v4 - AI 分支

这是 AVA v4 的开发分支，专注于 **AI 原生可视分析**。

## 🚀 v4 的新特性

AVA v4 是从基于规则的分析转向 AI 原生能力的根本转变：

- **自然语言查询**：用简单的中英文提问您的数据
- **大语言模型驱动分析**：利用大语言模型进行智能数据分析
- **智能数据处理**：根据数据大小自动在内存处理和 SQLite 之间选择
- **模块化架构**：数据、分析和可视化模块清晰分离

## 📦 项目结构

```
AVA/
├── packages/ava/          # 主 AVA v4 包
│   ├── src/
│   │   ├── data/         # 数据加载和处理
│   │   ├── analysis/     # 查询生成和执行
│   │   ├── ava.ts        # 主 AVA 类
│   │   └── types.ts      # TypeScript 定义
│   └── README.md
├── examples/             # 使用示例
│   ├── basic-usage.ts
│   └── README.md
└── data/                 # 示例数据集
    └── companies.csv
```

## 🛠️ 开发设置

### 前置要求

- Node.js >= 18.0.0
- npm 或 yarn
- OpenAI API 密钥（或兼容的大语言模型提供商）

### 安装

```bash
# 安装依赖
cd packages/ava
npm install --ignore-scripts

# 构建包
npm run build
```

### 运行示例

```bash
# 设置 API 密钥
export OPENAI_API_KEY='your-api-key-here'

# 运行示例（需要 ts-node）
npm install -g ts-node
ts-node examples/basic-usage.ts
```

## 📖 快速开始

```typescript
import { AVA } from '@antv/ava';

// 使用大语言模型配置初始化
const ava = new AVA({
  llm: {
    model: 'gpt-4',
    apiKey: 'YOUR_API_KEY',
  },
});

// 加载数据
await ava.loadCSV('data/companies.csv');

// 用自然语言提问
const result = await ava.analysis('各地区的平均收入是多少？');
console.log(result);

// 清理资源
ava.dispose();
```

## 📚 文档

- [包 README](./packages/ava/README.md) - 主包文档
- [数据模块](./packages/ava/src/data/README.md) - 数据加载和处理
- [分析模块](./packages/ava/src/analysis/README.md) - 查询生成和执行
- [示例](./examples/README.md) - 使用示例和教程

## 📄 许可证

MIT

---

<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](./README.md) | 简体中文
