<div align="center">
  <h1>AVA, AI 原生可视化分析</h1>
  <img width="200" height="120" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" alt="AVA logo">
</div>

[AVA](https://github.com/antvis/AVA)（<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*QzIsSrfsCW0AAAAAAAAAAAAADmJ7AQ/original" width="16" alt="AVA examples"> Visual Analytics）是一个为更便捷的可视化分析而设计的技术框架。第一个 **A** 有多重含义：AI 原生（AI native）、自动化（Automated）、增强（Augmented），而 **VA** 代表可视化分析（Visual Analytics）。它可以协助用户进行非结构化数据加载、数据处理与分析，以及可视化代码生成。

<p align="center">
  <a href="https://github.com/antvis/ava">
    <img src="https://img.shields.io/badge/GitHub-000000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://ava.antv.vision">
    <img src="https://img.shields.io/badge/Website-2F54EB?style=for-the-badge" alt="Website" />
  </a>
  <a href="https://ava.antv.vision/documentation">
    <img src="https://img.shields.io/badge/Docs-722ED1?style=for-the-badge" alt="Documentation" />
  </a>
  <a href="https://ava.antv.vision/">
    <img src="https://img.shields.io/badge/AI%20Agent-EB2F96?style=for-the-badge" alt="AI Agent" />
  </a>
  <a href="https://github.com/antvis/AVA/blob/ai/llms.txt">
    <img src="https://img.shields.io/badge/LLMS-FA8C16?style=for-the-badge" alt="llms" />
  </a>
</p>

## 🚀 特性

AVA 是从基于规则的分析到 AI 原生能力的根本性转变：

- **自然语言查询**：用 plain English 提出关于数据的问题
- **查询建议**：根据数据特征获取 AI 推荐的分析查询
- **LLM 驱动的分析**：利用大语言模型进行智能数据分析
- **智能数据处理**：根据数据大小自动选择内存处理或 SQLite
- **模块化架构**：数据、分析和可视化模块职责分离清晰
- **浏览器与 Node.js 兼容**：在浏览器和服务器环境中无缝运行

## 📖 快速开始

- 通过 npm 安装 `AVA`

```bash
npm install @antv/ava

pnpm install @antv/ava

yarn add @antv/ava
```

- 然后运行以下代码

```typescript
import { AVA } from '@antv/ava';

// 使用 LLM 配置初始化
const ava = new AVA({
  llm: {
    model: 'ling-1t',
    apiKey: 'YOUR_API_KEY',
    baseURL: 'LLM_BASE_URL',
  },
  sqlThreshold: 1024 * 1024 * 2, // 切换到 SQLite 的阈值
});

// 在 Node.js 中从多种数据源加载数据
await ava.loadCSV('data/companies.csv');

// 在浏览器中从文件输入加载 CSV
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const csvContent = await file.text();
await ava.loadCSV(csvContent);

// 或从 JSON 对象加载
await ava.loadObject([{ city: '杭州', gdp: 18753 }, { city: '上海', gdp: 43214 }]);

// 或从 URL 加载
await ava.loadURL('https://api.example.com/data', (response) => response.data);

// 或从文本中提取
await ava.loadText('杭州 100，上海 200，北京 300');

// 获取建议的分析查询
const queries = await ava.suggest(5); // 获取前 5 个建议查询（默认：3）
console.log(queries);
// [
//   {
//     query: '各地区的平均收入是多少？',
//     score: 0.95,
//     reason: '了解各地区收入分布有助于识别高绩效区域'
//   },
//   ...
// ]

// 用自然语言提问
const result = await ava.analysis('各地区的平均收入是多少？');
console.log(result);

// 或使用建议的查询
const suggestedResult = await ava.analysis(queries[0].query);
console.log(suggestedResult);

// 清理资源
ava.dispose();
```

## 🏗️ 架构

AVA 采用模块化管道架构，通过不同的阶段处理用户查询。数据从多种来源加载（CSV、JSON、URL 或文本），根据大小进行智能分析（小数据集用 JavaScript，大数据集用 SQLite），结果使用 LLM 总结为自然语言响应，并可选择通过图表推荐进行可视化。

```
用户查询
    ↓
AVA 实例
    ↓
┌─────────────────┐
│  数据模块        │ → 从多种来源加载：
│                 │   • CSV 文件 (loadCSV)
│                 │   • JSON 对象 (loadObject)
│                 │   • URL (loadURL)
│                 │   • 文本 (loadText + LLM)
└─────────────────┘
    ↓
┌──────────────────┐
│ 元数据提取       │ → 类型推断、统计信息
└──────────────────┘
    ↓
┌──────────────┐
│  大小检查    │
└──────────────┘
    ↓         ↓
 <10KB      ≥10KB
    ↓         ↓
JavaScript  SQLite
 助手        存储
    ↓         ↓
┌──────────────────┐
│ 分析模块         │ → 生成并执行代码/SQL
└──────────────────┘
    ↓
┌──────────────┐
│ LLM 总结      │ → 自然语言响应
└──────────────┘
    ↓
┌─────────────────────┐
│ 可视化模块          │ → 可选图表生成：
│ （可选）            │   • 检测可视化意图
│                     │   • 推荐图表类型
│                     │   • 生成图表语法和 HTML
└─────────────────────┘
    ↓
用户响应
（文本 + 数据 + 图表）
```

## 🌐 浏览器与服务器兼容性

AVA v4 设计为在浏览器和 Node.js 环境中无缝运行：

### ✅ 浏览器支持
- 所有核心功能在现代浏览器中均可使用（Chrome、Firefox、Safari、Edge）
- 通过 File API 或直接内容字符串加载 CSV
- 完全支持 JSON 对象和 URL 加载
- 对小于 10KB 的数据集进行内存处理
- 注意：浏览器中对大数据集（默认 >10KB）使用 IndexedDB 进行持久化存储；对于极大数据集，建议使用服务器端版本以避免内存压力

### ✅ Node.js 支持
- 包括使用 SQLite 处理大数据集的完整功能集
- 文件系统访问以加载 CSV
- 根据数据大小自动在内存和 SQLite 之间切换（10KB 阈值）

### 环境检测
AVA 自动检测运行时环境并适应：
- **浏览器**：使用内存处理，接受 CSV 内容字符串
- **Node.js**：支持 CSV 文件路径，对大数据集（>10KB）使用 SQLite

## 🤝 开发者贡献

这是一个实验性分支。欢迎贡献！请确保：

- 代码整洁且文档完善
- TypeScript 类型定义正确
- 新功能包含示例和测试
- 根据需要更新 README

## 🔗 相关项目

- [GPT-Vis](https://github.com/antvis/GPT-Vis) - 可视化组件
- [Chart Visualization Skills](https://github.com/antvis/chart-visualization-skills) - 图表的 LLM 技能
- [Vercel AI SDK](https://sdk.vercel.ai/) - LLM 集成

## 📚 论文

[VizLinter](https://vegalite-linter.idvxlab.com/) - Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. *IEEE transactions on visualization and computer graphics*, 28(1), pp.206-216.

[《数据可视化设计的类型学实践》](https://oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDAUTO&filename=MSDG202203021&uniplatform=OVERSEAS_EN&v=HcZsiecIxauSoKEB1s92_BImgnrMiazYsfZUpb-gcl0zXYx_MEwv5alz1UgtPjz1) - 蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.

## 📄 许可证

MIT
