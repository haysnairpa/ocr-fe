import React, { useState } from 'react';
import FileUploader from '../common/FileUploader';
import LoadingSpinner from '../common/LoadingSpinner';
import ImagePreview from '../OCR/ImagePreview';
import OCRResults from '../OCR/OCRResults';
import SymbolResults from '../Symbols/SymbolResults';
import ValidationResults from '../LegalValidation/ValidationResults';
import VisualizationView from '../common/VisualizationView';
import { detectText, processTextPipeline, verifyRequirements } from '../../services/ocrService';
import { detectSymbols } from '../../services/symbolService';
import { processLegalTermFile, validateAgainstLegalTerms, processVerificationResults } from '../../services/legalValidationService';
import { validateImageFile, validateExcelFile } from '../../utils/fileUtils';

/**
 * Integrated page that combines OCR, Symbol Detection, and Legal Validation
 * @returns {JSX.Element} - Rendered component
 */
const IntegratedPage = () => {
  // State for image upload and processing
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingStage, setProcessingStage] = useState(null); // 'text', 'symbols', 'validation', 'complete', null

  // State for results
  const [ocrResults, setOcrResults] = useState(null);
  const [symbolResults, setSymbolResults] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  
  // State for visualizations
  const [visualizations, setVisualizations] = useState({
    text: null,
    symbols: null
  });
  
  // State for image dimensions
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // State for legal term file
  const [legalTermFile, setLegalTermFile] = useState(null);
  const [isLegalTermUploaded, setIsLegalTermUploaded] = useState(false);
  
  // State for active tab in results section
  const [activeResultTab, setActiveResultTab] = useState('text'); // 'text', 'symbols', 'validation'
  
  // State to track if we're using the complete pipeline
  const [useCompletePipeline, setUseCompletePipeline] = useState(false);

  // Handle image file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    // Reset states
    setError(null);
    setOcrResults(null);
    setSymbolResults(null);
    setValidationResults(null);
    setVisualizations({ text: null, symbols: null });
    setProcessingStage(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result);
    };
    fileReader.readAsDataURL(file);
  };

  // Handle legal term file selection
  const handleLegalTermFileChange = (event) => {
    const file = event.target.files[0];
    
    // Reset validation results
    setValidationResults(null);
    
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

  // Handle image analysis (OCR + Symbol Detection)
  const handleAnalyzeImage = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    // If we have both image and legal term file and complete pipeline is enabled,
    // use the complete pipeline instead
    if (useCompletePipeline && legalTermFile) {
      handleCompletePipeline();
      return;
    }

    setIsLoading(true);
    setError(null);
    setOcrResults(null);
    setSymbolResults(null);
    setVisualizations({ text: null, symbols: null });

    try {
      // Step 1: Text Detection
      setProcessingStage('text');
      const textData = await detectText(selectedFile);
      
      // Set the OCR results
      setOcrResults(textData);
      
      // Set text visualizations
      setVisualizations(prev => ({
        ...prev,
        text: {
          word_image: textData.visualizations?.word_image || '',
          line_image: textData.visualizations?.line_image || '',
          para_image: textData.visualizations?.para_image || ''
        }
      }));

      // Step 2: Symbol Detection
      setProcessingStage('symbols');
      const symbolData = await detectSymbols(selectedFile);
      
      // Set the symbol results - pastikan kita menggunakan array objek simbol lengkap
      setSymbolResults(symbolData.symbols);
      
      // Log untuk debugging
      console.log('Symbol detection results:', symbolData.symbols);
      
      // Set symbol visualization
      setVisualizations(prev => ({
        ...prev,
        symbols: symbolData.visualization
      }));

      // Processing complete
      setProcessingStage('complete');
      
      // Set active tab to text results by default
      setActiveResultTab('text');
    } catch (error) {
      console.error('Error:', error);
      setError(`An error occurred during ${processingStage || 'processing'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle complete pipeline (OCR + Symbol Detection + Legal Validation in one call)
  const handleCompletePipeline = async () => {
    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }
    
    if (!legalTermFile) {
      setError('Please upload a legal term file first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setOcrResults(null);
    setSymbolResults(null);
    setValidationResults(null);
    setVisualizations({ text: null, symbols: null });
    setProcessingStage('text');
    
    try {
      // Call the complete pipeline API
      const pipelineData = await processTextPipeline(selectedFile, legalTermFile);
      
      // Update processing stage to show progress
      setProcessingStage('symbols');
      
      // Set OCR results
      if (pipelineData.detectionResults && pipelineData.detectionResults.length > 0) {
        setOcrResults({
          results: pipelineData.detectionResults
        });
      }
      
      // Set visualizations
      if (pipelineData.visualizations) {
        setVisualizations({
          text: {
            word_image: pipelineData.visualizations.word_image || '',
            line_image: pipelineData.visualizations.line_image || '',
            para_image: pipelineData.visualizations.para_image || ''
          },
          symbols: pipelineData.visualizations.word_image || '' // Use word_image as fallback for symbols
        });
      }
      
      // Update processing stage
      setProcessingStage('validation');
      
      // Set symbol results if available
      if (pipelineData.refinedSymbols && pipelineData.refinedSymbols.length > 0) {
        // Convert to the expected format for symbolResults
        const symbolsArray = pipelineData.refinedSymbols.map((symbol, index) => ({
          id: symbol.id || index,
          class: symbol.text || '',
          confidence: 1.0 // Default confidence
        }));
        
        setSymbolResults(symbolsArray);
      }
      
      // Set validation results if available
      if (pipelineData.requirementCheck) {
        setValidationResults({
          text_validations: pipelineData.requirementCheck.text_requirment?.map(item => ({
            id: `text_${item.id || 0}`,
            description: item.refined_text || 'Text requirement',
            pattern: item.refined_text || '',
            required: true,
            valid: true
          })) || [],
          symbol_validations: pipelineData.symbolCheck?.map(item => ({
            id: `symbol_${item.id || 0}`,
            description: item.item || 'Symbol requirement',
            class: item.item?.toLowerCase() || '',
            required: true,
            valid: item.statement_requirement === 1
          })) || [],
          layout_validations: []
        });
        
        // Set active tab to validation results
        setActiveResultTab('validation');
      } else {
        // If no validation results, set active tab to text results
        setActiveResultTab('text');
      }
      
      // Processing complete
      setProcessingStage('complete');
    } catch (error) {
      console.error('Error:', error);
      setError(`An error occurred during ${processingStage || 'processing'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle legal validation (old method - using frontend processing)
  const handleValidate = async (event) => {
    event.preventDefault();

    if (!legalTermFile) {
      setError('Please upload a legal term file first');
      return;
    }

    if (!ocrResults || !symbolResults) {
      setError('Please analyze an image first');
      return;
    }

    setIsLoading(true);
    setProcessingStage('validation');
    setError(null);

    try {
      // Process the legal term file using backend API
      const legalTerms = await processLegalTermFile(legalTermFile);
      
      // Prepare simplified symbol results for validation
      // Extract detected symbol classes into a simple array for easier matching
      const detectedSymbols = [];
      
      // Add all detected symbols to the array
      if (Array.isArray(symbolResults)) {
        symbolResults.forEach(symbol => {
          if (symbol && symbol.class) {
            detectedSymbols.push(symbol.class.toLowerCase());
          }
        });
      }
      
      // Log detected symbols for debugging
      console.log('Detected symbols for validation:', detectedSymbols);
      
      // Validate OCR and symbol results against legal terms using backend API
      // Note: validateAgainstLegalTerms is now an async function
      const results = await validateAgainstLegalTerms(ocrResults, detectedSymbols, legalTerms);
      
      setValidationResults(results);
      setActiveResultTab('validation');
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while validating. Please try again.');
    } finally {
      setIsLoading(false);
      setProcessingStage('complete');
    }
  };
  
  // Handle legal validation using the new backend verification endpoint
  const handleVerifyRequirements = async () => {
    if (!legalTermFile) {
      setError('Please upload a legal term file first');
      return;
    }

    if (!ocrResults || !symbolResults) {
      setError('Please analyze an image first');
      return;
    }

    setIsLoading(true);
    setProcessingStage('verification');
    setError(null);

    try {
      // Call the verification API with image, OCR results, symbol results, and requirements file
      const verificationResults = await verifyRequirements(
        selectedFile,
        ocrResults,
        symbolResults,
        legalTermFile
      );
      
      console.log('Verification results from backend:', verificationResults);
      
      // Tambahkan symbolResults ke verificationResults untuk diproses
      verificationResults.symbolResults = symbolResults;
      
      // Process the verification results into the format expected by the UI
      const processedResults = processVerificationResults(verificationResults, null);
      
      setValidationResults(processedResults);
      setActiveResultTab('validation');
    } catch (error) {
      console.error('Error during verification:', error);
      setError('An error occurred while verifying requirements. Please try again.');
    } finally {
      setIsLoading(false);
      setProcessingStage('complete');
    }
  };

  // Handle image dimensions change
  const handleDimensionsChange = (dimensions) => {
    setImageDimensions(dimensions);
  };

  // Handle tab change in results section
  const handleResultTabChange = (tab) => {
    setActiveResultTab(tab);
  };

  return (
    <div className="space-y-8">
      {/* API URL Setter is assumed to be in a parent component */}
      
      {/* Main upload and processing section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image upload section */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 transition-all hover:shadow-xl">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Image Analysis</h2>
          </div>
          
          <form onSubmit={handleAnalyzeImage} className="space-y-5">
            <FileUploader
              id="integrated-image-upload"
              label="Upload an image for OCR and symbol detection"
              accept="image/jpeg, image/png"
              onChange={handleFileChange}
              buttonText="Select Image"
              className="mb-2"
            />
            
            {/* Toggle for complete pipeline */}
            <div className="flex items-center mb-4">
              <label className="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useCompletePipeline}
                  onChange={() => setUseCompletePipeline(!useCompletePipeline)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {useCompletePipeline ? 'Using Complete Pipeline (Backend Processing)' : 'Using Step-by-Step Processing'}
                </span>
              </label>
            </div>
            
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border-l-4 border-red-500">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-1 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={!selectedFile || isLoading}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && (processingStage === 'text' || processingStage === 'symbols') ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" label="" />
                  {processingStage === 'text' ? 'Detecting Text...' : 'Detecting Symbols...'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Analyze Image
                </>
              )}
            </button>
            
            {/* Processing status indicator */}
            {isLoading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: processingStage === 'text' ? '33%' : processingStage === 'symbols' ? '66%' : processingStage === 'validation' ? '100%' : '0%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {processingStage === 'text' ? 'Step 1/3: Text Detection' : 
                   processingStage === 'symbols' ? 'Step 2/3: Symbol Detection' : 
                   processingStage === 'validation' ? 'Step 3/3: Validation' : ''}
                </p>
              </div>
            )}
          </form>
        </div>
        
        {/* Legal term upload and validation section */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 transition-all hover:shadow-xl">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Legal Validation</h2>
          </div>
          
          <form className="space-y-5">
            <FileUploader
              id="legal-term-upload"
              label="Upload legal terms file for validation"
              accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleLegalTermFileChange}
              buttonText="Select Terms File"
              className="mb-2"
            />
            
            <div className="rounded-lg bg-blue-50 p-4 border-l-4 border-blue-500">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    First analyze an image, then upload a legal terms file to validate the detected text and symbols.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Verification button using backend endpoint */}
            <button
              type="button"
              disabled={!legalTermFile || !ocrResults || !symbolResults || isLoading}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              onClick={handleVerifyRequirements}
            >
              {isLoading && processingStage === 'verification' ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" label="" />
                  Validating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Validate
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Results section */}
      {(ocrResults || symbolResults || validationResults) && (
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image preview */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Analyzed Image
              </h3>
              <div className="overflow-hidden rounded-lg border border-gray-300 shadow-sm">
                <ImagePreview 
                  previewUrl={previewUrl} 
                  onDimensionsChange={handleDimensionsChange}
                  className="min-h-[300px] w-full object-contain"
                />
              </div>
            </div>
            
            {/* Results Tabs */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col" style={{ minHeight: '600px' }}>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col flex-grow">
                <div className="border-b border-gray-200">
                  <nav className="flex" aria-label="Tabs">
                    <button
                      className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                        activeResultTab === 'text' ? 
                        'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 
                        'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => handleResultTabChange('text')}
                      disabled={!ocrResults}
                    >
                      <div className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Text Detection
                      </div>
                    </button>
                    <button
                      className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                        activeResultTab === 'symbols' ? 
                        'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 
                        'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => handleResultTabChange('symbols')}
                      disabled={!symbolResults}
                    >
                      <div className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Symbol Detection
                      </div>
                    </button>
                    <button
                      className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                        activeResultTab === 'validation' ? 
                        'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 
                        'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => handleResultTabChange('validation')}
                      disabled={!validationResults}
                    >
                      <div className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Validation
                      </div>
                    </button>
                  </nav>
                </div>
                
                <div className="p-4 flex-grow flex flex-col" style={{ minHeight: '600px' }}>
                  {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-full">
                      <LoadingSpinner size="lg" color="blue" label="Processing..." />
                    </div>
                  ) : activeResultTab === 'text' && ocrResults ? (
                    <div className="h-full flex flex-col">
                      <OCRResults results={ocrResults} className="flex-grow overflow-auto" />
                    </div>
                  ) : activeResultTab === 'symbols' && symbolResults ? (
                    <div className="h-full flex flex-col">
                      <SymbolResults symbols={symbolResults} className="flex-grow overflow-auto" />
                    </div>
                  ) : activeResultTab === 'validation' && validationResults ? (
                    <div className="h-full flex flex-col">
                      <ValidationResults validationResults={validationResults} className="flex-grow" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg h-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 text-center">
                        {previewUrl ? 'Click "Analyze Image" to process the image' : 'Please upload an image to begin'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Visualizations */}
          {(visualizations.text || visualizations.symbols) && (
            <div className="mt-8 bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Visualizations
              </h3>
              
              {/* Text Detection Visualizations */}
              {visualizations.text && activeResultTab === 'text' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {visualizations.text.word_image && (
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Word Detection
                      </h4>
                      <div className="overflow-hidden rounded-md border border-gray-200">
                        <VisualizationView 
                          visualizationData={visualizations.text.word_image} 
                          altText="Word Detection Visualization" 
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                  
                  {visualizations.text.line_image && (
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Line Detection
                      </h4>
                      <div className="overflow-hidden rounded-md border border-gray-200">
                        <VisualizationView 
                          visualizationData={visualizations.text.line_image} 
                          altText="Line Detection Visualization" 
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                  
                  {visualizations.text.para_image && (
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Paragraph Detection
                      </h4>
                      <div className="overflow-hidden rounded-md border border-gray-200">
                        <VisualizationView 
                          visualizationData={visualizations.text.para_image} 
                          altText="Paragraph Detection Visualization" 
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Symbol Detection Visualization */}
              {visualizations.symbols && activeResultTab === 'symbols' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    Symbol Detection
                  </h4>
                  <div className="overflow-hidden rounded-md border border-gray-200">
                    <VisualizationView 
                      visualizationData={visualizations.symbols} 
                      altText="Symbol Detection Visualization" 
                      className="max-w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntegratedPage;
