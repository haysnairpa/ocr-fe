import React, { useState } from 'react';
import FileUploader from '../common/FileUploader';
import LoadingSpinner from '../common/LoadingSpinner';
import ImagePreview from '../OCR/ImagePreview';
import OCRResults from '../OCR/OCRResults';
import SymbolResults from '../Symbols/SymbolResults';
import ValidationResults from '../LegalValidation/ValidationResults';
import VisualizationView from '../common/VisualizationView';
import { detectText } from '../../services/ocrService';
import { detectSymbols } from '../../services/symbolService';
import { processLegalTermFile, validateAgainstLegalTerms } from '../../services/legalValidationService';
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
      
      // Set the symbol results
      setSymbolResults(symbolData.symbols);
      
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

  // Handle legal validation
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
      // Process the legal term file
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
      
      // Add all detected symbol classes directly from the results
      // This ensures we capture all symbols regardless of their structure
      symbolResults.forEach(symbol => {
        if (symbol && symbol.class) {
          const className = symbol.class.toLowerCase();
          detectedSymbols.push(className);
          
          // Add common variations of the symbol name
          if (className.includes('ce_mark') || className.includes('ce mark') || className === 'ce') {
            detectedSymbols.push('ce mark');
            detectedSymbols.push('ce');
            detectedSymbols.push('ce_mark');
          }
          
          if (className.includes('age_grade') || className.includes('age grade') || className.includes('3+')) {
            detectedSymbols.push('age grade');
            detectedSymbols.push('3+');
            detectedSymbols.push('age_grade');
          }
          
          if (className.includes('mobius') || className.includes('loop') || className.includes('recycling')) {
            detectedSymbols.push('mobius loop');
            detectedSymbols.push('mobius');
            detectedSymbols.push('loop');
          }
        }
      });
      
      // Explicitly add detected symbols based on their class name
      // This is a hardcoded approach to ensure we capture all symbols
      const symbolClassMap = {
        'ce_mark': ['ce mark', 'ce', 'ce_mark'],
        'ce mark': ['ce mark', 'ce', 'ce_mark'],
        'ce': ['ce mark', 'ce', 'ce_mark'],
        'age_grade': ['age grade', '3+', 'age_grade'],
        'age grade': ['age grade', '3+', 'age_grade'],
        '3+': ['age grade', '3+', 'age_grade'],
        'mobius_triangle': ['mobius loop', 'mobius', 'loop', 'recycling'],
        'mobius triangle': ['mobius loop', 'mobius', 'loop', 'recycling'],
        'mobius': ['mobius loop', 'mobius', 'loop', 'recycling'],
        'trademark': ['registered trademark', 'trademark', 'registered', '®', 'tm'],
        'registered': ['registered trademark', 'trademark', 'registered', '®', 'tm']
      };
      
      // Check each detected symbol against our map and add all variations
      symbolResults.forEach(symbol => {
        if (symbol && symbol.class) {
          const className = symbol.class.toLowerCase();
          Object.keys(symbolClassMap).forEach(key => {
            if (className.includes(key)) {
              symbolClassMap[key].forEach(variation => {
                if (!detectedSymbols.includes(variation)) {
                  detectedSymbols.push(variation);
                }
              });
            }
          });
        }
      });
      
      // Log detected symbols for debugging
      console.log('Detected symbols for validation:', detectedSymbols);
      
      // Validate OCR and symbol results against legal terms
      const results = validateAgainstLegalTerms(ocrResults, detectedSymbols, legalTerms);
      
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

  // Handle image dimensions change
  const handleDimensionsChange = (dimensions) => {
    setImageDimensions(dimensions);
  };

  // Handle tab change in results section
  const handleResultTabChange = (tab) => {
    setActiveResultTab(tab);
  };

  return (
    <div className="space-y-6">
      {/* API URL Setter is assumed to be in a parent component */}
      
      {/* Image upload section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Image for Analysis</h2>
        <form onSubmit={handleAnalyzeImage} className="space-y-4">
          <FileUploader
            id="integrated-image-upload"
            label="Select an image file (JPEG or PNG, max 5MB)"
            accept="image/jpeg, image/png"
            onChange={handleFileChange}
            buttonText="Choose Image"
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
            disabled={!selectedFile || isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading && (processingStage === 'text' || processingStage === 'symbols') ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                {processingStage === 'text' ? 'Detecting Text...' : 'Detecting Symbols...'}
              </>
            ) : (
              'Analyze Image'
            )}
          </button>
        </form>
      </div>
      
      {/* Legal term upload and validation section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Legal Validation</h2>
        <form onSubmit={handleValidate} className="space-y-4">
          <FileUploader
            id="legal-term-upload"
            label="Select a legal term file (CSV or XLSX, max 5MB)"
            accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleLegalTermFileChange}
            buttonText="Choose File"
          />
          
          <button
            type="submit"
            disabled={!legalTermFile || !ocrResults || !symbolResults || isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading && processingStage === 'validation' ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Validating...
              </>
            ) : (
              'Validate'
            )}
          </button>
        </form>
      </div>
      
      {/* Results section */}
      {(ocrResults || symbolResults || validationResults) && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Analysis Results</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image preview */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">Image</h3>
              <ImagePreview 
                previewUrl={previewUrl} 
                onDimensionsChange={handleDimensionsChange}
                className="min-h-[300px]"
              />
            </div>
            
            {/* Results Tabs */}
            <div>
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex" aria-label="Tabs">
                  <button
                    className={`w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                      activeResultTab === 'text' ? 
                      'border-indigo-500 text-indigo-600' : 
                      'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleResultTabChange('text')}
                    disabled={!ocrResults}
                  >
                    Text Detection
                  </button>
                  <button
                    className={`w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                      activeResultTab === 'symbols' ? 
                      'border-indigo-500 text-indigo-600' : 
                      'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleResultTabChange('symbols')}
                    disabled={!symbolResults}
                  >
                    Symbol Detection
                  </button>
                  <button
                    className={`w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                      activeResultTab === 'validation' ? 
                      'border-indigo-500 text-indigo-600' : 
                      'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleResultTabChange('validation')}
                    disabled={!validationResults}
                  >
                    Validation
                  </button>
                </nav>
              </div>
              
              <div className="mt-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : activeResultTab === 'text' && ocrResults ? (
                  <OCRResults results={ocrResults} className="max-h-[500px]" />
                ) : activeResultTab === 'symbols' && symbolResults ? (
                  <SymbolResults symbols={symbolResults} className="max-h-[500px]" />
                ) : activeResultTab === 'validation' && validationResults ? (
                  <ValidationResults validationResults={validationResults} className="max-h-[500px]" />
                ) : (
                  <div className="flex items-center justify-center bg-gray-50 p-4 rounded-md h-[300px]">
                    <p className="text-gray-500 italic">
                      {previewUrl ? 'Click "Analyze Image" to process the image' : 'Please upload an image to begin'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Visualizations */}
          {(visualizations.text || visualizations.symbols) && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-700 mb-2">Visualizations</h3>
              
              {/* Text Detection Visualizations */}
              {visualizations.text && activeResultTab === 'text' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {visualizations.text.word_image && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Word Detection</h4>
                      <VisualizationView 
                        visualizationData={visualizations.text.word_image} 
                        altText="Word Detection Visualization" 
                      />
                    </div>
                  )}
                  
                  {visualizations.text.line_image && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Line Detection</h4>
                      <VisualizationView 
                        visualizationData={visualizations.text.line_image} 
                        altText="Line Detection Visualization" 
                      />
                    </div>
                  )}
                  
                  {visualizations.text.para_image && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Paragraph Detection</h4>
                      <VisualizationView 
                        visualizationData={visualizations.text.para_image} 
                        altText="Paragraph Detection Visualization" 
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Symbol Detection Visualization */}
              {visualizations.symbols && activeResultTab === 'symbols' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Symbol Detection</h4>
                  <VisualizationView 
                    visualizationData={visualizations.symbols} 
                    altText="Symbol Detection Visualization" 
                    className="max-w-full"
                  />
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
