'use client'
import React, { useState, useEffect } from 'react';
import type { LLMConfig } from '@antv/ava';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSave: (config: LLMConfig) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">LLM Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <input
              type="text"
              value={localConfig.model}
              onChange={e => setLocalConfig({ ...localConfig, model: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all"
              placeholder="e.g., ling-1t, gpt-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              value={localConfig.apiKey}
              onChange={e => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all"
              placeholder="Your API key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
            <input
              type="text"
              value={localConfig.baseURL || ''}
              onChange={e => setLocalConfig({ ...localConfig, baseURL: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all"
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
            className="flex-1 px-4 py-2.5 bg-[#78d3f8] hover:bg-[#4ec4ef] text-white rounded-xl transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
