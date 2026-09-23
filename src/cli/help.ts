import { accent, badge, muted } from './util';

export const ROOT_HELP = `${accent('✦')} ${badge('AVA')}
   ${muted('AI-native visual analytics for answers, SQL, and visualizations.')}

${accent('Usage:')}
  ava <command> [options]

${accent('Commands:')}
  analyze <source> <question>  Analyze data with natural language

${accent('Options:')}
  -h, --help                   Show help

Run "ava <command> --help" for command-specific options.`;

export const ANALYZE_HELP = `Analyze data with natural language.

${accent('Usage:')}
  ava analyze <source> <question> [options]

${accent('Arguments:')}
  <source>                     Data file path or HTTP(S) URL
  <question>                   Analysis question in natural language

${accent('Options:')}
  -t, --type <type>            Source type: csv-file, json-file, parquet, excel, or sqlite
  -c, --chart                  Generate a visualization
  -o, --output <path>          Write chart HTML to a new file (requires --chart)
  -h, --help                   Show help

${accent('Environment:')}
  OPENAI_API_KEY               API key (required)
  OPENAI_MODEL                 Model name (default: gpt-4o-mini)
  OPENAI_BASE_URL              OpenAI-compatible endpoint (default: https://api.openai.com/v1)

${accent('Examples:')}
  ava analyze sales.csv "Summarize revenue by region"
  ava analyze https://example.com/sales.parquet "Show revenue trends" --chart --output revenue.html`;
