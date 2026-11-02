'use client';
import React, { useState, useEffect } from 'react';
import type { LLMConfig } from '@antv/ava/browser';

interface ModelConfigProps {
  isOpen: boolean;
  disabled?: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSave: (config: LLMConfig) => void;
}

function APIKeyHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.currentTarget.querySelector('button')?.focus();
          setOpen(false);
          event.stopPropagation();
        }
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="api-key-help"
        onClick={() => setOpen(true)}
        className="text-xs text-[#38798e] underline decoration-[#38798e]/35 underline-offset-4 hover:text-ink"
      >
        Don’t have an API key?
      </button>
      {open && (
        <div id="api-key-help" className="absolute right-0 top-full z-10 w-[min(320px,calc(100vw-80px))] pt-3">
          <section
            aria-label="API key providers"
            className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-[0_12px_36px_#183a4a24]"
          >
            <p className="mb-3 text-xs font-medium text-gray-800">Choose where to get your key</p>
            <a
              href="https://platform.deepseek.com/api_keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-sm font-medium text-[#38798e] hover:underline"
            >
              Get a DeepSeek key <span aria-hidden="true">↗</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Start with DeepSeek. Keep the default model and Base URL, then paste your key.
            </p>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <a
                href="https://zenmux.ai/platform/pay-as-you-go"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-sm font-medium text-[#38798e] hover:underline"
              >
                Get a ZenMux key <span aria-hidden="true">↗</span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                For more model providers, use <span className="font-mono text-[11px]">https://zenmux.ai/api/v1</span>{' '}
                and copy the model ID from ZenMux’s model page.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const ModelConfig: React.FC<ModelConfigProps> = ({ isOpen, onClose, config, onSave, disabled = false }) => {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const canSave = !!localConfig.apiKey?.trim() && (typeof localConfig.model !== 'string' || !!localConfig.model.trim());

  const handleSave = () => {
    if (disabled || !canSave) return;
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="llm-config-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="llm-config-title" className="text-xl font-semibold text-gray-800">
            LLM Configuration
          </h2>
          <button
            onClick={onClose}
            aria-label="Close model configuration"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="llm-model" className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <input
              id="llm-model"
              type="text"
              required
              value={typeof localConfig.model === 'string' ? localConfig.model : localConfig.model.modelId}
              onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/50 focus:border-[color:var(--color-primary)] transition-all"
              placeholder="deepseek-flash"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="llm-api-key" className="text-sm font-medium text-gray-700">
                API Key
              </label>
              <APIKeyHelp />
            </div>
            <input
              id="llm-api-key"
              type="password"
              required
              value={localConfig.apiKey}
              onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/50 focus:border-[color:var(--color-primary)] transition-all"
              placeholder="Your API key"
            />
          </div>

          <div>
            <label htmlFor="llm-base-url" className="block text-sm font-medium text-gray-700 mb-2">
              Base URL
            </label>
            <input
              id="llm-base-url"
              type="text"
              value={localConfig.baseURL || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, baseURL: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/50 focus:border-[color:var(--color-primary)] transition-all"
              placeholder="https://api.deepseek.com"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={disabled || !canSave}
            title={
              disabled ? 'Wait for the current operation to finish' : !canSave ? 'Enter a model and API key' : undefined
            }
            className="flex-1 px-4 py-2.5 bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-dark)] text-ink font-medium rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelConfig;
