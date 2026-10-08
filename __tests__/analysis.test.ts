/**
 * End-to-end test: real AVA pipeline → analysis → A2A artifacts → temp file
 */
import * as path from 'path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

import { describe, it, expect } from 'vitest';

import { AVA } from '../src';

import { getLLMConfig, skipLLMTests } from './test-utils';

import type { Artifact } from '../src/types';
import type { AnalysisSnapshot } from '../src/util/event';

const companiesCsv = path.join(__dirname, '../data/companies.csv');
const outputDir = path.join(__dirname, '../.tmp/analysis');

describe.skipIf(skipLLMTests)('Analysis — full pipeline', () => {
  it('exports A2A artifacts and writes them to a temp file', async () => {
    await mkdir(outputDir, { recursive: true });

    const ava = new AVA({ llm: getLLMConfig() });
    const collector = ava.collectEvents();

    try {
      await ava.source({ type: 'csv-file', options: { path: companiesCsv } });

      const query = 'What is the total revenue by region?';
      const result = await ava.analyze(query, { strategy: { type: 'direct', maxRetries: 1 } });

      let viz = null;
      try {
        viz = await ava.visualize(result);
      } catch {
        // not critical for analysis
      }

      // ── Build artifacts ───────────────────────────────────
      const artifacts = ava.exportAnalysis(collector);
      expect(artifacts).toHaveLength(2);

      // ── Write to temp file ─────────────────────────────────
      const outputPath = path.join(outputDir, 'companies-revenue.json');
      await writeFile(outputPath, JSON.stringify(artifacts, null, 2), 'utf8');

      // ── Read back and verify ───────────────────────────────
      const readBack: Artifact[] = JSON.parse(await readFile(outputPath, 'utf8'));
      expect(readBack).toHaveLength(2);

      const analysisArtifact = readBack.find((a) => a.name === 'analysis');
      const reportArtifact = readBack.find((a) => a.name === 'report');
      expect(analysisArtifact).toBeDefined();
      expect(reportArtifact).toBeDefined();
      expect(analysisArtifact!.parts[0].kind).toBe('data');
      expect(reportArtifact!.parts[0].kind).toBe('text');
      expect(reportArtifact!.parts[0]).toHaveProperty('mediaType', 'text/html');

      const analysis: AnalysisSnapshot = (analysisArtifact!.parts[0] as { data: AnalysisSnapshot }).data;
      const html = (reportArtifact!.parts[0] as { text: string }).text;

      // Layer 1: source
      expect(analysis.source).not.toBeNull();
      expect(analysis.source!.type).toBe('csv-file');
      expect(analysis.source!.options).toHaveProperty('path', companiesCsv);

      // Layer 2: definitions
      expect(analysis.definitions.length).toBeGreaterThanOrEqual(1);
      expect(analysis.definitions[0].dsl.toUpperCase()).toContain('SELECT');

      // Layer 3: executions
      const successExecs = analysis.executions.filter((e) => e.status === 'success');
      expect(successExecs.length).toBeGreaterThanOrEqual(1);
      expect(successExecs[0].exploratory).toBe(false);

      // Layer 4: results
      expect(analysis.results.length).toBeGreaterThanOrEqual(1);
      expect(analysis.results[0].rows.length).toBeGreaterThan(0);

      // Layer 5: presentation
      expect(analysis.presentation).not.toBeNull();
      expect(analysis.presentation!.query).toBe(query);
      expect(analysis.presentation!.summary).toBeTruthy();
      if (viz) {
        expect(analysis.presentation!.chartSyntax).toBeTruthy();
      }

      // ── Verify HTML report artifact ─────────────────────────
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain(query);

      // ── Write HTML report to a separate temp file ───────────
      const htmlPath = path.join(outputDir, 'companies-revenue.html');
      await writeFile(htmlPath, html, 'utf8');
    } finally {
      await ava.dispose();
    }
  }, 120000);
});
