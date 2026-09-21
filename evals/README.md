# Evaluations

## DataBench

DataBench evaluates tabular question answering. AVA generates SQL, executes it against Parquet data, converts the result to the expected answer type, and scores it.

| Dataset | Data | Default |
| --- | --- | --- |
| `databench-lite` | Sample tables | Yes |
| `databench` | Full tables | No |

### Workflow

Datasets and results stay local and are ignored by Git. Existing successful rows are reused when the same output file is run again.

1. From the `evals` directory, download both dataset variants with `node cli.js databench:fetch` (no parameters).
2. Configure the model in `evals/.env`:

   ```env
   OPENAI_API_KEY=your-api-key
   OPENAI_MODEL=your-model
   OPENAI_BASE_URL=https://your-provider.example.com/v1
   ```

   `OPENAI_BASE_URL` is optional and defaults to OpenAI.

3. Run `node cli.js databench`. Available options:

   - `--dataset <databench-lite|databench>` selects the dataset (default: `databench-lite`).
   - `--limit <number|all>` limits questions (default: `20`).
   - `--offset <number>` skips questions after filtering (default: `0`).
   - `--suite <name>` runs one suite, such as `002_Titanic`.
   - `--concurrency <number>` controls parallel model calls (default: `3`).
   - `--output <path>` sets the result CSV path (default: `databench/results/<dataset>.csv`).

4. AVA generates and executes SQL, scores the answer, and saves the result CSV.

### Prediction files

A prediction file is a CSV that maps each dataset question ID to AVA's answer. `node cli.js databench` creates one automatically at `databench/results/<dataset>.csv` unless `--output` sets another path.

Only `id` and `predicted_answer` are required:

```csv
id,predicted_answer
databench-lite:001_Forbes:01,false
databench-lite:001_Forbes:02,191
```

Generated files also include SQL, errors, model, duration, and token usage for debugging; the scorer ignores those columns. To score an existing file without calling the model again:

```bash
node cli.js --predictions <file.csv>
```
