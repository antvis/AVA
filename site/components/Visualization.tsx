'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AVA } from '@antv/ava';
import type { AnalysisResponse, AnalysisStep, StepEvent, SuggestResult, VisualizeResponse } from '@antv/ava';
import type { DataRow } from './types';
import SuggestionCards from './SuggestionCards';
import { loadAppState, saveAppState } from './utils';
import GPTVisRenderer from './GPTVisRenderer';
import AnalysisSteps from './AnalysisSteps';

interface VisualizationProps {
  avaInstance: AVA | null;
  data: DataRow[];
  isInitialized: boolean;
}

const STEP_LABELS: Record<string, string> = {
  sqlCode: 'Generate SQL query',
  jsCode: 'Generate analysis code',
  execute: 'Execute analysis',
  summarize: 'Generate analysis summary',
  advisor: 'Detect chart type',
  visualize: 'Generate visualization',
};

const Visualization: React.FC<VisualizationProps> = ({ avaInstance, data, isInitialized }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestResult[]>([]);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [vizResult, setVizResult] = useState<VisualizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [steps, setSteps] = useState<AnalysisStep[]>([]);
  const stepsAcc = useRef<AnalysisStep[]>([]);
  const stepIdRef = useRef(0);

  // Listen to step events from AVA instance
  useEffect(() => {
    if (!avaInstance) return;

    const handler = (event: StepEvent) => {
      const existingIdx = stepsAcc.current.findIndex((s) => s.phase === event.phase);
      if (existingIdx !== -1) {
        stepsAcc.current[existingIdx] = {
          ...stepsAcc.current[existingIdx],
          status: event.status,
          detail: event.detail,
          error: event.error,
          timestamp: Date.now(),
        };
      } else {
        stepsAcc.current.push({
          id: String(stepIdRef.current++),
          agent: 'main',
          phase: event.phase,
          label: STEP_LABELS[event.phase] || event.phase,
          status: event.status,
          detail: event.detail,
          error: event.error,
          timestamp: Date.now(),
        });
      }
      setSteps([...stepsAcc.current]);
    };

    avaInstance.on('step', handler);
    return () => { avaInstance.off('step', handler); };
  }, [avaInstance]);

  // Restore query and result from localStorage on mount
  useEffect(() => {
    if (isInitialized) {
      const savedState = loadAppState();
      if (savedState.query) {
        setQuery(savedState.query);
      }
      if (savedState.analysisResult) {
        setResult(savedState.analysisResult);
      }
    }
  }, [isInitialized]);

  const handleGenerate = useCallback(async () => {
    if (!query.trim()) return;

    if (!avaInstance) {
      setError('Please configure your LLM API key first. Click the LLM button in the header to set up.');
      return;
    }

    setIsLoading(true);
    setError(null);
    stepsAcc.current = [];
    stepIdRef.current = 0;
    setSteps([]);
    setVizResult(null);

    try {
      const analysisResult = await avaInstance.analysis(query);
      setResult(analysisResult);
      saveAppState({ query, analysisResult });

      // Generate visualization from analysis result
      try {
        const viz = await avaInstance.visualize(analysisResult);
        setVizResult(viz);
      } catch {
        // visualization failure is non-fatal
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  }, [query, avaInstance]);

  const handleSuggest = useCallback(async () => {
    if (!avaInstance) {
      setError('Please configure your LLM API key first. Click the LLM button in the header to set up.');
      return;
    }

    setIsSuggesting(true);
    setSuggestions([]);
    setError(null);

    try {
      // Get 3 suggestions from AVA instance
      const results = await avaInstance.suggest(3);
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setIsSuggesting(false);
    }
  }, [avaInstance]);

  // Get analysis code (JavaScript or SQL)
  const analysisCode = result?.code || result?.sql;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-6 h-6 bg-[#78d3f8]/20 text-[#78d3f8] text-sm font-semibold rounded-full">
          3
        </span>
        <h2 className="text-lg font-semibold text-gray-800">Visualize with AI</h2>
      </div>

      {/* Query Input */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSuggestions([]); }}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Create a trend line comparing North America and Europe sales growth"
            className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all text-sm"
            disabled={isLoading || isSuggesting}
          />
          <button
            onClick={handleSuggest}
            disabled={isSuggesting || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-white hover:bg-[#78d3f8]/10 disabled:bg-gray-100 disabled:cursor-not-allowed text-[#78d3f8] rounded-lg transition-colors shadow-sm border border-gray-200"
            title="Get AI-suggested query"
          >
            {isSuggesting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            )}
          </button>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading || !query.trim() || isSuggesting}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-[#78d3f8] hover:bg-[#4ec4ef] disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl transition-colors whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate
            </>
          )}
        </button>
      </div>

      {/* Suggestion Cards */}
      <SuggestionCards
        suggestions={suggestions}
        onSelect={(q) => setQuery(q)}
        onDismiss={() => setSuggestions([])}
      />
      {error && (
        <div
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* Analysis Progress Steps */}
      {steps.length > 0 && (
        <AnalysisSteps steps={steps} collapsed={!isLoading} />
      )}

      {/* Analysis Summary - Always show when result.text exists, rendered with react-markdown */}
      {result && result.text && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl relative">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Analysis Summary</h4>
            {/* View Code Icon Button */}
            {analysisCode && (
              <button
                onClick={() => setShowCode(!showCode)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showCode ? 'bg-[#78d3f8]/20 text-[#78d3f8]' : 'hover:bg-gray-200 text-gray-500'
                }`}
                title={showCode ? 'Hide code' : 'View code'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Collapsible Code Block - Moved above summary text */}
          {showCode && analysisCode && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-500 mb-2">{result?.sql ? 'SQL Query' : 'Analysis Code'}</h5>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-xs overflow-x-auto">{analysisCode}</pre>
            </div>
          )}

          <div className="text-sm text-gray-600 prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.text}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Visualization Area - Only show when chart syntax exists */}
      {vizResult?.syntax && (
        <div className="relative min-h-[400px] border-2 border-dashed border-[#78d3f8]/20 rounded-xl overflow-hidden bg-gradient-to-b from-gray-50 to-white">
          <GPTVisRenderer syntax={vizResult.syntax} />
        </div>
      )}

      {/* Placeholder - Only show when no result yet */}
      {!result && (
        <div className="min-h-[400px] border-2 border-dashed border-[#78d3f8]/20 rounded-xl overflow-hidden bg-gradient-to-b from-gray-50 to-white">
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400">
            <div className="relative mb-4">
              {/* Background bars */}
              <div className="flex items-end gap-2 opacity-30">
                <div className="w-8 h-16 bg-[#78d3f8] rounded-t-lg" />
                <div className="w-8 h-24 bg-[#78d3f8] rounded-t-lg" />
                <div className="w-8 h-20 bg-[#78d3f8] rounded-t-lg" />
                <div className="w-8 h-28 bg-[#78d3f8] rounded-t-lg" />
                <div className="w-8 h-[88px] bg-[#78d3f8] rounded-t-lg" />
              </div>
              {/* Sparkle icon */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">✨</div>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Chart Preview</h3>
            <p className="text-sm text-center max-w-xs">
              Your generated interactive chart will appear here after clicking 'Generate'
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs text-[#78d3f8]">
              <span>🎨 Customize</span>
              <span>📤 Share</span>
              <span>{'</>'} Embed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualization;
