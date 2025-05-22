import React, { useState } from 'react';

/**
 * Component to display legal validation results
 * @param {Object} props - Component props
 * @param {Object} props.validationResults - Validation results data
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
const ValidationResults = ({ validationResults, className = '' }) => {
  const [activeTab, setActiveTab] = useState('text');

  if (!validationResults) {
    return (
      <div className={`p-4 bg-gray-50 rounded-md ${className}`}>
        <p className="text-gray-500 italic">No validation results available</p>
      </div>
    );
  }
  
  // Fungsi untuk mendapatkan data asli dari backend jika tersedia
  const getOriginalData = (validation) => {
    return validation.originalData || validation;
  };

  // Menghitung jumlah validasi yang valid dan tidak valid
  const getValidationStats = (validations) => {
    if (!validations || validations.length === 0) return { valid: 0, invalid: 0 };
    
    const valid = validations.filter(v => {
      const originalData = getOriginalData(v);
      return v.valid || originalData.req_properties?.every(prop => prop.req_status === 1) || false;
    }).length;
    
    return { valid, invalid: validations.length - valid };
  };

  const textStats = getValidationStats(validationResults.text_validations);
  const symbolStats = getValidationStats(validationResults.symbol_validations);

  // Render validation card untuk setiap validasi
  const renderValidationCard = (validation) => {
    const originalData = getOriginalData(validation);
    const isValid = validation.valid || originalData.req_properties?.every(prop => prop.req_status === 1) || false;
    const properties = validation.properties || originalData.req_properties || [];
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 ${isValid ? 'bg-green-50' : 'bg-red-50'} border-b border-gray-200`}>
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-800">
              {originalData.req_name || validation.description}
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isValid ? 'Valid' : 'Invalid'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{validation.description}</p>
        </div>
        
        {/* Properties */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-1 gap-3">
            {properties.map((prop, propIndex) => (
              <div key={propIndex} className={`p-3 rounded-md ${prop.req_status === 1 ? 'bg-green-50' : 'bg-red-50'} border ${prop.req_status === 1 ? 'border-green-200' : 'border-red-200'}`}>
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-700">{prop.req_property_name || prop.req_name}</span>
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${prop.req_status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {prop.req_status === 1 ? '✓' : '✗'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-700 break-words whitespace-pre-wrap">
                  {prop.req_property_value || prop.req_property_validation || prop.req_desc || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'text' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('text')}
        >
          Text Validations
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100">
            {validationResults.text_validations?.length || 0}
          </span>
          {textStats.invalid > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
              {textStats.invalid} issues
            </span>
          )}
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'symbol' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('symbol')}
        >
          Symbol Validations
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100">
            {validationResults.symbol_validations?.length || 0}
          </span>
          {symbolStats.invalid > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
              {symbolStats.invalid} issues
            </span>
          )}
        </button>
      </div>

      {/* Content - Menggunakan flex-grow untuk mengisi ruang yang tersedia */}
      <div className="flex-grow overflow-y-auto" style={{ minHeight: '400px' }}>
        {activeTab === 'text' && validationResults.text_validations && validationResults.text_validations.length > 0 && (
          <div className="space-y-4 p-4">
            {validationResults.text_validations.map((validation, index) => (
              <div key={index}>
                {renderValidationCard(validation)}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'symbol' && validationResults.symbol_validations && validationResults.symbol_validations.length > 0 && (
          <div className="space-y-4 p-4">
            {validationResults.symbol_validations.map((validation, index) => (
              <div key={index}>
                {renderValidationCard(validation)}
              </div>
            ))}
          </div>
        )}

        {((activeTab === 'text' && (!validationResults.text_validations || validationResults.text_validations.length === 0)) ||
          (activeTab === 'symbol' && (!validationResults.symbol_validations || validationResults.symbol_validations.length === 0))) && (
          <div className="flex items-center justify-center h-full p-4 bg-gray-50 rounded-md">
            <p className="text-gray-500">No {activeTab === 'text' ? 'text' : 'symbol'} validations available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationResults;
