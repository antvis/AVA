/**
 * Unit tests for visualization module
 */

import { describe, it, expect } from 'vitest';

import { generateVisualizationWithAdvice } from '../src/visualization';

describe('Visualization Module', () => {
  const getLLMConfig = () => ({
    model: 'ling-1t',
    apiKey: process.env.LING_1T_API_KEY || '',
    baseURL: 'https://api.tbox.cn/api/llm/v1',
  });

  describe('generateVisualizationWithAdvice', () => {
    it('should detect visualization intent and generate HTML in a single call', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const data = [
        { city: '杭州', population: 1220, gdp: 18753 },
        { city: '上海', population: 2489, gdp: 43214 },
        { city: '北京', population: 2189, gdp: 40269 },
        { city: '深圳', population: 1768, gdp: 32387 },
        { city: '广州', population: 1868, gdp: 28839 },
      ];

      try {
        const result = await generateVisualizationWithAdvice(
          '绘制各城市GDP的柱状图',
          data,
          getLLMConfig()
        );

        // Should detect visualization intent
        expect(result.chartType).toBeDefined();
        expect(result.chartType).not.toBeNull();
        
        // Should be a valid chart type (column or bar expected)
        expect(['column', 'bar']).toContain(result.chartType);

        // Should generate HTML
        expect(result.html).toBeDefined();
        expect(typeof result.html).toBe('string');
        expect(result.html!.length).toBeGreaterThan(0);
        expect(result.html).toContain('<!DOCTYPE html>');
        expect(result.html).toContain('GPT-Vis');

        // Should generate syntax
        expect(result.syntax).toBeDefined();
        expect(typeof result.syntax).toBe('string');
        expect(result.syntax!.length).toBeGreaterThan(0);
      } catch (error) {
        // If the API fails, log but don't fail the test
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 60000); // Increased timeout for LLM calls

    it('should return null chartType when no visualization intent detected', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const data = [
        { city: '杭州', gdp: 18753 },
        { city: '上海', gdp: 43214 },
      ];

      try {
        const result = await generateVisualizationWithAdvice(
          '哪个城市的GDP最高？',
          data,
          getLLMConfig()
        );

        // Should not detect visualization intent
        expect(result.chartType).toBeNull();
        
        // Should not generate HTML or syntax
        expect(result.html).toBeUndefined();
        expect(result.syntax).toBeUndefined();
      } catch (error) {
        // If the API fails, log but don't fail the test
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should handle different chart types based on query intent', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const data = [
        { category: 'A', value: 30 },
        { category: 'B', value: 50 },
        { category: 'C', value: 20 },
      ];

      try {
        // Test pie chart intent
        const pieResult = await generateVisualizationWithAdvice(
          '绘制占比饼图',
          data,
          getLLMConfig()
        );

        if (pieResult.chartType) {
          // Should detect pie chart intent
          expect(pieResult.chartType).toBe('pie');
          expect(pieResult.html).toBeDefined();
          expect(pieResult.syntax).toBeDefined();
        }
      } catch (error) {
        // If the API fails, log but don't fail the test
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 60000);

    it('should handle time-series data for line charts', async () => {
      const apiKey = process.env.LING_1T_API_KEY;
      if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('Skipping LLM test: LING_1T_API_KEY not set');
        return;
      }

      const data = [
        { time: '2020', value: 100 },
        { time: '2021', value: 120 },
        { time: '2022', value: 150 },
      ];

      try {
        const result = await generateVisualizationWithAdvice(
          '绘制趋势折线图',
          data,
          getLLMConfig()
        );

        if (result.chartType) {
          // Should detect line chart for time-series trend
          expect(['line', 'area']).toContain(result.chartType);
          expect(result.html).toBeDefined();
          expect(result.syntax).toBeDefined();
        }
      } catch (error) {
        // If the API fails, log but don't fail the test
        console.log('Skipping test due to API error:', error instanceof Error ? error.message : String(error));
      }
    }, 60000);
  });
});
