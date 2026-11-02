import type { LLMConfig } from '@antv/ava/browser';

// Default LLM config
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  model: 'deepseek-flash',
  apiKey: '',
  baseURL: 'https://api.deepseek.com',
};

// Load LLM config from localStorage
export const loadLLMConfig = (): LLMConfig => {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return DEFAULT_LLM_CONFIG;
  }

  try {
    const saved = localStorage.getItem('ava-llm-config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load LLM config:', e);
  }
  return DEFAULT_LLM_CONFIG;
};

// Save LLM config to localStorage
export const saveLLMConfig = (config: LLMConfig) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ava-llm-config', JSON.stringify(config));
  }
};
