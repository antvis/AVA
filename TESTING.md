# Unit Tests

This project uses [Vitest](https://vitest.dev/) as the testing framework.

## Test Organization

Tests are organized following the recommended structure:
- Each module has a `__tests__` directory containing its unit tests
- Test files are named `*.test.ts`
- Integration tests are in `src/__tests__/`

## Test Structure

```
src/
├── __tests__/
│   └── ava.test.ts                    # Integration tests for AVA class
├── data/
│   └── __tests__/
│       └── index.test.ts              # Unit tests for data module
└── analysis/
    └── __tests__/
        └── index.test.ts              # Unit tests for analysis module
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Environment Variables

Some tests require the `LING_1T_API_KEY` environment variable to test real LLM interactions:

```bash
export LING_1T_API_KEY=your_api_key_here
npm test
```

Tests that require the API key will be skipped if it's not provided.

## Test Coverage

The tests cover:

### Data Module (`src/data/__tests__/index.test.ts`)
- CSV file loading and parsing
- Metadata extraction (row count, column count, field types)
- Type inference (number, string, date, boolean)
- Dataset size calculation
- Dataset info formatting

### Analysis Module (`src/analysis/__tests__/index.test.ts`)
- SQLiteDataStore operations (load, query, schema)
- JavaScript code execution with data operations
  - groupBy, sum, avg, max, min, count, sortBy
- SQL query generation with LLM
- JavaScript code generation with LLM

### Integration Tests (`src/__tests__/ava.test.ts`)
- AVA initialization and data loading
- Analysis with small datasets (JavaScript)
- Analysis with large datasets (SQLite)
- Natural language queries with LLM
- Resource cleanup

## Test Philosophy

- **Concise**: Tests are clean and focused on specific functionality
- **Real Testing**: LLM tests use actual model outputs with assertions
- **Skip Pattern**: Tests requiring API keys are skipped gracefully when not available
- **Comprehensive**: Cover unit tests and integration tests
