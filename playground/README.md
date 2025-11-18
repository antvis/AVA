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
```

## 📝 已实现示例

### Advise Summary

#### 基础示例 (`/advise-summary`)
- 展示如何使用 AVA 生成图表建议
- 支持自定义 JSON 数据输入
- 实时预览生成的图表

#### 多图表示例 (`/advise-summary-multiple`)
- 展示如何处理复杂数据
- 生成多个图表建议
- 中文数据支持


## 💡 核心优势

### 1. 源码级开发

```tsx
// 引入会直接指向 packages/ava/src
import { AVA } from '@antv/ava';
```

修改 `packages/ava/src` 下的任何文件，浏览器会立即更新！


## 📖 如何添加新示例


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


## 📄 License

MIT
