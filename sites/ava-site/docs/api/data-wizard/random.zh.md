---
title: random
order: 2
---

`markdown:docs/common/style.md`



DataWizard 的数据模拟模块 `random`，提供了非常丰富的模拟数据生成能力。可用于随机生成多种类型的数据，包括基础数据、文本数据、日期时间数据、颜色数据、Web 数据、位置数据、中文地址数据等。你可以用它来快速开发一些数据模拟或自动填充类的功能。你可以使用下面两种方式使用 `random`。

```ts
import { random } from '@antv/data-wizard';

/** 指定工具类 */
const r = new random.BasicRandom();
r.boolean();

/** 通用类 */
const r = new random.Random();
r.boolean();
```

## BasicRandom

随机生成基础数据的工具类，包括布尔值（boolean）、整数（integer）、浮点数（float）和自然数（natural）。

### boolean

生成布尔值。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| likelihood | `number` | 出现正负值的似然性 | `50` | - |

***<font size=3>返回值</font>***

`boolean`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.BasicRandom();
r.boolean();
// true
```

### integer

生成整数。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | 最小值 | `-(2 ** 53 - 1)` | - |
| max | `number` | 最大值 | `2 ** 53 - 1` | - |

***<font size=3>返回值</font>***

`number`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.BasicRandom();
r.integer({min: 1, max: 10000});
// 2
```

### float

生成浮点数。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | 最小值 | `-(2 ** 53 - 1)` | - |
| max | `number` | 最大值 | `2 ** 53 - 1` | - |
| fixed | `number` | 小数位数 | `4` | - |

***<font size=3>返回值</font>***

`number`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.BasicRandom();
r.float();
// 5201.1997
```

### natural

生成自然数。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | 最小值 | `-(2 ** 53 - 1)` | - |
| max | `number` | 最大值 | `2 ** 53 - 1` | - |

***<font size=3>返回值</font>***

`number`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.BasicRandom();
r.natural();
// 6162812464267264
```

## TextRandom

随机生成文本数据的工具类，包括字符（character）、字符串（string）、音节（syllable）、单词（word）、 句子（sentence）、段落（paragraph）、姓名（name）、姓（lastName）、名（firstName）、手机号（phone）、
汉字（cCharacter）、中文词（cWord）、中文句子（cSentence）、中文姓名（cName）、中文姓（cLastName）、中文名（cFirstName）和生肖（cZodiac）。

### character

生成字符。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| pool | `string` | 侯选池 | `''` | - |
| numeric | `string` | 候选数字 | `'0123456789'` | - |
| symbols | `string` | 候选符号 | `'!@#$%^&*()[],.',` | - |
| lower | `string` | 候选小写字母 | `'abcdefghijklmnopqrstuvwxyz'` | - |
| upper | `string` | 候选大写字母 | `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.character();
// 'U'
```

### string

生成字符串。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| pool | `string` | 侯选池 | `''` | - |
| numeric | `string` | 候选数字 | `'0123456789'` | - |
| symbols | `string` | 候选小写字母 | `'!@#$%^&*()[],.',` | - |
| lower | `string` | 候选小写字母 | `'abcdefghijklmnopqrstuvwxyz'` | - |
| upper | `string` | 候选大写字母 | `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'` | - |
| length | `number` | 字符串长度 | `5 ~ 20` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.string();
// 'lly'
```

### syllable

生成音节。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| capitalize | `boolean` | 是否大写 | `false` | - |
| length | `number` | 音节长度 | `2 ~ 3` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.syllable();
// 'na'
```

### word

生成单词。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| syllables | `number` | 音节数 | `1 ~ 3` | - |
| capitalize | `boolean` | 是否大写 | `false` | - |
| length | `number` | 单词长度 | `syllables.length` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.word();
// 'homce'
```

### sentence

生成句子。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| words | `number` | 单词数 | `12 ~ 18` | - |
| punctuation | `boolean | string` | 标点符号 | `true` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.sentence();
// 'Uwo ek enmodo si ga ci jubhuh gun mupvebok se noadicom im esoju bimmeg ro!'
```

### paragraph

生成段落。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| sentence | `number` | 句子数 | `3 ~ 7` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.paragraph();
// 'Dej etfa tassap hiwkoop sak des hol renobew nalcam igabec izizela saifovon gokfojo dewek navvore. Kaz oveiguso zomcesuf ak zigot mu badavine ti ohi me pevkidbin tovco sesop wewenew laga nud. Uzodavzic junciwpaf cuncava idno bamijih amowucele ro bejbuvgit uf puwuc gij bamlor las. Atezuh kit jef ir dohoko wovewhan juen gerzir ekega nubil sakozife hizul wa oloziru. Zuricpa oh kiziwviz baculser dijkavcub hufasgol jevot vowatur ziatru kaviztaw piz vulgokah nek. Adtomduv sor muvab hitsej habatrud pevajad netos sobertaf cawfukuk fasoc rauj ej aloras oksula seljaj mun ic.'
```

### name

生成姓名。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | 性别 | - | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.name();
// 'Gregory Becker'
```

### surname

生成姓。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.surname();
// 'Terry'
```

### givenName

生成名。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | 性别 | - | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.givenName();
// 'Hulda'
```

### phone

生成手机号。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| mobile | `boolean` | 是否是手机 | `true` | - |
| formatted | `boolean` | 用 - 格式化 | `false` | - |
| asterisk | `boolean` | 添加 * 避免生成真实手机号 | `false` | - |
| startNum | `string` | 手机号前缀，只能指定前三位 | `''` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.phone({asterisk: true});
// '182****8595'
```

### cCharacter

生成汉字。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| pool | `string` | 侯选池 | `''` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cCharacter();
// '心'
```

### cWord

生成中文词。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| pool | `string` | 侯选池 | `''` | - |
| length | `number` | 单词长度 | `2~6` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cWord();
// '质可'
```

### cSentence

生成中文句子。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | 最少汉字个数 | `10` | - |
| max | `number` | 最多汉字个数 | `18` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cSentence();
// '始法建克六天老史存王者些已研八快受术速些程理还改提部声华现等下算率明分没千些样社水争马路部越书采见代家。'
```

### cParagraph

生成中文段落。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | 最少句子数 | `3` | - |
| max | `number` | 最多句子数 | `18` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cParagraph();
// '三眼形用下花机行须六准与价看号先即年设团成厂候点委各题路转过划识结。产音道机取族议料历样县具之安列金动名交构队统每水列报时了立对五一清此音话和红品例形关铁米长事群各拉油那山运知命号。'
```

### cName

生成中文姓名。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | 性别 | - | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cName();
// '奉利学'
```

### cSurname

生成中文姓。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cSurname();
// '林'
```

### cGivenName

生成中文名。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | 性别 | - | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.givenName();
// '君妍'
```

### cZodiac

生成生肖。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| locale | `'zh-CN' | 'en-US'` | 国际化 | - | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cZodiac();
// '牛'
```

## DateTimeRandom

随机生成日期时间数据的工具类，包括日期（date）、时间（time）、日期时间（datetime）、时间戳（timestamp）、星期数（weekday）、月份（month）。

### date

生成日期。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | 最小时间的时间戳 | `0` | - |
| max | `number` | 最大时间的时间戳 | `new Date().getTime()` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.date();
// '1989-11-30'
```

### time

生成时间。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| short | `boolean` | UTC 偏移量 | `false` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.time();
// '04:09:02+08:00'
```

### datetime

生成日期时间。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | 最小时间的时间戳 | `0` | - |
| max | `number` | 最大时间的时间戳 | `new Date().getTime()` | - |
| format | `string` | 格式化（参考 [date-fns format](https://date-fns.org/v2.0.1/docs/format)） | `yyyy-MM-dd'T'HH:mm:ssXXX` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.datetime();
// '2019-01-23T09:54:06+08:00'
```

### timestamp

生成日期时间。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | 最小时间的时间戳 | `0` | - |
| max | `number` | 最大时间的时间戳 | `new Date().getTime()` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.timestamp();
// '796136687217'
```

### weekday

生成日期时间。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| locale | `'zh-CN' | 'en-US'` | 国际化 | `'en-US'` | - |
| abbr | `boolean` | 缩写 | `false` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.weekday();
// 'Friday'
```

### month

生成月份。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| locale | `'zh-CN' | 'en-US'` | 国际化 | `'en-US'` | - |
| abbr | `boolean` | 缩写 | `false` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.month();
// 'February'
```

## ColorRandom

随机生成颜色数据的工具类。包括 RGB颜色（rgb）、rgba颜色（rgba）、HSL颜色（hsl）、hsla颜色（hsla）、颜色名（colorname）、颜色名（colorname）、十六进制颜色（hexColor）和十进制颜色（decimalColor）。

### rgb

生成 RGB 颜色。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| grayscale | `boolean` | 灰度级 | `false` | - |
| min | `number` | 最小值 | `0` | - |
| max | `number` | 最大值 | `255` | - |
| minR | `number` | 红色最小值 | `min` | - |
| maxR | `number` | 红色最大值 | `max` | - |
| maxG | `number` | 绿色最小值 | `min` | - |
| maxG | `number` | 绿色最大值 | `max` | - |
| maxB | `number` | 蓝色最小值 | `min` | - |
| maxB | `number` | 蓝色最大值 | `max` | - |
| casing | `'lower' | 'upper'` | 大小写 | `lower` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.rgb();
// 'rgb(202,80,38)'
```

### rgba

生成 rgba 颜色。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| grayscale | `boolean` | 灰度级 | `false` | - |
| min | `number` | 最小值 | `0` | - |
| max | `number` | 最大值 | `255` | - |
| minR | `number` | 红色最小值 | `min` | - |
| maxR | `number` | 红色最大值 | `max` | - |
| maxG | `number` | 绿色最小值 | `min` | - |
| maxG | `number` | 绿色最大值 | `max` | - |
| maxB | `number` | 蓝色最小值 | `min` | - |
| maxB | `number` | 蓝色最大值 | `max` | - |
| casing | `'lower' | 'upper'` | 大小写 | `lower` | - |
| minA | `number` | 大小写 | `lower` | - |
| maxA | `number` | 大小写 | `lower` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.rgba();
// 'rgba(197,205,189,0.5376)'
```

### hsl

生成 HSL 颜色。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| minH | `number` | 色相最小值 | `0` | - |
| maxH | `number` | 色相最大值 | `360` | - |
| maxS | `number` | 饱和度最小值 | `0` | - |
| maxS | `number` | 饱和度最大值 | `100` | - |
| maxL | `number` | 亮度最小值 | `0` | - |
| maxL | `number` | 亮度最大值 | `100` | - |
| casing | `'lower' | 'upper'` | 大小写 | `lower` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.hsl();
// 'hsl(72,8.5613%,29.6035%)'
```

### hsla

生成 hala 颜色。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| minH | `number` | 色相最小值 | `0` | - |
| maxH | `number` | 色相最大值 | `360` | - |
| maxS | `number` | 饱和度最小值 | `0` | - |
| maxS | `number` | 饱和度最大值 | `100` | - |
| maxL | `number` | 亮度最小值 | `0` | - |
| maxL | `number` | 亮度最大值 | `100` | - |
| casing | `'lower' | 'upper'` | 大小写 | `lower` | - |
| minA | `number` | 透明度最小值 | `0` | - |
| maxA | `number` | 透明度最大值 | `1` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.hsla();
// 'hsla(268,98.9866%,6.9809%,0.5648)'
```

### colorName

生成颜色名。

***<font size=3>返回值</font>***

`string`

参考 [MDN color](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value)

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.colorName();
// 'white'
```

### hexColor

生成十六进制颜色。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| grayscale | `boolean` | 灰度级 | `false` | - |
| min | `number` | 最小值 | `0` | - |
| max | `number` | 最大值 | `255` | - |
| minR | `number` | 红色最小值 | `min` | - |
| maxR | `number` | 红色最大值 | `max` | - |
| maxG | `number` | 绿色最小值 | `min` | - |
| maxG | `number` | 绿色最大值 | `max` | - |
| maxB | `number` | 蓝色最小值 | `min` | - |
| maxB | `number` | 蓝色最大值 | `max` | - |
| casing | `'lower' | 'upper'` | 大小写 | `lower` | - |
| prefix | `boolean` | 是否展示 # 前缀  | `false` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.hexColor();
// '#0216ff'
```

### demicalColor

生成十六进制颜色。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| grayscale | `boolean` | 灰度级 | `false` | - |
| min | `number` | 最小值 | `0` | - |
| max | `number` | 最大值 | `255` | - |
| minR | `number` | 红色最小值 | `min` | - |
| maxR | `number` | 红色最大值 | `max` | - |
| maxG | `number` | 绿色最小值 | `min` | - |
| maxG | `number` | 绿色最大值 | `max` | - |
| maxB | `number` | 蓝色最小值 | `min` | - |
| maxB | `number` | 蓝色最大值 | `max` | - |
| casing | `'lower' | 'upper'` | 大小写 | `lower` | - |

***<font size=3>返回值</font>***

`number`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.decimalColor();
// '12272614'
```

## WebRandom

随机生成 Web 数据的工具类。包括顶级域名（tld）、域名（domain）、统一资源定位符（url）、IPv4 地址（ipv4）、IPv6 地址（ipv6）和电子邮箱（email）。

### tld

生成顶级域名。

***<font size=3>返回值</font>***

`string`

参考 [TLD](https://en.wikipedia.org/wiki/Top-level_domain)

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.tld();
// 'uz’
```

### domain

生成域名。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| tld | `string` | 顶级域名 | - | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.domain();
// 'pujan.ee'
```

### url

生成统一资源定位符。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| tld | `string` | 顶级域名 | - | - |
| protocol | `string` | 协议 | `'http'` | - |
| domain | `string` | 域名 | - | - |
| domainPrefix | `string` | `''` | - | - |
| path | `string` | 路径 | - | - |
| extensions | `string[]` | 文件扩展名 | `any[]` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.url();
// 'http://alo.tg/vivso'
```

### ipv4

生成 IPv4 地址。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.ipv4();
// '181.212.214.48'
```

### ipv6

生成 IPv6 地址。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.ipv6();
// '0897:2eed:44ea:7b5f:ebb4:a193:bcee:7346'
```

### email

生成电子邮箱地址。

***<font size=3>参数</font>***

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| domain | `string` | 域名 | - | - |
| length | `number` | 长度 | - | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.email();
// 'ki@petci.tj'
```

## LocationRandom

随机位置工具类。包括经度（longtitude）、纬度（latitude）和坐标（coordinates）。

### longtitude

生成经度。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| fixed | `number` | 小数位数 | `7` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.LocationRandom();
r.longtitude();
// '-131.274007'
```

### latitude

生成纬度。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| fixed | `number` | 小数位数 | `7` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.LocationRandom();
r.latitude();
// '57.7905127'
```

### coordinates

生成坐标。

***<font size=3>参数</font>***

**options** 配置项 _可选_

| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| fixed | `number` | 小数位数 | `7` | - |

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.LocationRandom();
r.coordinates();
// '95.7034666, 80.9377218'
```

## AddressRandom

随机生成中文地址数据的工具类，包括国家（country）、省份（province）、城市（city）、区（district）、路（road）、地址（address）和邮编（postcode）。

### country

生成国家。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.country();
// '中国'
```

### province

生成省份。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.province();
// '浙江省'
```

### city

生成城市。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.city();
// '杭州市'
```

### district

生成区。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.district();
// '西湖区'
```

### road

生成路。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.road();
// '人民大道'
```

### address

生成中文地址。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.address();
// '广东省惠州市龙门县黄河胡同378号'
```

### postcode

生成邮编。

***<font size=3>返回值</font>***

`string`

***<font size=3>用法</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.postcode();
// '330903'
```

