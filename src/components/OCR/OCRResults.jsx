import React from 'react';

/**
 * Component to display OCR detection results
 * @param {Object} props - Component props
 * @param {Object} props.results - OCR results data
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
const OCRResults = ({ results, className = '' }) => {
  if (!results || !results.results || results.results.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 rounded-md ${className}`}>
        <p className="text-gray-500 italic">No text detected</p>
      </div>
    );
  }

  return (
    <div className={`overflow-auto ${className}`}>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {results.results.map((result, index) => (
            <li key={index} className="px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-2">
                  <p className="text-sm font-medium text-indigo-600 break-words whitespace-pre-wrap">
                    {result.text || `Region ${index + 1}`}
                  </p>
                </div>
                {result.confidence && (
                  <div className="flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Confidence: {(result.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded-md">
                  <p className="text-xs font-medium text-gray-700 mb-1">Font Information</p>
                  <div className="flex flex-wrap gap-2">
                    {result.font_size && (
                      <div className="bg-white px-2 py-1 rounded text-sm text-gray-600 shadow-sm">
                        <span className="font-medium">Size:</span> {result.font_size}
                      </div>
                    )}
                    {result.font && (
                      <div className="bg-white px-2 py-1 rounded text-sm text-gray-600 shadow-sm">
                        <span className="font-medium">Font:</span> {result.font}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-md">
                  <p className="text-xs font-medium text-gray-700 mb-1">Position</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-white px-2 py-1 rounded text-sm text-gray-600 shadow-sm">
                      <span className="font-medium">X:</span> {result.xmin?.toFixed(0) || 'N/A'}-{result.xmax?.toFixed(0) || 'N/A'}
                    </div>
                    <div className="bg-white px-2 py-1 rounded text-sm text-gray-600 shadow-sm">
                      <span className="font-medium">Y:</span> {result.ymin?.toFixed(0) || 'N/A'}-{result.ymax?.toFixed(0) || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OCRResults;
