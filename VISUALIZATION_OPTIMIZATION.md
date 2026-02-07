# Visualization Optimization: Unified LLM Call

## Overview

This document describes the optimization made to the visualization functionality in AVA, which merges the `advise` and `generate` logic into a single unified LLM call.

## Background

Previously, the visualization generation process required **two separate LLM API calls**:

1. **adviseChartType()** - Detected visualization intent and recommended an appropriate chart type
2. **generateVisualizationHTML()** - Generated GPT-Vis syntax and HTML code for the recommended chart

This approach had several drawbacks:
- **Higher latency**: Two sequential network requests added significant delay
- **Increased costs**: Two separate API calls meant double the API usage
- **More failure points**: Either call could fail independently

## Solution

The new unified approach combines both operations into a **single LLM call** through the `adviseVisualization()` function.

### Key Features

1. **Single API Request**: Both chart type recommendation and HTML generation happen in one call
2. **Unified Prompt**: A comprehensive prompt that instructs the LLM to:
   - Detect visualization intent
   - Recommend appropriate chart type based on data characteristics
   - Generate complete HTML with GPT-Vis syntax (if visualization is needed)
3. **Structured JSON Response**: The LLM returns a JSON object containing:
   ```json
   {
     "chartType": "column" | null,
     "html": "<!DOCTYPE html>..." | undefined
   }
   ```

### Performance Benefits

- **~50% Reduction in Latency**: Single network round-trip instead of two
- **Lower API Costs**: One API call instead of two
- **Simplified Error Handling**: Single point of failure to handle
- **Same Accuracy**: Maintains the same functionality and output quality

## Implementation Details

### New Function: `adviseVisualization()`

Located in: `src/visualization/advisor.ts`

```typescript
export async function adviseVisualization(
  query: string,
  data: any[],
  llmConfig: LLMConfig
): Promise<VisualizationResult>
```

**Input:**
- `query`: User's natural language query
- `data`: The dataset to visualize
- `llmConfig`: LLM API configuration

**Output:**
```typescript
{
  chartType: ChartType | null;  // null if no visualization intent
  syntax?: string;               // GPT-Vis syntax
  html?: string;                 // Complete HTML code
}
```

### Integration

The unified function is integrated into the main `AVA` class in `src/ava.ts`:

```typescript
// Old approach (2 LLM calls):
const chartType = await adviseChartType(query, data, llmConfig);
if (chartType) {
  const result = await generateVisualizationHTML(chartType, data, query, llmConfig);
}

// New approach (1 LLM call):
const result = await adviseVisualization(query, data, llmConfig);
if (result.chartType) {
  // Use result.syntax and result.html
}
```

## Backward Compatibility

The original functions (`adviseChartType` and `generateVisualizationHTML`) are **still available** for backward compatibility. They remain exported from the visualization module and can be used if needed.

The main `AVA` class automatically uses the new unified approach, providing immediate performance benefits to all users without requiring any code changes.

## Testing

Comprehensive tests have been added in `__tests__/visualization.test.ts` to verify:

1. ✅ Visualization intent detection and HTML generation in a single call
2. ✅ Proper handling of non-visualization queries (returns null chartType)
3. ✅ Correct chart type recommendations for different query intents
4. ✅ Time-series data handling for line/area charts
5. ✅ All existing integration tests continue to pass

## Example Usage

See `examples/unified-visualization-example.ts` for a complete example demonstrating the performance improvement.

```typescript
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: { model: 'ling-1t', apiKey: 'YOUR_KEY', baseURL: 'BASE_URL' }
});

await ava.loadObject(data);

// Single LLM call handles everything
const response = await ava.analysis('绘制各城市GDP的柱状图');

if (response.visualizationHTML) {
  // Ready to display
  console.log('Visualization generated!');
}
```

## Migration Guide

**No migration needed!** The change is transparent to users:

- Existing code continues to work without modifications
- Performance improvements are automatic
- API remains unchanged

If you were directly using `adviseChartType` or `generateVisualizationHTML`, you can optionally switch to the unified function for better performance:

```typescript
// Before (2 calls):
import { adviseChartType, generateVisualizationHTML } from '@antv/ava';
const chartType = await adviseChartType(query, data, llmConfig);
if (chartType) {
  const result = await generateVisualizationHTML(chartType, data, query, llmConfig);
}

// After (1 call):
import { adviseVisualization } from '@antv/ava';
const result = await adviseVisualization(query, data, llmConfig);
if (result.chartType) {
  // Use result.syntax and result.html
}
```

## Technical Details

### Prompt Engineering

The unified prompt combines:
1. Comprehensive chart type descriptions and use cases
2. Data characteristics and metadata
3. Examples of GPT-Vis syntax for all supported chart types
4. Clear instructions for JSON output format
5. Guidelines for detecting visualization intent

### Error Handling

- Graceful degradation: If LLM returns invalid JSON, function returns `{ chartType: null }`
- Backward compatible: Falls back to no visualization on parsing errors
- Non-blocking: Visualization failures don't break the main analysis flow

### Supported Chart Types

The unified function supports all chart types available in GPT-Vis:
- line, column, bar, pie, area, scatter
- dual-axes, histogram, boxplot, radar
- funnel, waterfall, liquid, word-cloud
- violin, venn, treemap, sankey, table

## Future Enhancements

Potential improvements for future versions:
- Streaming response support for faster perceived performance
- Caching of chart type recommendations for similar queries
- Multi-chart support in a single call
- Custom chart templates

## Conclusion

The unified visualization approach significantly improves performance while maintaining full functionality and backward compatibility. All users automatically benefit from the ~50% reduction in latency with no code changes required.
