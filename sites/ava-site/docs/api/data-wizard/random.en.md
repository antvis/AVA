---
title: random
order: 2
---

`markdown:docs/common/style.md`



The `random` module of DataWizard provides you comprehensive data mocking options. Data types include basic data, text data, datetime data, color data, Web data, location data, Chinese data address, etc.. You can use it to quickly develop some data generating or auto-filling functions. The `random` method can be used in the following two ways.

```ts
import { random } from '@antv/data-wizard';

/** Specify the tool class */
const r = new random.BasicRandom();
r.boolean();

/* Generic class */
const r = new random;
r.boolean();
```

## BasicRandom

The tool class `BasicRandom` can help you generate random basic data, including boolean, integer, float and natural number.

### boolean

Generate a boolean value.

***<font size=3>Parameters</font>***


**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| likelihood | `number` | Likelihood of true and false | `50` | - |

***<font size=3>Return value</font>***


`boolean`

***<font size=3>Usage</font>***


```ts
import { random } from '@antv/data-wizard';

const r = new random;
r.boolean();
// true
```

### integer

Generate an integer.

***<font size=3>Parameters</font>***


**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | Minimum | `-(2 ** 53 - 1)` | - |
| max | `number` | Maximun | `2 ** 53 - 1` | - |

***<font size=3>Return value</font>***


`number`

***<font size=3>Usage</font>***


```ts
import { random } from '@antv/data-wizard';

const r = new random.BasicRandom();
r.integer({min: 1, max: 10000});
// 2
```

### float

Generate a floating point number.

***<font size=3>Parameters</font>***


**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | Minimum | `-(2 ** 53 - 1)` | - |
| max | `number` | Maximun | `2 ** 53 - 1` | - |
| fixed | `number` | Decimal places | `4` | - |

***<font size=3>Return value</font>***

`number`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random;
r.float();
// 5201.1997
```

### natural

Generate a natural number.

***<font size=3>Parameters</font>***


**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | Minimum | `-(2 ** 53 - 1)` | - |
| max | `number` | Maximun | `2 ** 53 - 1` | - |

***<font size=3>Return value</font>***


`number`

***<font size=3>Usage</font>***


```ts
import { random } from '@antv/data-wizard';

const r = new random;
r.natural();
// 6162812464267264
```

## TextRandom

The tool class `TextRandom` can help you generate random text data, including character, string, syllable, word, sentence, paragraph, name, surname, given name (givenName), phone number (phone), Chinese character (cCharacter), Chinese word (cWord), Chinese sentence (cSentence), Chinese name (cName), Chinese surname (cSurname), Chinese given name (cGivenName) and Chinese zodiac (cZodiac).

### character

Generate a character.

***<font size=3>Parameters</font>***


**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| pool | `string` | Candidate pool | `''` | - |
| numeric | `string` | Candidate numbers | `'0123456789'` | - |
| symbols | `string` | Candidate symbols | `'! @#$%^&*()[],.' , ` | - | lower
| lower | `string` | Lowercase letters | `'abcdefghijklmnopqrstuvwxyz'` | - |
| upper | `string` | Uppercase letters | `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'` | - |

***<font size=3>Return value</font>***


`string`

***<font size=3>Usage</font>***


```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.character();
// 'U'
```

### string

Generate a string.

***<font size=3>Parameters</font>***


**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| pool | `string` | Candidate pool | `''` | - |
| numeric | `string` | Candidate numbers | `'0123456789'` | - |
| symbols | `string` | Candidate symbols | `'! @#$%^&*()[],.' , ` | - | lower
| lower | `string` | Lowercase letters | `'abcdefghijklmnopqrstuvwxyz'` | - |
| upper | `string` | Uppercase letters | `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'` | - |
| length | `number` | String length | `5 ~ 20` | - |

***<font size=3>Return value</font>***


`string`

***<font size=3>Usage</font>***


```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.string();
// 'lly'
```

### syllable

Generate syllables.

***<font size=3>Parameters</font>***


**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| capitalize | `boolean` | Capitalize or not | `false` | - |
| length | `number` | syllable length | `2 ~ 3` | - |

***<font size=3>Return value</font>***


`string`

***<font size=3>Usage</font>***


```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.syllable();
// 'na'
```

### word

Generate a word.

***<font size=3>Parameters</font>***


**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| syllables | `number` | Number of syllables | `1 ~ 3` | - |
| capitalize | `boolean` | Capitalize or not | `false` | - |
| length | `number` | Word length | `syllables.length` | - |

***<font size=3>Return value</font>***


`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.word();
// 'homce'
```

### sentence

Generate a sentence.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| words | `number` | Number of words | `12 ~ 18` | - |
| punctuation | `boolean | string` | Punctuation | `true` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.sentence();
// 'Uwo ek enmodo si ga ci jubhuh gun mupvebok se noadicom im esoju bimmeg ro!'
```

### paragraph

Generate a paragraph.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| sentence | `number` | Number of sentences | `3 ~ 7` | - |


***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.paragraph();
// 'Dej etfa tassap hiwkoop sak des hol renobew nalcam igabec izizela saifovon gokfojo dewek navvore. Kaz oveiguso zomcesuf ak zigot mu badavine ti ohi me pevkidbin tovco sesop wewenew laga nud. Uzodavzic junciwpaf cuncava idno bamijih amowucele ro bejbuvgit uf puwuc gij bamlor las. Atezuh kit jef ir dohoko wovewhan juen gerzir ekega nubil sakozife hizul wa oloziru. Zuricpa oh kiziwviz baculser dijkavcub hufasgol jevot vowatur ziatru kaviztaw piz vulgokah nek. Adtomduv sor muvab hitsej habatrud pevajad netos sobertaf cawfukuk fasoc rauj ej aloras oksula seljaj mun ic.'
```

### name

Generate a name.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | Gender | - | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.name();
// 'Gregory Becker'
```

### surname

Generate a surname.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.surname();
// 'Terry'
```

### givenName

Generate a given name.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | Gender | - | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.givenName();
// 'Hulda'
```

### phone

Generate a phone number.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| mobile | `boolean` | Mobile phone or landline | `true` | - |
| formatted | `boolean` | Formatted or not | `false` | - |
| asterisk | `boolean` | Add * to avoid generating real phone numbers | `false` | - |
| startNum | `string` | Phone number prefix, only the first three digits can be specified | `''` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.phone({asterisk: true});
// '182****8595'
```

### cCharacter

Generate a Chinese character.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| pool | `string` | Candidate pool | `''` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cCharacter();
// '心'
```

### cWord

Generate a Chinese word.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| pool | `string` | Candidate pool | `''` | - |
| length | `number` | Word length | `2~6` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cWord();
// '质可'
```

### cSentence

Generate a Chinese sentence.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | Minimum number of characters | `10` | - |
| max | `number` | Maximum number of characters | `18` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cSentence();
// '始法建克六天老史存王者些已研八快受术速些程理还改提部声华现等下算率明分没千些样社水争马路部越书采见代家。'
```

### cParagraph

Generate a Chinese paragraph.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | Minimum number of sentences | `3` | - |
| max | `number` | Maximun number of sentences | `18` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cParagraph();
// '三眼形用下花机行须六准与价看号先即年设团成厂候点委各题路转过划识结。产音道机取族议料历样县具之安列金动名交构队统每水列报时了立对五一清此音话和红品例形关铁米长事群各拉油那山运知命号。'
```

### cName

Generate a Chinese name.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | Gender | - | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cName();
// '奉利学'
```

### cSurname

Generate a Chinese surname.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cSurname();
// '林'
```

### cGivenName

Generate a Chinese name.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | Gender | - | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.givenName();
// '君妍'
```

### cZodiac

Generate a zodiac.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| locale | `'zh-CN' | 'en-US'` | i18n | - | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cZodiac();
// '牛'
```

## DateTimeRandom

The tool class `DateTimeRandom` can help you generate random datetime data, including date, time, datetime, timestamp, weekday, month.

### date

Generate a date.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | Minimum timestamp | `0` | - |
| max | `number` | Maximum timestamp | `new Date().getTime()` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.date();
// '1989-11-30'
```

### time

Generate a time.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| short | `boolean` | UTC offset | `false` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.time();
// '04:09:02+08:00'
```

### datetime

Generate a datetime.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | Minimum timestamp | `0` | - |
| max | `number` | Maximum timestamp | `new Date().getTime()` | - |
| format | `string` | Formatting (refer to [date-fns format](https://date-fns.org/v2.0.1/docs/format)) | `yyyy-MM-dd'T'HH:mm:ssXXX` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.datetime();
// '2019-01-23T09:54:06+08:00'
```

### timestamp

Generate a timestamp.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| min | `number` | Minimum timestamp  | `0` | - |
| max | `number` | Maximum timestamp | `new Date().getTime()` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.timestamp();
// '796136687217'
```

### weekday

Generate a weekday.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| locale | `'zh-CN' | 'en-US'` | i18n | `'en-US'` | - |
| abbr | `boolean` | Abbreviation | `false` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.weekday();
// 'Friday'
```

### month

Generate a month.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ---- | ---- | ---- | ---- | ---- |
| locale | `'zh-CN' | 'en-US'` | i18n | `'en-US'` | - |
| abbr | `boolean` | Abbreviation | `false` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.month();
// 'February'
```

## ColorRandom

The tool class `ColorRandom` can help you generate random color data, including RGB color (rgb), rgba color (rgba), HSL color (hsl), hsla color (hsla), color name (colorName), hex color (hexColor) and decimal color (decimalColor).

### rgb

Generate a RGB color.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| grayscale | `boolean` | Grayscale | `false` | - |
| min | `number` | Minimum | `0` | - |
| max | `number` | Maximum | `255` | - |
| minR | `number` | Minimum red value | `min` | - |
| maxR | `number` | Maximum red value | `max` | - |
| maxG | `number` | Minimum green value | `min` | - |
| maxG | `number` | Maximum green value | `max` | - |
| maxB | `number` | Minimum blue value | `min` | - |
| maxB | `number` | Maximum blue value | `max` | - |
| casing | `'lower' | 'upper'` | Case | `lower` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.rgb();
// 'rgb(202,80,38)'
```

### rgba

Generate a rgba color.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| grayscale | `boolean` | Grayscale | `false` | - |
| min | `number` | Minimum | `0` | - |
| max | `number` | Maximum | `255` | - |
| minR | `number` | Minimum red value | `min` | - |
| maxR | `number` | Maximum red value | `max` | - |
| maxG | `number` | Minimum green value | `min` | - |
| maxG | `number` | Maximum green value | `max` | - |
| maxB | `number` | Minimum blue value | `min` | - |
| maxB | `number` | Maximum blue value | `max` | - |
| casing | `'lower' | 'upper'` | Case | `lower` | - |
| minA | `number` | Minimum transparency | `lower` | - |
| maxA | `number` | Maximum transparency | `lower` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.rgba();
// 'rgba(197,205,189,0.5376)'
```

### hsl

Generate a HSL color.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| minH | `number` | Minimum hue | `0` | - |
| maxH | `number` | Maximum hue | `360` | - |
| maxS | `number` | Minimum saturation | `0` | - |
| maxS | `number` | Maximum saturation | `100` | - |
| minL | `number` | Minimum lightness | `0` | - |
| maxL | `number` | Maximum lightness | `100` | - |
| casing | `'lower' | 'upper'` | Case | `lower` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.hsl();
// 'hsl(72,8.5613%,29.6035%)'
```

### hsla

Generate a hsla color.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| minH | `number` | Minimum hue | `0` | - |
| maxH | `number` | Maximum hue | `360` | - |
| maxS | `number` | Minimum saturation | `0` | - |
| maxS | `number` | Maximum saturation | `100` | - |
| minL | `number` | Minimum lightness | `0` | - |
| maxL | `number` | Maximum lightness | `100` | - |
| casing | `'lower' | 'upper'` | Case | `lower` | - |
| minA | `number` | Minimum transparency | `lower` | - |
| maxA | `number` | Maximum transparency | `lower` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.hsla();
// 'hsla(268,98.9866%,6.9809%,0.5648)'
```

### colorName

Generate a color name.

***<font size=3>Return value</font>***

`string`

Reference [MDN color](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value)

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.colorName();
// 'white'
```

### hexColor

Generate a hexadecimal color.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| grayscale | `boolean` | Grayscale | `false` | - |
| min | `number` | Minimum | `0` | - |
| max | `number` | Maximum | `255` | - |
| minR | `number` | Minimum red value | `min` | - |
| maxR | `number` | Maximum red value | `max` | - |
| maxG | `number` | Minimum green value | `min` | - |
| maxG | `number` | Maximum green value | `max` | - |
| maxB | `number` | Minimum blue value | `min` | - |
| maxB | `number` | Maximum blue value | `max` | - |
| casing | `'lower' | 'upper'` | Case | `lower` | - |
| prefix | `boolean` | Whether to show # prefix | `false` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.hexColor();
// '#0216ff'
```

### demicalColor

Generate a decimal color.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| grayscale | `boolean` | Grayscale | `false` | - |
| min | `number` | Minimum | `0` | - |
| max | `number` | Maximum | `255` | - |
| minR | `number` | Minimum red value | `min` | - |
| maxR | `number` | Maximum red value | `max` | - |
| maxG | `number` | Minimum green value | `min` | - |
| maxG | `number` | Maximum green value | `max` | - |
| maxB | `number` | Minimum blue value | `min` | - |
| maxB | `number` | Maximum blue value | `max` | - |
| casing | `'lower' | 'upper'` | Case | `lower` | - |

***<font size=3>Return value</font>***

`number`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.decimalColor();
// '12272614'
```

## WebRandom

The tool class `WebRandom` can help you generate random Web data, including top-level domain (tld), domain name (domain), Uniform Resource Locator (url), IPv4 address (ipv4), IPv6 address (ipv6), and email address (email).

### tld

Generate a top-level domain.

***<font size=3>Return value</font>***

`string`

Reference [TLD](https://en.wikipedia.org/wiki/Top-level_domain)

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.tld();
// 'uz'
```

### domain

Generate a domain name.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| tld | `string` | Top-level domain | - | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.domain();
// 'pujan.ee'
```

### url

Generate a Uniform Resource Locator.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| tld | `string` | Top-level domain | - | - |
| protocol | `string` | Protocol | `'http'` | - |
| domain | `string` | Domain name | - | - |
| domainPrefix | `string` | Domain prefix | `''`  | - |
| path | `string` | Path | - | - |
| extensions | `string[]` | File extensions | `any[]` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.url();
// 'http://alo.tg/vivso'
```

### ipv4

Generate an IPv4 address.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.ipv4();
// '181.212.214.48'
```

### ipv6

Generate an IPv6 address.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.ipv6();
// '0897:2eed:44ea:7b5f:ebb4:a193:bcee:7346'
```

### email

Generate an email address.

***<font size=3>Parameters</font>***

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| domain | `string` | Domain name | - | - |
| length | `number` | Length | - | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.email();
// 'ki@petci.tj'
```

## LocationRandom

The tool class `LocationRandom` can help you generate random location data, including longitude, latitude and coordinates.

### longtitude

Generate a longitude.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| fixed | `number` | Decimal places | `7` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.LocationRandom();
r.longtitude();
// '-131.274007'
```

### latitude

Generate a latitude.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| fixed | `number` | Decimal places | `7` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.LocationRandom();
r.latitude();
// '57.7905127'
```

### coordinates

Generate the coordinates.

***<font size=3>Parameters</font>***

**options** Configuration options _optional_

| Property | Type | Description | Default | Required | 
| ----| ---- | ---- | ---- | ---- |
| fixed | `number` | Decimal places | `7` | - |

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.LocationRandom();
r.coordinates();
// '95.7034666, 80.9377218'
```

## AddressRandom

The tool class `AddressRandom` can help you generate random Chinese address data, including country, province, city, district, road, address and postcode.

### country

Generate a country.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.country();
// 'China'
```

### province

Generate a province.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.province();
// 'Zhejiang Province'
```

### city

Generate a city.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.city();
// 'hangzhou'
```

### district

Generate a district.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.district();
// 'Westlake district'
```

### road

Generate a road.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.road();
// 'people's road'
```

### address

Generate a Chinese address.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.address();
// '广东省惠州市龙门县黄河胡同378号'
```

### postcode

Generate a postcode.

***<font size=3>Return value</font>***

`string`

***<font size=3>Usage</font>***

```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.postcode();
// '330903'
```

