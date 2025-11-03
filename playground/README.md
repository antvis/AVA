# 🎮 AVA Playground

用于调试 AVA 库示例代码的开发环境，支持源码级热更新。

## ✨ 特性

- 🔥 **源码级热更新** - 直接从 `packages/ava/src` 引入，修改立即生效
- ⚡️ **快速启动** - 基于 Vite，毫秒级启动和热更新
- 📦 **零构建开发** - 无需构建 AVA 库即可开发调试
- 🎨 **友好界面** - 基于 Ant Design 的清晰导航
- 🔧 **TypeScript** - 完整的类型支持

## 🚀 快速开始

### 首次使用

```bash
# 在项目根目录
npm run setup:playground
npm run start:playground
```

### 日常使用

```bash
npm run start:playground
```

浏览器将自动打开 http://localhost:3000

## 📂 项目结构

```
playground/
├── src/
│   ├── examples/              # 示例代码
│   │   └── advise-summary/
│   │       ├── index.tsx      # 基础示例
│   │       └── multiple.tsx   # 多图表示例
│   ├── App.tsx               # 主应用（路由、菜单）
│   ├── main.tsx              # 入口文件
│   └── index.css             # 全局样式
├── index.html                # HTML 模板
├── vite.config.ts            # Vite 配置（别名等）
├── tsconfig.json             # TS 配置
├── package.json              # 依赖配置
├── README.md                 # 本文件
└── GUIDE.md                  # 详细使用指南
```

## 📝 已实现示例

### Advise Summary

#### 基础示例 (`/advise-summary`)
- 展示如何使用 Advisor 生成图表建议
- 支持自定义 JSON 数据输入
- 实时预览生成的图表

#### 多图表示例 (`/advise-summary-multiple`)
- 展示如何处理复杂数据
- 生成多个图表建议
- 中文数据支持

## 🔧 技术栈

- **构建工具**: Vite 5.x
- **框架**: React 18.x
- **UI 库**: Ant Design 5.x
- **路由**: React Router 6.x
- **语言**: TypeScript 5.x
- **AVA 库**: 直接从源码引入 (`packages/ava/src`)

## 🎯 与其他环境对比

| 特性 | playground | site | playground |
|------|---------------|------|------------|
| 构建工具 | Vite | Dumi | Umi |
| 热更新 | ✅ 源码级 | ❌ 需构建 | ❌ 需构建 |
| 用途 | 开发调试 | 文档展示 | Demo 展示 |
| AVA 引入 | 源码直接引入 | 打包后引入 | 打包后引入 |
| 启动速度 | 🚀 极快 | 慢 | 慢 |
| 适用场景 | 功能开发 | 文档编写 | 完整演示 |

## 💡 核心优势

### 1. 源码级开发

```tsx
// 引入会直接指向 packages/ava/src
import { Advisor } from '@antv/ava';
```

修改 `packages/ava/src` 下的任何文件，浏览器会立即更新！

### 2. 无需构建

传统方式：
```bash
# 修改代码
cd packages/ava
npm run build    # 等待构建，可能需要几分钟
cd ../../playground
npm start        # 重启服务
```

使用 playground：
```bash
# 修改代码
# 自动热更新 ✅ 无需任何操作！
```

## 📖 如何添加新示例

详见 [GUIDE.md](./GUIDE.md)

简要步骤：

1. 在 `src/examples/` 下创建新文件
2. 编写 React 组件
3. 在 `App.tsx` 中添加路由和菜单
4. 开始调试！

## 🐛 故障排查

### 启动失败

```bash
cd playground
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 类型错误

1. 重启 VSCode TypeScript 服务
2. 检查 `packages/ava` 的依赖是否已安装

### 热更新不工作

1. 检查浏览器控制台是否有错误
2. 重启开发服务器
3. 清除浏览器缓存

## 🤝 贡献

欢迎添加更多示例！

1. Fork 并创建分支
2. 在 `src/examples/` 下添加新示例
3. 更新 `App.tsx` 添加路由
4. 提交 Pull Request

## 📚 相关文档

- [详细使用指南](./GUIDE.md)
- [AVA 文档](https://ava.antv.antgroup.com)
- [Vite 文档](https://vitejs.dev)
- [React Router 文档](https://reactrouter.com)

## 📄 License

MIT
