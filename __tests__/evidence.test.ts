/**
 * End-to-end test: real AVA pipeline → evidence chain → A2A artifacts → temp file
 */
import * as path from 'path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

import { describe, it, expect } from 'vitest';

import { AVA } from '../src';

import { getLLMConfig, skipLLMTests } from './test-utils';

import type { Artifact } from '../src/types';
import type { EvidenceChainData } from '../src/util/event';

const companiesCsv = path.join(__dirname, '../data/companies.csv');
const outputDir = path.join(__dirname, '../.tmp/evidence');

describe.skipIf(skipLLMTests)('Evidence chain — full pipeline', () => {
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
        // not critical for evidence
      }

      // ── Build artifacts ───────────────────────────────────
      const artifacts = ava.exportEvidence(collector);
      expect(artifacts).toHaveLength(2);

      // ── Write to temp file ─────────────────────────────────
      const outputPath = path.join(outputDir, 'companies-revenue.json');
      await writeFile(outputPath, JSON.stringify(artifacts, null, 2), 'utf8');

      // ── Read back and verify ───────────────────────────────
      const readBack: Artifact[] = JSON.parse(await readFile(outputPath, 'utf8'));
      expect(readBack).toHaveLength(2);

      const chainArtifact = readBack.find((a) => a.name === 'evidence-chain');
      const trailArtifact = readBack.find((a) => a.name === 'event-trail');
      expect(chainArtifact).toBeDefined();
      expect(trailArtifact).toBeDefined();
      expect(chainArtifact!.parts[0].kind).toBe('data');
      expect(trailArtifact!.parts[0].kind).toBe('data');

      const evidence: EvidenceChainData = (chainArtifact!.parts[0] as { data: EvidenceChainData }).data;
      const trail = (trailArtifact!.parts[0] as { data: unknown[] }).data;

      // Layer 1: source
      expect(evidence.source).not.toBeNull();
      expect(evidence.source!.type).toBe('csv-file');
      expect(evidence.source!.options).toHaveProperty('path', companiesCsv);

      // Layer 2: definitions
      expect(evidence.definitions.length).toBeGreaterThanOrEqual(1);
      expect(evidence.definitions[0].dsl.toUpperCase()).toContain('SELECT');

      // Layer 3: executions
      const successExecs = evidence.executions.filter((e) => e.status === 'success');
      expect(successExecs.length).toBeGreaterThanOrEqual(1);
      expect(successExecs[0].exploratory).toBe(false);

      // Layer 4: results
      expect(evidence.results.length).toBeGreaterThanOrEqual(1);
      expect(evidence.results[0].rows.length).toBeGreaterThan(0);

      // Layer 5: presentation
      expect(evidence.presentation).not.toBeNull();
      expect(evidence.presentation!.query).toBe(query);
      expect(evidence.presentation!.text).toBeTruthy();
      if (viz) {
        expect(evidence.presentation!.chartType).toBeTruthy();
      }

      // ── Verify trail artifact ────────────────────────────
      expect(trail).toBeInstanceOf(Array);
      expect(trail.length).toBeGreaterThanOrEqual(4);

      const phases = new Set(trail.map((r: { phase: string }) => r.phase));
      expect(phases.has('execution')).toBe(true);
    } finally {
      await ava.dispose();
    }
  }, 120000);
});
