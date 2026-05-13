'use client';
import React, { useState, useMemo } from 'react';
import type { AnalysisStep, StepStatus } from '@antv/ava';

interface AnalysisStepsProps {
  steps: AnalysisStep[];
  collapsed: boolean;
}

function getStepTime(step: AnalysisStep, index: number, sorted: AnalysisStep[]): string | null {
  if (step.status !== 'done') return null;
  if (index === 0) return null;
  const prevTimestamp = sorted[index - 1].timestamp;
  const duration = (step.timestamp - prevTimestamp) / 1000;
  if (duration <= 0) return null;
  return `${duration.toFixed(1)}s`;
}

function DoneIcon() {
  return (
    <svg
      className="w-4 h-4 text-green-500 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RunningIcon() {
  return (
    <svg className="w-4 h-4 text-[#78d3f8] flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-300 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="w-4 h-4 text-red-500 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'done':
      return <DoneIcon />;
    case 'running':
      return <RunningIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'pending':
      return <PendingIcon />;
  }
}

export default function AnalysisSteps({ steps, collapsed }: AnalysisStepsProps) {
  const [expandedDetail, setExpandedDetail] = useState<string | null>(null);
  const [forceExpanded, setForceExpanded] = useState(false);

  if (!steps || steps.length === 0) return null;

  const sorted = useMemo(() => {
    return [...steps].sort((a, b) => a.timestamp - b.timestamp);
  }, [steps]);

  const totalDuration = useMemo(() => {
    if (sorted.length <= 1) return null;
    const duration = (sorted[sorted.length - 1].timestamp - sorted[0].timestamp) / 1000;
    if (duration <= 0) return null;
    return duration;
  }, [sorted]);

  const hasError = sorted.some((s) => s.status === 'error');
  const allDone = sorted.every((s) => s.status === 'done');

  // Always show expanded view when there are errors, regardless of collapsed prop
  const isCollapsed = collapsed && !hasError && !forceExpanded && allDone;

  const title = (
    <span className="flex items-center gap-2 text-sm">
      <DoneIcon />
      <span>
        分析完成 · 共 {sorted.length} 步{totalDuration !== null && ` · 耗时 ${totalDuration.toFixed(1)}s`}
      </span>
    </span>
  );

  if (isCollapsed) {
    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <button
          onClick={() => setForceExpanded(true)}
          className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          {title}
          <span className="text-[#78d3f8] font-medium flex items-center gap-1">
            展开
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
      {/* Header with summary and collapse button when expanded */}
      {allDone && (
        <div className="flex items-center justify-between mb-2">
          {title}
          <button
            onClick={() => setForceExpanded(false)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            收起
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((step, index) => {
          const stepTime = getStepTime(step, index, sorted);
          const isExpanded = expandedDetail === step.id;

          return (
            <div key={step.id}>
              <div className={`flex items-center gap-2.5 text-sm ${step.status === 'pending' ? 'opacity-50' : ''}`}>
                <StepIcon status={step.status} />
                <span
                  className={`flex-1 ${
                    step.status === 'done'
                      ? 'text-gray-700'
                      : step.status === 'running'
                      ? 'text-gray-800 font-medium'
                      : step.status === 'error'
                      ? 'text-red-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>

                {stepTime && <span className="text-xs text-gray-400">{stepTime}</span>}

                {/* View/Hide button for done steps with detail */}
                {step.status === 'done' && step.detail && (
                  <button
                    onClick={() => setExpandedDetail(isExpanded ? null : step.id)}
                    className={`text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0 ${
                      isExpanded ? 'text-[#78d3f8]' : 'text-gray-400 hover:text-[#78d3f8]'
                    }`}
                  >
                    {isExpanded ? '收起' : '查看'}
                    <svg
                      className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Error message */}
              {step.status === 'error' && step.error && (
                <div className="mt-1 ml-6.5 text-xs text-red-500">{step.error}</div>
              )}

              {/* Expanded detail code block */}
              {isExpanded && step.detail && (
                <div className="mt-1.5 ml-6.5">
                  <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
                    {step.detail}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
