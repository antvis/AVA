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
              placeholder="e.g., ling-1t, gpt-4"
            />
          </div>

          <div>
            <label htmlFor="llm-api-key" className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
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
              placeholder="https://api.example.com/v1"
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
