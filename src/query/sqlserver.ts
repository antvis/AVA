import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { DataModel, LLMConfig, QueryDialect, TranslationResult } from '../types';

export const SQLSERVER_LANGUAGE_INSTRUCTIONS = `Use Microsoft SQL Server T-SQL and schema-qualified table names, for example [dbo].[orders].
Generate exactly one read-only SELECT query (WITH is allowed), without SELECT INTO or GO batches.
Use TOP (n), or ORDER BY ... OFFSET ... ROWS FETCH NEXT ... ROWS ONLY, instead of LIMIT.
Use SQL Server functions such as CONVERT, DATEPART, DATEADD and ISNULL for dates and missing values.`;

export class SQLServerQueryDialect implements QueryDialect {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    const { text, usage } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt: `You are a SQL Server expert. Generate a query answering the user's question using the supplied data model.

Dataset Context:
${stringifyDataModel(dataModel)}

User Query: ${query}

${SQLSERVER_LANGUAGE_INSTRUCTIONS}
Reference exact names from the data model, joining tables when needed. Return only the SQL, without explanation or Markdown.`,
    });
    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:sql|tsql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    return { dsl, usage };
  }

  async validateDSL(sql: string): Promise<string> {
    const { createTSQLParser, TSqlParser, Token, Trees } = await import('./tsql-parser');
    const invalid = () => {
      throw new Error('SQL Server query must contain exactly one read-only SELECT statement');
    };
    const parser = createTSQLParser(sql, invalid);
    const statement = parser.select_statement_standalone();
    if (
      parser.currentToken.type !== Token.EOF ||
      [TSqlParser.INTO, TSqlParser.OPENQUERY, TSqlParser.OPENROWSET].some(
        (type) => Trees.findAllTokenNodes(statement, type).length > 0
      )
    ) {
      invalid();
    }
    return sql;
  }
}
