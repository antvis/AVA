'use client'
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AVA } from '@antv/ava';
import type { AnalysisResponse } from '@antv/ava';
import type { DataRow } from './types';
import { loadAppState, saveAppState } from './utils';

interface VisualizationProps {
  avaInstance: AVA | null;
  data: DataRow[];
  isInitialized: boolean;
}

// Helper function to download HTML
const downloadHTML = (html: string) => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `chart_${new Date().getTime()}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper function to copy HTML to clipboard
const copyToClipboard = async (html: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(html);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

const Visualization: React.FC<VisualizationProps> = ({ avaInstance, data, isInitialized }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [isHoveringChart, setIsHoveringChart] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

    try {
      // Use the global AVA instance's analysis method to process the query
      const analysisResult = await avaInstance.analysis(query);
      setResult(analysisResult);
      
      // Save to localStorage
      saveAppState({ query, analysisResult });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  }, [query, avaInstance]);

  // Update iframe content when visualization changes
  useEffect(() => {
    if (result?.visualizationHTML && iframeRef.current) {
      const htmlContent = result.visualizationHTML; // Capture to maintain type narrowing
      const iframe = iframeRef.current;
      
      // Handler to write content after iframe resets
      const handleLoad = () => {
        const doc = iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(htmlContent);
          doc.close();
        }
        iframe.removeEventListener('load', handleLoad);
      };
      
      // Listen for load event before resetting
      iframe.addEventListener('load', handleLoad);
      
      // Reset iframe by setting src to about:blank to clear previous context
      iframe.src = 'about:blank';
      
      // Cleanup function
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [result?.visualizationHTML]);

  // Get analysis code (JavaScript or SQL)
  const analysisCode = result?.code || result?.sql;

  // Handle copy action
  const handleCopy = async () => {
    if (result?.visualizationHTML) {
      const success = await copyToClipboard(result.visualizationHTML);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  // Handle download action
  const handleDownload = () => {
    if (result?.visualizationHTML) {
      downloadHTML(result.visualizationHTML);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-6 h-6 bg-[#78d3f8]/20 text-[#78d3f8] text-sm font-semibold rounded-full">3</span>
        <h2 className="text-lg font-semibold text-gray-800">Visualize with AI</h2>
      </div>

      {/* Query Input */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          placeholder="Create a trend line comparing North America and Europe sales growth"
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all text-sm"
          disabled={isLoading}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !query.trim()}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-[#78d3f8] hover:bg-[#4ec4ef] disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl transition-colors whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert" aria-live="assertive">
          {error}
        </div>
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
                className={`p-1.5 rounded-lg transition-colors ${showCode ? 'bg-[#78d3f8]/20 text-[#78d3f8]' : 'hover:bg-gray-200 text-gray-500'}`}
                title={showCode ? 'Hide code' : 'View code'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Collapsible Code Block - Moved above summary text */}
          {showCode && analysisCode && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-500 mb-2">
                {result?.sql ? 'SQL Query' : 'Analysis Code'}
              </h5>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-xs overflow-x-auto">
                {analysisCode}
              </pre>
            </div>
          )}
          
          <div className="text-sm text-gray-600 prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.text}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Visualization Area - Only show when visualizationHTML exists */}
      {result?.visualizationHTML && (
        <div 
          className="relative min-h-[400px] border-2 border-dashed border-[#78d3f8]/20 rounded-xl overflow-hidden bg-gradient-to-b from-gray-50 to-white"
          onMouseEnter={() => setIsHoveringChart(true)}
          onMouseLeave={() => setIsHoveringChart(false)}
        >
          {/* Action buttons overlay */}
          {isHoveringChart && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1 border border-gray-200">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors text-sm text-gray-700"
                title="Copy HTML"
              >
                {copySuccess ? (
                  <>
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors text-sm text-gray-700"
                title="Download HTML"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </button>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            className="w-full h-[400px] border-0"
            title="Visualization"
            sandbox="allow-scripts allow-same-origin"
          />
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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">
                ✨
              </div>
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
