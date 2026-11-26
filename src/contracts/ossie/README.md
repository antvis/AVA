# Apache Ossie core schema

`ossie-schema.json` is the unmodified [Apache Ossie core schema](https://github.com/apache/ossie/blob/aedf08651451306896d98e17657c16c99848ef78/core-spec/ossie-schema.json) at commit `aedf08651451306896d98e17657c16c99848ef78` (specification `0.3.0.dev0`). SHA-256 is `b833534b1da935e373cb75517f8b983dff9d57b399283bac5f78870c928ca1bb`. See the accompanying Apache LICENSE and NOTICE.

Regenerate the TypeScript definitions after replacing the schema. Run from the AVA repository root.

```sh
npx --package=json-schema-to-typescript@15.0.4 json2ts \
  -i src/contracts/ossie/ossie-schema.json -o src/contracts/ossie/types.generated.ts
pnpm exec prettier --write src/contracts/ossie/types.generated.ts
```

Use the [reference validator](https://github.com/apache/ossie/blob/aedf08651451306896d98e17657c16c99848ef78/validation/validate.py) from the same checkout for its expression, conformance, and portability checks.
