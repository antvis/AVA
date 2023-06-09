<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18" alt="language icon" /> English | [简体中文](./zh-CN/README.zh-CN.md)


<h1 align="center">
<b>@antv/ava-react</b>
</h1>

<div align="center">

React components of AVA.

[![MIT License](https://img.shields.io/github/license/antvis/ava)](/LICENSE) [![Language](https://img.shields.io/badge/language-typescript-blue.svg)](https://www.typescriptlang.org) [![NPM Package](https://img.shields.io/npm/v/@antv/ava-react.svg)](https://www.npmjs.com/package/@antv/ava-react) [![NPM Downloads](http://img.shields.io/npm/dm/@antv/ava-react.svg)](https://www.npmjs.com/package/@antv/ava-react) 

</div>

## Introduction

[@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) is a plug-and-play React component library based on the integration of AVA capabilities, which contains three core components:

* `<NarrativeTextVis/>`: Demonstrate data insight interpretation text. In a full-flow presentation of data analysis, using text to describe data phenomena is as critical as giving insightful conclusions.
* `<InsightCard/>`: Present data insights in a combination of graphics and text. It is possible to either receive data directly and perform insights automatically, or to visualize and interpret only the insight result data for presentation.
* `<AutoChart/>`: Automatically recommends and renders the appropriate chart based on the data. It provides users with the ability to implement intelligent visualizations in one line of code, and the component is currently undergoing further upgrades.

## Installation and Usage

Installation can be done via npm or the yarn package manager.

```shell
# npm
$ npm install @antv/ava-react --save

# yarn
$ yarn add @antv/ava-react
```

The following is a practical example of how the three main components of [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) can be used:

1. Examples of `<NarrativeTextVis/>`:

    ```ts
    import { NarrativeTextVis } from '@antv/ava-react';
    export default () => {
    // where textSpec is of type NarrativeTextSpec
    return <NarrativeTextVis spec={textSpec} />
    }
    ```

2. Examples of `<InsightCard/>`:

    ```ts
    import { InsightCard } from '@antv/ava-react';
    export default () => {
    // where the insightInfo type refers to the data insight output by the insight module
    return <InsightCard insightInfo={insightInfo} />
    }
    ```

3. `<AutoChart/>` is being further upgraded, so stay tuned.

```ts
import { NarrativeTextVis } from '@antv/ava-react';
```

## Contribution [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

We welcome all contributions. Please read our [Contributing Guide](./CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/antvis/AVA/pulls) or as [GitHub issues](https://github.com/antvis/AVA/issues). Let's build a better AVA together.

More at [Wiki: Development](https://github.com/antvis/AVA/wiki/Development).
