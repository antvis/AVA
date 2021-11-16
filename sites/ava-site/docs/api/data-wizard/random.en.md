---
title: random
order: 2
---

`markdown:docs/common/style.md`

<div class="doc-md">

`Random` contains DW's random data generation methods that can generate random values, text, domain names, colors, geographic locations, time and other data. The random number method can be used in the following two ways.

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
Tool class for randomly generating basic data, including boolean (boolean), integer (integer), float (float) and natural (natural) numbers.

### boolean
Generates boolean values.

#### Parameters
**options** configuration item _optional_

| properties | type | description | default | mandatory | 
| ----| ---- | ---- | ---- | ---- | ---- |
| likelihood | `number` | likelihood of occurrence of positive and negative values | `50` | - |

#### Return Value
`boolean`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random;
r.boolean();
// true
```

### integer
Generate an integer.

#### Parameters
**options** configuration item _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| min | `number` | min | `-(2 ** 53 - 1)` | - |
| max | `number` | max | `2 ** 53 - 1` | - |

#### Return Value
`number`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.BasicRandom();
r.integer({min: 1, max: 10000});
// 2
```

### float
Generate a floating point number.

#### Parameters
**options** configuration item _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| min | `number` | min | `-(2 ** 53 - 1)` | - |
| max | `number` | max | `2 ** 53 - 1` | - |
| fixed | `number` | number of decimal places | `4` | - |

#### Return Value
`number`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random;
r.float();
// 5201.1997
```

### natural
Generate a natural number.

#### Parameters
**options** Configuration items _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| min | `number` | min | `-(2 ** 53 - 1)` | - |
| max | `number` | max | `2 ** 53 - 1` | - |

#### Return Value
`number`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random;
r.natural();
// 6162812464267264
```

## TextRandom
A tool class for randomly generating text data, including character, string, syllable, word, sentence, paragraph, name, lastName, firstName, phone phone)
Chinese character (cCharacter), Chinese word (cWord), Chinese sentence (cSentence), Chinese name (cName), Chinese surname (cLastName), Chinese name (cFirstName) and Chinese zodiac (cZodiac).

### character
Generate characters.

#### Parameters
**options** configuration item _optional_

| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| pool | `string` | optional_word | `''` | - |
| numeric | `string` | numbers | `'0123456789'` | - |
| symbols | `string` | symbols | `'! @#$%^&*()[],.' , ` | - | lower
| lower | `string` | lowercase letters | `'abcdefghijklmnopqrstuvwxyz'` | - |
| upper | `string` | uppercase letters | `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.character();
// 'U'
```

### string
Generate a string.

#### Parameters
**options** Configuration items _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| pool | `string` | common_word | `''` | - |
| numeric | `string` | numbers | `'0123456789'` | - |
| symbols | `string` | symbols | `'! @#$%^&*()[],.' , ` | - | lower
| lower | `string` | lowercase letters | `'abcdefghijklmnopqrstuvwxyz'` | - |
| upper | `string` | uppercase | `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'` | - |
| length | `number` | string length | `5 ~ 20` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.string();
// 'lly'
```

### syllable
Generate syllables.

#### Parameters
**options** Configuration items _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- |
| capitalize | `boolean` | whether to capitalize | `false` | - |
| length | `number` | string length | `2 ~ 3` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.syllable();
// 'na'
```

### word
Generate the word.

#### Parameters
**options** configuration item _optional_

| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| syllables | `number` | number of syllables | `1 ~ 3` | - |
| capitalize | `boolean` | whether to capitalize | `false` | - |
| length | `number` | word length | `syllables.length` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.word();
// 'homce'
```

### sentence
Generate a sentence.

#### parameters
**options** Configuration items _optional_

| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| words | `number` | number of words | `12 ~ 18` | - |
| punctuation | `boolean | string` | symbol | `true` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.sentence();
// 'Uwo ek enmodo si ga ci jubhuh gun mupvebok se noadicom im esoju bimmeg ro!'
```

### paragraph
Generate paragraphs.

#### Parameters
**options** Configuration items _optional_

| properties | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- |
| sentence | `number` | number of sentences | `3 ~ 7` | - |


#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.paragraph();
// 'Dej etfa tassap hiwkoop sak des hol renobew nalcam igabec izizela saifovon gokfojo dewek navvore. Kaz oveiguso zomcesuf ak zigot mu badavine ti ohi me pevkidbin tovco sesop wewenew laga nud. Uzodavzic junciwpaf cuncava idno bamijih amowucele ro bejbuvgit uf puwuc gij bamlor las. Atezuh kit jef ir dohoko wovewhan juen gerzir ekega nubil sakozife hizul wa oloziru. Zuricpa oh kiziwviz baculser dijkavcub hufasgol jevot vowatur ziatru kaviztaw piz vulgokah nek. Adtomduv sor muvab hitsej habatrud pevajad netos sobertaf cawfukuk fasoc rauj ej aloras oksula seljaj mun ic.'
```

### name
Generate a name.

#### Parameters
**options** Configuration items _optional_

| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | gender | - | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.name();
// 'Gregory Becker'
```

### lastName
Generate the last name.

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.lastName();
// 'Terry'
```

### firstName
Generate the name.

#### Parameters
**options** Configuration items _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | gender | - | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.firstName();
// 'Hulda'
```

### phone
Generate a cell phone number.

#### Parameters
**options** Configuration items _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| mobile | `boolean` | whether to collect | `true` | - |
| formatted | `boolean` | use - formatted | `false` | - |
| asterisk | `boolean` | add * to avoid generating real phone numbers | `false` | - |
| startNum | `string` | phone number prefix, only the first three digits can be specified | `''` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.phone({asterisk: true});
// '182****8595'
```

### cCharacter
Generate Chinese characters.

#### Parameters
**options** configuration item _optional_

| attribute | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| pool | `string` | optional_word | `''` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cCharacter();
// '心'
```

### cWord
Generate Chinese words.

#### Parameters
**options** configuration item _optional_

| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| pool | `string` | optional_word | `''` | - |
| length | `number` | word length | `2~6` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cWord();
// '质可'
```

### cSentence
Generate a Chinese sentence.

#### Parameters
**options** configuration item _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| min | `number` | minimum number of characters | `10` | - |
| max | `number` | maximum number of characters | `18` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cSentence();
// '始法建克六天老史存王者些已研八快受术速些程理还改提部声华现等下算率明分没千些样社水争马路部越书采见代家。'
```

### cParagraph
Generate a Chinese paragraph.

#### Parameters
**options** Configuration items _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| min | `number` | Minimum number of sentences | `3` | - |
| max | `number` | max number of sentences | `18` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cParagraph();
// '三眼形用下花机行须六准与价看号先即年设团成厂候点委各题路转过划识结。产音道机取族议料历样县具之安列金动名交构队统每水列报时了立对五一清此音话和红品例形关铁米长事群各拉油那山运知命号。'
```

### cName
Generate a Chinese name.

#### Parameters
**options** configuration item _optional_

| attribute | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | gender | - | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cName();
// '奉利学'
```

### cLastName
Generate a Chinese surname.

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cLastName();
// '林'
```

### cFirstName
Generate a Chinese name.

#### Parameters
**options** configuration item _optional_

| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| gender | `'male' | 'female'` | gender | - | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.firstName();
// '君妍'
```

### cZodiac
Generate the zodiac.

#### Parameters
**options** configuration item _optional_

| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| locale | `'zh-CN' | 'en-US'` | internationalization | - | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.TextRandom();
r.cZodiac();
// '牛'
```

## DateTimeRandom
Tool class for generating random time data, including date, time, datetime, timestamp, weekday, month.

### date
Generates a date.

#### Parameters
**options** Configuration item _optional_

|property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| min | `number` | timestamp of minimum time | `0` | - |
| max | `number` | timestamp of the maximum time | `new Date().getTime()` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.date();
// '1989-11-30'
```

### time
The time to generate.

#### Parameters
**options** Configuration items _optional_

| properties | type | description | default | mandatory | 
| ----| ---- | ---- | ---- | ---- | ---- |
| short | `boolean` | UTC offset | `false` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.time();
// '04:09:02+08:00'
```

### datetime
Generates a datetime.

#### Parameters
**options** configuration item _optional_

| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| min | `number` | timestamp of minimum time | `0` | - |
| max | `number` | timestamp of the maximum time | `new Date().getTime()` | - |
| format | `string` | formatting (refer to [date-fns format](https://date-fns.org/v2.0.1/docs/format)) | `yyyy-MM-dd'T'HH:mm:ssXXX` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.datetime();
// '2019-01-23T09:54:06+08:00'
```

### timestamp
Generate a datetime.

#### Parameters
**options** configuration item _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| min | `number` | timestamp of minimum time | `0` | - |
| max | `number` | timestamp of the maximum time | `new Date().getTime()` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.timestamp();
// '796136687217'
```

### weekday
Generates the date and time.

#### Parameters
**options** Configuration item _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| locale | `'zh-CN' | 'en-US'` | internationalization | `'en-US'` | - |
| abbr | `boolean` | abbreviation | `false` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.weekday();
// 'Friday'
```

### month
Generate the month.

#### Parameters
**options** Configuration items _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ----
| locale | `'zh-CN' | 'en-US'` | internationalization | `'en-US'` | - |
| abbr | `boolean` | abbreviation | `false` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.DateTimeRandom();
r.month();
// 'February'
```

## ColorRandom
Tool class for randomly generating color data. Includes RGB colors (rgb), rgba colors (rgba), HSL colors (hsl), hsla colors (hsla), color names (colorname), color names (colorname), hex colors (hexColor) and decimal colors (decimalColor).

### rgb
Generates RGB colors.

#### Parameters
**options** Configuration item _optional_

| properties | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| grayscale | `boolean` | grayscale | `false` | - |
| min | `number` | min | `0` | - |
| max | `number` | max | `255` | - |
| minR | `number` | red min | `min` | - |
| maxR | `number` | red max | `max` | - |
| maxG | `number` | green min | `min` | - | maxG | `number` | green min
| maxG | `number` | green max | `max` | - |
| maxB | `number` | blue min | `min` | - | maxB | `number` | blue min
| maxB | `number` | blue max | `max` | - |
| casing | `'lower' | 'upper'` | case | `lower` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.rgb();
// 'rgb(202,80,38)'
```

### rgba
Generate rgba colors.

#### Parameters
**options** Configuration items _optional_

| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| grayscale | `boolean` | grayscale | `false` | - |
| min | `number` | min | `0` | - |
| max | `number` | max | `255` | - |
| minR | `number` | red min | `min` | - |
| maxR | `number` | red max | `max` | - |
| maxG | `number` | green min | `min` | - | maxG | `number` | green min
| maxG | `number` | green max | `max` | - |
| maxB | `number` | blue min | `min` | - | maxB | `number` | blue min
| maxB | `number` | blue max | `max` | - |
| casing | `'lower' | 'upper'` | case | `lower` | - |
| minA | `number` | case | `lower` | - |
| maxA | `number` | case | `lower` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.rgba();
// 'rgba(197,205,189,0.5376)'
```

### rgba
Generate rgba colors.

#### Parameters
**options** Configuration item _optional_

| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| grayscale | `boolean` | grayscale | `false` | - |
| min | `number` | min | `0` | - |
| max | `number` | max | `255` | - |
| minR | `number` | red min | `min` | - |
| maxR | `number` | red max | `max` | - |
| maxG | `number` | green min | `min` | - | maxG | `number` | green min
| maxG | `number` | green max | `max` | - |
| maxB | `number` | blue min | `min` | - | maxB | `number` | blue min
| maxB | `number` | blue max | `max` | - |
| casing | `'lower' | 'upper'` | case | `lower` | - |
| minA | `number` | transparency min | `0` | - |
| maxA | `number` | transparency max | `1` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.rgba();
// 'rgba(197,205,189,0.5376)'
```

### hsl
Generate HSL colors.

#### Parameters
**options** Configuration item _optional_

| properties | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| minH | `number` | hue min | `0` | - |
| maxH | `number` | hue max | `360` | - |
| maxS | `number` | Saturation Min | `0` | - | maxS | `number` | Saturation Min | `0` | - |
| maxS | `number` | Saturation Max | `100` | - |
| maxL | `number` | Brightness min | `0` | - | maxL | `number` | Brightness min | `0` | -
| maxL | `number` | brightness max | `100` | - |
| casing | `'lower' | 'upper'` | case | `lower` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.hsl();
// 'hsl(72,8.5613%,29.6035%)'
```

### hsla
Generate hala colors.

#### Parameters
**options** Configuration item _optional_

| properties | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| minH | `number` | hue min | `0` | - |
| maxH | `number` | hue max | `360` | - |
| maxS | `number` | Saturation Min | `0` | - | maxS | `number` | Saturation Min | `0` | - |
| maxS | `number` | Saturation Max | `100` | - |
| maxL | `number` | Brightness min | `0` | - | maxL | `number` | Brightness min | `0` | -
| maxL | `number` | brightness max | `100` | - |
| casing | `'lower' | 'upper'` | case | `lower` | - |
| minA | `number` | transparency min | `0` | - |
| maxA | `number` | transparency max | `1` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.hsla();
// 'hsla(268,98.9866%,6.9809%,0.5648)'
```

### colorName
Generate a color name.

#### Return value
`string`

Reference [MDN color](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value)

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.colorName();
// 'white'
```

### hexColor
Generate hexadecimal colors.

#### Parameters
**options** Configuration items _optional_

| properties | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| grayscale | `boolean` | grayscale | `false` | - |
| min | `number` | min | `0` | - |
| max | `number` | max | `255` | - |
| minR | `number` | red min | `min` | - |
| maxR | `number` | red max | `max` | - |
| maxG | `number` | green min | `min` | - | maxG | `number` | green min
| maxG | `number` | green max | `max` | - |
| maxB | `number` | blue min | `min` | - |
| maxB | `number` | blue max | `max` | - |
| casing | `'lower' | 'upper'` | case | `lower` | - |
| prefix | `boolean` | whether to show # prefix | `false` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.hexColor();
// '#0216ff'
```

### demicalColor
Generate a hexadecimal color.

#### Parameters
**options** Configuration items _optional_

| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| grayscale | `boolean` | grayscale | `false` | - |
| min | `number` | min | `0` | - |
| max | `number` | max | `255` | - |
| minR | `number` | red min | `min` | - |
| maxR | `number` | red max | `max` | - |
| maxG | `number` | green min | `min` | - | maxG | `number` | green min
| maxG | `number` | green max | `max` | - |
| maxB | `number` | blue min | `min` | - | maxB | `number` | blue min
| maxB | `number` | blue max | `max` | - |
| casing | `'lower' | 'upper'` | case | `lower` | - |

#### Return Value
`number`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.ColorRandom();
r.decimalColor();
// '12272614'
```

## WebRandom
Tool class for randomly generating Web data. Includes top-level domains (tld), domain names (domain), uniform resource locators (url), IPv4 addresses (ipv4), IPv6 addresses (ipv6), and email addresses (email).

### tld
Generates the top-level domain.

#### Return Value
`string`

Reference [TLD](https://en.wikipedia.org/wiki/Top-level_domain)

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.tld();
// 'uz'
```

### domain
Generate the domain name.

#### Parameters
**options** configuration item _optional_
| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| tld | `string` | top-level domain | - | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.domain();
// 'pujan.ee'
```

### url
Generate a uniform resource locator.

#### Parameters
**options** configuration item _optional_
| attributes | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| tld | `string` | top-level domain | - | - |
| protocol | `string` | protocol | `'http'` | - |
| domain | `string` | domain name | - | - |
| domainPrefix | `string` | `''` | - - |
| path | `string` | path | - | - |
| extensions | `string[]` | file extensions | `[]` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.url();
// 'http://alo.tg/vivso'
```

### ipv4
Generate an IPv4 address.

#### Return value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.ipv4();
// '181.212.214.48'
```

### ipv6
Generate an IPv6 address.

#### Return value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.ipv6();
// '0897:2eed:44ea:7b5f:ebb4:a193:bcee:7346'
```

### email
Generate an email address.

#### Parameters
| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| domain | `string` | domain | - | - |
| length | `number` | length | - | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.WebRandom();
r.email();
// 'ki@petci.tj'
```

## LocationRandom
Random location tool class. Includes longitude, latitude and coordinates.

### longtitude
Generates longitude.

#### Parameters
**options** configuration item _optional_
|property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| fixed | `number` | decimal digits | `7` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.LocationRandom();
r.longtitude();
// '-131.274007'
```

### latitude
Generate latitude.

#### Parameters
**options** configuration item _optional_
| property | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| fixed | `number` | decimal digits | `7` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.LocationRandom();
r.latitude();
// '57.7905127'
```

### coordinates
Generate coordinates.

#### Parameters
**options** configuration item _optional_
| properties | type | description | default | required | 
| ----| ---- | ---- | ---- | ---- | ---- |
| fixed | `number` | decimal digits | `7` | - |

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.LocationRandom();
r.coordinates();
// '95.7034666, 80.9377218'
```

## AddressRandom
A tool class to generate random Chinese address data, including country, province, city, district, road, address and postcode.

### country
Generates the country.

#### Return Value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.country();
// 'China'
```

### province
Generate the province.

#### Return value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.province();
// 'Zhejiang Province'
```

### city
Generate the city.

#### Return value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.city();
// 'hangzhou'
```

### district
Generate the district.

#### Return value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.district();
// 'Westlake district'
```

### road
Generate the road.

#### Return value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.road();
// 'people's road'
```

### address
Generate an address.

#### Return value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.address();
// 'No. 378 Huanghe Hutong, Longmen County, Huizhou City, Guangdong Province'
```

### postcode
Generate an address.

#### Return value
`string`

#### Usage
```ts
import { random } from '@antv/data-wizard';

const r = new random.AddressRandom();
r.postcode();
// '330903'
```
</div>
