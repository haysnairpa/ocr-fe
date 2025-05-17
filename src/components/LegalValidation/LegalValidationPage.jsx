import React, { useState } from 'react';
import FileUploader from '../common/FileUploader';
import LoadingSpinner from '../common/LoadingSpinner';
import ValidationResults from './ValidationResults';
import { processLegalTermFile, validateAgainstLegalTerms } from '../../services/legalValidationService';
import { validateExcelFile } from '../../utils/fileUtils';

/**
 * Legal Validation Page component
 * @param {Object} props - Component props
 * @param {Object} props.ocrResults - OCR results to validate against
 * @param {Object} props.symbolResults - Symbol detection results to validate against
 * @returns {JSX.Element} - Rendered component
 */
const LegalValidationPage = ({ ocrResults, symbolResults }) => {
  // State variables
  const [legalTermFile, setLegalTermFile] = useState(null);
  const [isLegalTermUploaded, setIsLegalTermUploaded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);
  const [validationResults, setValidationResults] = useState(null);

  // Handle legal term file selection
  const handleLegalTermFileChange = (event) => {
    const file = event.target.files[0];
    
    // Reset validation results
    setValidationResults(null);
    setError(null);
    
    // Validate file
    const validation = validateExcelFile(file);
    if (!validation.isValid) {
      setError(validation.error);
      setLegalTermFile(null);
      setIsLegalTermUploaded(false);
      return;
    }
    
    setLegalTermFile(file);
    setIsLegalTermUploaded(true);
  };

  // Handle validation
  const handleValidate = async (event) => {
    event.preventDefault();

    if (!legalTermFile) {
      setError('Please upload a legal term file first');
      return;
    }

    if (!ocrResults || !symbolResults) {
      setError('Please perform OCR and symbol detection first');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Process the legal term file
      const legalTerms = await processLegalTermFile(legalTermFile);
      
      // Validate OCR and symbol results against legal terms
      const results = validateAgainstLegalTerms(ocrResults, symbolResults, legalTerms);
      
      setValidationResults(results);
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while validating. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File upload section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Legal Terms</h2>
        <form onSubmit={handleValidate} className="space-y-4">
          <FileUploader
            id="legal-term-upload"
            label="Select a legal term file (CSV or XLSX, max 5MB)"
            accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleLegalTermFileChange}
            buttonText="Choose File"
          />
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={!isLegalTermUploaded || isValidating || !ocrResults || !symbolResults}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Validating...
              </>
            ) : (
              'Validate'
            )}
          </button>
          
          {(!ocrResults || !symbolResults) && (
            <p className="text-sm text-amber-600">
              Note: You need to perform OCR and symbol detection before validation.
            </p>
          )}
        </form>
      </div>
      
      {/* Results section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Validation Results</h2>
        
        {isValidating ? (
          <div className="flex justify-center items-center h-[300px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : validationResults ? (
          <ValidationResults validationResults={validationResults} />
        ) : (
          <div className="flex items-center justify-center bg-gray-50 p-4 rounded-md h-[200px]">
            <p className="text-gray-500 italic">
              {isLegalTermUploaded ? 'Click "Validate" to check compliance' : 'Please upload a legal term file to begin'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalValidationPage;
