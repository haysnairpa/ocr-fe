import React from 'react';

/**
 * Component to display legal validation results
 * @param {Object} props - Component props
 * @param {Object} props.validationResults - Validation results data
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
const ValidationResults = ({ validationResults, className = '' }) => {
  if (!validationResults) {
    return (
      <div className={`p-4 bg-gray-50 rounded-md ${className}`}>
        <p className="text-gray-500 italic">No validation results available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Text Validations */}
      {validationResults.text_validations && validationResults.text_validations.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">Text Validations</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-3 py-2">Pattern</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Required</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {validationResults.text_validations.map((validation, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{validation.pattern}</td>
                    <td className="px-3 py-2">{validation.description}</td>
                    <td className="px-3 py-2">{validation.required ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${validation.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {validation.valid ? 'Valid' : 'Invalid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Symbol Validations */}
      {validationResults.symbol_validations && validationResults.symbol_validations.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">Symbol Validations</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-3 py-2">Symbol</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Required</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {validationResults.symbol_validations.map((validation, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{validation.class}</td>
                    <td className="px-3 py-2">{validation.description}</td>
                    <td className="px-3 py-2">{validation.required ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${validation.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {validation.valid ? 'Valid' : 'Invalid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Layout Validations */}
      {validationResults.layout_validations && validationResults.layout_validations.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">Layout Validations</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-3 py-2">Rule</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {validationResults.layout_validations.map((validation, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{validation.rule}</td>
                    <td className="px-3 py-2">{validation.description}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${validation.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {validation.valid ? 'Valid' : 'Invalid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationResults;
