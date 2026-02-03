import React, { useState, useRef } from 'react';
import { AVA } from '@antv/ava';
import type { DataRow } from './types';
import { parseCSV } from './utils';

interface DataImportProps {
  avaInstance: AVA | null;
  onDataLoaded: (data: DataRow[]) => void;
}

const DataImport: React.FC<DataImportProps> = ({ avaInstance, onDataLoaded }) => {
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    if (!avaInstance) {
      setError('Please configure your LLM API key first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the global AVA instance's loadText to extract structured data from text
      // The loadText API returns the loaded structured data directly
      const data = await avaInstance.loadText(textInput);
      
      onDataLoaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!avaInstance) {
      setError('Please configure your LLM API key first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      
      // Parse CSV in browser
      const parsedData = parseCSV(content);
      
      if (parsedData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      // Use the global AVA instance's loadObject to load the parsed data
      // The loadObject API returns the loaded structured data directly
      const data = await avaInstance.loadObject(parsedData);
      
      onDataLoaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-6 h-6 bg-[#78d3f8]/20 text-[#78d3f8] text-sm font-semibold rounded-full">1</span>
        <h2 className="text-lg font-semibold text-gray-800">Import your data</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Paste raw data</label>
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Paste CSV, JSON or plain text data..."
            className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all text-sm text-gray-700 placeholder-[#78d3f8]/60"
          />
          <button
            onClick={handleTextSubmit}
            disabled={isLoading || !textInput.trim()}
            className="mt-3 px-4 py-2 bg-[#78d3f8] hover:bg-[#4ec4ef] disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {isLoading ? 'Processing...' : 'Extract Data'}
          </button>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Upload spreadsheets</label>
          <div
            className="h-32 border-2 border-dashed border-[#78d3f8]/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#78d3f8]/60 hover:bg-[#78d3f8]/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-8 h-8 text-[#78d3f8] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-700">Drag & Drop Excel or CSV</p>
            <p className="text-xs text-[#78d3f8] mt-1">Maximum file size: 25MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 px-4 py-2 bg-white border border-gray-200 hover:border-[#78d3f8] text-gray-700 text-sm rounded-lg transition-colors"
          >
            Browse Files
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default DataImport;
