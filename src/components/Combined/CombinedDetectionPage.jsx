import React, { useState } from 'react';
import FileUploader from '../common/FileUploader';
import LoadingSpinner from '../common/LoadingSpinner';
import ImagePreview from '../OCR/ImagePreview';
import OCRResults from '../OCR/OCRResults';
import SymbolResults from '../Symbols/SymbolResults';
import VisualizationView from '../common/VisualizationView';
import { detectText } from '../../services/ocrService';
import { detectSymbols } from '../../services/symbolService';
import { validateImageFile, fileToBase64 } from '../../utils/fileUtils';

/**
 * Combined Detection Page component for both text and symbol detection
 * @param {Object} props - Component props
 * @param {Function} props.onOcrResultsUpdate - Callback to update parent component with OCR results
 * @param {Function} props.onSymbolResultsUpdate - Callback to update parent component with symbol results
 * @returns {JSX.Element} - Rendered component
 */
const CombinedDetectionPage = ({ onOcrResultsUpdate, onSymbolResultsUpdate }) => {
  // State variables
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const [symbolResults, setSymbolResults] = useState(null);
  const [visualizations, setVisualizations] = useState({
    text: null,
    symbols: null
  });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [selectedFileBase64, setSelectedFileBase64] = useState(null);
  const [processingStage, setProcessingStage] = useState(null); // 'text', 'symbols', 'complete', null
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'symbols'

  // Handle image file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    // Reset states
    setError(null);
    setOcrResults(null);
    setSymbolResults(null);
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
      // Store base64 for API calls
      setSelectedFileBase64(fileReader.result.split(',')[1]);
    };
    fileReader.readAsDataURL(file);
  };

  // Handle form submission - runs both text and symbol detection sequentially
  const handleSubmit = async (event) => {
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
      
      // Update parent component with OCR results
      if (onOcrResultsUpdate) {
        onOcrResultsUpdate(textData);
      }
      
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
      
      // Update parent component with symbol results
      if (onSymbolResultsUpdate) {
        onSymbolResultsUpdate(symbolData.symbols);
      }
      
      // Set symbol visualization
      setVisualizations(prev => ({
        ...prev,
        symbols: symbolData.visualization
      }));

      // Processing complete
      setProcessingStage('complete');
    } catch (error) {
      console.error('Error:', error);
      setError(`An error occurred during ${processingStage || 'processing'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image dimensions change
  const handleDimensionsChange = (dimensions) => {
    setImageDimensions(dimensions);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      {/* File upload section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Image for Analysis</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploader
            id="combined-image-upload"
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
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                {processingStage === 'text' ? 'Detecting Text...' : 
                 processingStage === 'symbols' ? 'Detecting Symbols...' : 'Processing...'}
              </>
            ) : (
              'Analyze Image'
            )}
          </button>
        </form>
      </div>
      
      {/* Results section */}
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
                  className={`w-1/2 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'text' ? 
                    'border-indigo-500 text-indigo-600' : 
                    'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('text')}
                  disabled={!ocrResults}
                >
                  Text Detection
                </button>
                <button
                  className={`w-1/2 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'symbols' ? 
                    'border-indigo-500 text-indigo-600' : 
                    'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('symbols')}
                  disabled={!symbolResults}
                >
                  Symbol Detection
                </button>
              </nav>
            </div>
            
            <div className="mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-[300px]">
                  <LoadingSpinner size="lg" />
                </div>
              ) : activeTab === 'symbols' && symbolResults ? (
                <SymbolResults symbols={symbolResults} className="max-h-[500px]" />
              ) : activeTab === 'text' && ocrResults ? (
                <OCRResults results={ocrResults} className="max-h-[500px]" />
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
            {visualizations.text && activeTab === 'text' && (
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
            {visualizations.symbols && activeTab === 'symbols' && (
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
    </div>
  );
};

export default CombinedDetectionPage;
