<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18" alt="语言icon" /> 简体中文 | [English](../README.md)


<h1 align="center">
<b>@antv/ava-react</b>
</h1>

<div align="center">

AVA 的 React 组件库

[![MIT License](https://img.shields.io/github/license/antvis/ava)](/LICENSE) [![Language](https://img.shields.io/badge/language-typescript-blue.svg)](https://www.typescriptlang.org) [![NPM Package](https://img.shields.io/npm/v/@antv/ava-react.svg)](https://www.npmjs.com/package/@antv/ava-react) [![NPM Downloads](http://img.shields.io/npm/dm/@antv/ava-react.svg)](https://www.npmjs.com/package/@antv/ava-react) 

</div>

## 简介

[@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) 是基于 AVA 能力整合而成的即插即用的 React 组件库， 它包含三大核心组件：

* `<NarrativeTextVis/>`：展示数据洞察解读文本。在数据分析的全流程展示中，使用文本描述数据现象和给出洞察结论同样关键。
* `<InsightCard/>`：以图文结合的方式展示数据洞察。既可以直接接收数据并自动进行洞察，也可以仅对洞察结果数据进行可视化和解读的展示。
* `<AutoChart/>`：根据数据自动推荐合适的图表并渲染。它可以为用户提供一行代码实现智能可视化的能力，目前该组件正在进一步升级中。


## 安装使用

可以通过 npm 或 yarn 包管理器进行安装。

```shell
# npm
$ npm install @antv/ava-react --save

# yarn
$ yarn add @antv/ava-react
```

下面我们结合实际案例了解 [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) 三个核心组件的使用方式：

1. `<NarrativeTextVis/>` 使用示例：

    ```ts
    import { NarrativeTextVis } from '@antv/ava-react';

    export default () => {
    // 其中 textSpec 类型为 NarrativeTextSpec
    return <NarrativeTextVis spec={textSpec} />
    }
    ```

2. `<InsightCard/>` 使用示例

    ```ts
    // 引入 <InsightCard /> 组件
    import { InsightCard } from '@antv/ava-react';

    export default () => {
    // 其中 insightInfo 类型参考 insight 模块输出的数据洞察
    return <InsightCard insightInfo={insightInfo} />
    }
    ```

3. `<AutoChart/>` 组件进一步升级中，尽请期待。

## 贡献

我们欢迎任何共建。请先阅读 [贡献指南](./CONTRIBUTING.zh-CN.md)。欢迎通过 [pull requests](https://github.com/antvis/AVA/pulls) 或 [GitHub issues](https://github.com/antvis/AVA/issues) 向我们提供你的想法。让我们一起来把 AVA 做得更好！
