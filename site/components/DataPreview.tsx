import React from 'react';
import type { DataRow } from './types';

interface DataPreviewProps {
  data: DataRow[];
}

const DataPreview: React.FC<DataPreviewProps> = ({ data }) => {
  const formatValue = (value: string | number | boolean | null): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      // Check if it looks like a percentage (values between -1 and 1 exclusive, with decimals)
      if (Math.abs(value) < 1 && value !== 0 && String(value).includes('.')) {
        return `${(value * 100).toFixed(0)}%`;
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  const getValueColor = (value: string | number | boolean | null): string => {
    if (typeof value === 'number') {
      if (value > 0 && Math.abs(value) < 1) return 'text-green-500';
      if (value < 0) return 'text-red-500';
    }
    if (typeof value === 'string') {
      if (value.startsWith('+')) return 'text-green-500';
      if (value.startsWith('-')) return 'text-red-500';
    }
    return 'text-gray-700';
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const displayData = data.slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 bg-[#78d3f8]/20 text-[#78d3f8] text-sm font-semibold rounded-full">2</span>
          <h2 className="text-lg font-semibold text-gray-800">Structured Data Preview</h2>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium">No data available</p>
            <p className="text-xs mt-1">Import data to see the preview</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {columns.map(col => (
                    <th key={col} className="text-left py-2 px-4 font-medium text-[#78d3f8]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                    {columns.map(col => (
                      <td key={col} className={`py-2 px-4 ${getValueColor(row[col])}`}>
                        {formatValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length > 10 && (
            <p className="mt-4 text-sm text-gray-400 text-center">
              Showing 10 of {data.length} rows
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default DataPreview;
