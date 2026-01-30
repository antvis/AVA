/**
 * Unit tests for data module
 */

import * as path from 'path';

import { describe, it, expect, beforeAll } from 'vitest';

import { loadCSV, loadObject, loadURL, loadText, extractMetadata, formatDatasetInfo } from '../src/data';

interface CompanyData {
  company: string;
  region: string;
  revenue: number;
}

describe('Data Module', () => {
  const testDataPath = path.join(__dirname, '../data/companies.csv');
  let testData: CompanyData[];

  beforeAll(async () => {
    testData = await loadCSV(testDataPath);
  });

  describe('loadCSV', () => {
    it('should load CSV file successfully', async () => {
      const data = await loadCSV(testDataPath);
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should parse CSV with correct columns', async () => {
      const data = await loadCSV(testDataPath);
      const firstRow = data[0];
      expect(firstRow).toHaveProperty('company');
      expect(firstRow).toHaveProperty('region');
      expect(firstRow).toHaveProperty('revenue');
    });

    it('should parse numeric values correctly', async () => {
      const data = await loadCSV(testDataPath);
      expect(typeof data[0].revenue).toBe('number');
    });
  });

  describe('extractMetadata', () => {
    it('should extract basic metadata', () => {
      const metadata = extractMetadata(testData);
      expect(metadata.rowCount).toBe(testData.length);
      expect(metadata.columnCount).toBe(3);
      expect(metadata.fields.length).toBe(3);
    });

    it('should infer field types correctly', () => {
      const metadata = extractMetadata(testData);
      const companyField = metadata.fields.find(f => f.name === 'company');
      const revenueField = metadata.fields.find(f => f.name === 'revenue');
      
      expect(companyField?.type).toBe('string');
      expect(revenueField?.type).toBe('number');
    });

    it('should calculate unique counts', () => {
      const metadata = extractMetadata(testData);
      const regionField = metadata.fields.find(f => f.name === 'region');
      
      expect(regionField?.uniqueCount).toBeGreaterThan(0);
      expect(regionField?.uniqueCount).toBeLessThanOrEqual(testData.length);
    });

    it('should provide sample values', () => {
      const metadata = extractMetadata(testData);
      metadata.fields.forEach(field => {
        expect(field.samples).toBeDefined();
        expect(Array.isArray(field.samples)).toBe(true);
      });
    });

    it('should calculate size in bytes', () => {
      const metadata = extractMetadata(testData);
      expect(metadata.sizeInBytes).toBeGreaterThan(0);
    });

    it('should handle empty data', () => {
      const metadata = extractMetadata([]);
      expect(metadata.rowCount).toBe(0);
      expect(metadata.columnCount).toBe(0);
      expect(metadata.fields.length).toBe(0);
      expect(metadata.sizeInBytes).toBe(0);
    });
  });

  describe('formatDatasetInfo', () => {
    it('should format metadata as readable string', () => {
      const metadata = extractMetadata(testData);
      const formatted = formatDatasetInfo(metadata);
      
      expect(formatted).toContain('Dataset Info:');
      expect(formatted).toContain('Rows:');
      expect(formatted).toContain('Columns:');
      expect(formatted).toContain('Size:');
      expect(formatted).toContain('Fields:');
    });

    it('should include field names and types', () => {
      const metadata = extractMetadata(testData);
      const formatted = formatDatasetInfo(metadata);
      
      expect(formatted).toContain('company');
      expect(formatted).toContain('region');
      expect(formatted).toContain('revenue');
      expect(formatted).toContain('string');
      expect(formatted).toContain('number');
    });

    it('should include sample values', () => {
      const metadata = extractMetadata(testData);
      const formatted = formatDatasetInfo(metadata);
      
      expect(formatted).toContain('Sample values:');
    });
  });

  describe('loadObject', () => {
    it('should load data from object array', async () => {
      const data = [
        { name: 'Alice', age: 30, city: 'Beijing' },
        { name: 'Bob', age: 25, city: 'Shanghai' },
        { name: 'Charlie', age: 35, city: 'Hangzhou' },
      ];
      
      const result = await loadObject(data);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('age');
      expect(result[0]).toHaveProperty('city');
    });

    it('should throw error for non-array input', async () => {
      await expect(loadObject({} as any)).rejects.toThrow('Data must be an array');
    });

    it('should throw error for array with non-object items', async () => {
      await expect(loadObject([1, 2, 3] as any)).rejects.toThrow('All items in the array must be plain objects');
    });

    it('should handle empty array', async () => {
      const result = await loadObject([]);
      expect(result).toEqual([]);
    });

    it('should work with metadata extraction', async () => {
      const data = [
        { name: 'Alice', age: 30, city: 'Beijing' },
        { name: 'Bob', age: 25, city: 'Shanghai' },
      ];
      
      const result = await loadObject(data);
      const metadata = extractMetadata(result);
      
      expect(metadata.rowCount).toBe(2);
      expect(metadata.columnCount).toBe(3);
      expect(metadata.fields.length).toBe(3);
      
      const nameField = metadata.fields.find(f => f.name === 'name');
      const ageField = metadata.fields.find(f => f.name === 'age');
      
      expect(nameField?.type).toBe('string');
      expect(ageField?.type).toBe('number');
    });
  });

  describe('loadURL', () => {
    it('should throw error for invalid URL', async () => {
      await expect(loadURL('invalid-url')).rejects.toThrow();
    });

    it('should handle transform function', async () => {
      // Skip network tests in CI - this is just to show the interface
      // In real scenarios, you would mock fetch or use a local test server
    });
  });

  describe('loadText', () => {
    it('should require LLM config', async () => {
      // Skip LLM tests as they require API keys
      // In real scenarios, you would mock the LLM response
    });
  });
});
