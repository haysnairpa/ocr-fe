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
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">
                  {result.text || `Region ${index + 1}`}
                </p>
                <div className="ml-2 flex-shrink-0 flex">
                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Confidence: {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500">
                    {result.font_size && (
                      <span className="mr-2">Font Size: {result.font_size}</span>
                    )}
                    {result.font && (
                      <span>Font: {result.font}</span>
                    )}
                  </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <p>
                    Position: X({result.xmin?.toFixed(0) || 'N/A'}-{result.xmax?.toFixed(0) || 'N/A'}) 
                    Y({result.ymin?.toFixed(0) || 'N/A'}-{result.ymax?.toFixed(0) || 'N/A'})
                  </p>
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
