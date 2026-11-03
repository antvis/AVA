import { ANTLRInputStream, CommonToken, CommonTokenStream, ListTokenSource, Token } from 'antlr4ts';
import { Trees } from 'antlr4ts/tree/Trees';
import { TSqlLexer } from 'antlr4ts-sql/dist/src/grammar-output/tsql/TSqlLexer';
import { TSqlParser } from 'antlr4ts-sql/dist/src/grammar-output/tsql/TSqlParser';
import { CaseChangingStream } from 'antlr4ts-sql/dist/src/models/CaseChangingStream';

export { CommonToken, CommonTokenStream, ListTokenSource, Token, Trees, TSqlParser };

export function createTSQLParser(sql: string, invalid: () => never): TSqlParser {
  const chars = new CaseChangingStream(new ANTLRInputStream(sql), true);
  const lexer = new TSqlLexer(chars);
  lexer.removeErrorListeners();
  lexer.addErrorListener({ syntaxError: invalid });
  const parser = new TSqlParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  parser.addErrorListener({ syntaxError: invalid });
  return parser;
}
