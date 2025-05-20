import React from 'react';

/**
 * Component to display symbol detection results
 * @param {Object} props - Component props
 * @param {Array} props.symbols - Symbol detection results
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
const SymbolResults = ({ symbols, className = '' }) => {
  if (!symbols || symbols.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 rounded-md ${className}`}>
        <p className="text-gray-500 italic">No symbols detected</p>
      </div>
    );
  }

  return (
    <div className={`overflow-auto ${className}`}>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {symbols.map((symbol, index) => (
            <li key={index} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">
                  {symbol.label || symbol.class || `Symbol ${index + 1}`}
                </p>
                <div className="ml-2 flex-shrink-0 flex">
                  {symbol.confidence && (
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Confidence: {(symbol.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <p>
                    Position: X({symbol.xmin?.toFixed(0) || 'N/A'}-{symbol.xmax?.toFixed(0) || 'N/A'}) 
                    Y({symbol.ymin?.toFixed(0) || 'N/A'}-{symbol.ymax?.toFixed(0) || 'N/A'})
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Size: {symbol.width?.toFixed(0) || 'N/A'} × {symbol.height?.toFixed(0) || 'N/A'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SymbolResults;
