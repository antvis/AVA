import { useState, useEffect, useMemo } from 'react';
import { AVA } from '@antv/ava';
import type { LLMConfig } from '@antv/ava';
import {
  ConfigModal,
  DataImport,
  DataPreview,
  Visualization,
  loadLLMConfig,
  saveLLMConfig,
} from '../components';
import type { DataRow } from '../components';

interface HomeProps {
  onOpenConfig: () => void;
  isConfigOpen: boolean;
  onCloseConfig: () => void;
}

function Home({ onOpenConfig, isConfigOpen, onCloseConfig }: HomeProps) {
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(loadLLMConfig);
  const [data, setData] = useState<DataRow[]>([]);

  // Create a single global AVA instance that persists across data import and analysis
  const avaInstance = useMemo(() => {
    if (!llmConfig.apiKey) return null;
    
    return new AVA({
      llm: llmConfig,
      sqlThreshold: 1024 * 1024 * 100, // 100MB threshold to avoid SQLite in browser
    });
  }, [llmConfig]);

  const handleSaveConfig = (config: LLMConfig) => {
    setLLMConfig(config);
    saveLLMConfig(config);
    // Reset data when config changes since we'll get a new AVA instance
    setData([]);
  };

  const handleDataLoaded = (newData: DataRow[]) => {
    setData(newData);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avaInstance) {
        avaInstance.dispose();
      }
    };
  }, [avaInstance]);

  return (
    <>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            AI Chart Generator <span>✨</span>
          </h1>
          <p className="text-gray-500">
            Turn messy data into beautiful visualizations in seconds
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <DataImport avaInstance={avaInstance} onDataLoaded={handleDataLoaded} />
          <DataPreview data={data} />
          <Visualization avaInstance={avaInstance} />
        </div>
      </main>

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={onCloseConfig}
        config={llmConfig}
        onSave={handleSaveConfig}
      />
    </>
  );
}

export default Home;
