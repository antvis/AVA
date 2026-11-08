import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { DataModel } from '../contracts';
import type { LLMConfig } from '../config';
import type { QueryDialect, TranslationResult } from './types';

// Import only the T-SQL grammar; the package entry point loads every SQL grammar.
// Shared with SQL Server view extraction, which also needs token tools for DDL normalization.
// https://github.com/modeldba/antlr4ts-sql
export async function loadTSQLParser() {
  const [
    { ANTLRInputStream, CommonToken, CommonTokenStream, ListTokenSource, Token },
    { Trees },
    { TSqlLexer },
    { TSqlParser },
    { CaseChangingStream },
  ] = await Promise.all([
    import('antlr4ts'),
    import('antlr4ts/tree/Trees.js'),
    import('antlr4ts-sql/dist/src/grammar-output/tsql/TSqlLexer.js'),
    import('antlr4ts-sql/dist/src/grammar-output/tsql/TSqlParser.js'),
    import('antlr4ts-sql/dist/src/models/CaseChangingStream.js'),
  ]);

  const createTSQLParser = (sql: string, invalid: () => never) => {
    const chars = new CaseChangingStream(new ANTLRInputStream(sql), true);
    const lexer = new TSqlLexer(chars);
    lexer.removeErrorListeners();
    lexer.addErrorListener({ syntaxError: invalid });
    const parser = new TSqlParser(new CommonTokenStream(lexer));
    parser.removeErrorListeners();
    parser.addErrorListener({ syntaxError: invalid });
    return parser;
  };
  return {
    createTSQLParser,
    CommonToken,
    CommonTokenStream,
    ListTokenSource,
    Token,
    Trees,
    TSqlParser,
  };
}

export class TSQLDialect implements QueryDialect {
  readonly id = 'tsql';

  // SELECT syntax, row limits and set operations follow Microsoft's T-SQL reference.
  // https://learn.microsoft.com/en-us/sql/t-sql/queries/select-transact-sql
  // https://learn.microsoft.com/en-us/sql/t-sql/queries/top-transact-sql
  readonly rules = `Use Microsoft SQL Server T-SQL and schema-qualified table names, for example [dbo].[orders].
  Use read-only SELECT queries (WITH is allowed), without SELECT INTO or GO batches.
  Use TOP (n), or ORDER BY ... OFFSET ... ROWS FETCH NEXT ... ROWS ONLY, instead of LIMIT.
  Use SQL Server functions such as CONVERT, DATEPART, DATEADD and ISNULL for dates and missing values.
  Use UNION to remove duplicates and UNION ALL to preserve them, aligning column order and compatible types.
  Return tabular rows directly, using registered tables and read-only CTEs rather than remote pass-through queries.
  Reference exact table and column names from the data model, joining tables when needed. Quote identifier components separately with brackets or double quotes when needed; use single quotes for strings and N-prefixed literals for Unicode text.`;

  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    const prompt = `You are a SQL Server expert. Generate a query answering the user's question using the supplied data model.

    Dataset Context:
    ${stringifyDataModel(dataModel)}

    User Query: ${query}

    ${this.rules}
    Generate exactly one query. Return only SQL text, without explanation or Markdown.`;

    const { text, usage, finishReason } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });

    if (finishReason !== 'stop' && finishReason !== 'other') {
      throw new Error(`T-SQL generation did not complete (${finishReason})`);
    }
    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:sql|tsql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    if (!dsl) throw new Error('T-SQL generation returned an empty query');
    return { dsl, usage };
  }

  async validateDSL(sql: string): Promise<string> {
    const { createTSQLParser, TSqlParser, Token, Trees } = await loadTSQLParser();
    const invalid = () => {
      throw new Error('T-SQL query must contain exactly one read-only SELECT statement');
    };
    const parser = createTSQLParser(sql, invalid);
    const statement = parser.select_statement_standalone();
    // The SELECT entry rule plus EOF excludes writes and batches; tree traversal includes CTEs and subqueries.
    // INTO creates a table, and remote pass-through queries can execute commands outside this connection.
    // https://learn.microsoft.com/en-us/sql/t-sql/queries/select-into-clause-transact-sql
    // https://learn.microsoft.com/en-us/sql/t-sql/functions/openquery-transact-sql
    if (
      parser.currentToken.type !== Token.EOF ||
      [TSqlParser.INTO, TSqlParser.OPENQUERY, TSqlParser.OPENROWSET].some(
        (type) => Trees.findAllTokenNodes(statement, type).length > 0
      )
    ) {
      invalid();
    }
    // ANTLRInputStream offsets match JS string indices, including Unicode. Keep source semantics and comments.
    const terminator = statement.select_statement().SEMI();
    return sql.slice(0, terminator?.symbol.startIndex ?? sql.length).trim();
  }
}
