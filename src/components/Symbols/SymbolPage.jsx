import React, { useState } from 'react';
import FileUploader from '../common/FileUploader';
import LoadingSpinner from '../common/LoadingSpinner';
import ImagePreview from '../OCR/ImagePreview';
import SymbolResults from './SymbolResults';
import SymbolVisualization from './SymbolVisualization';
import VisualizationView from '../common/VisualizationView';
import { detectSymbols } from '../../services/symbolService';
import { validateImageFile } from '../../utils/fileUtils';

/**
 * Symbol Detection Page component
 * @param {Object} props - Component props
 * @param {Function} props.onResultsUpdate - Callback to update parent component with symbol results
 * @returns {JSX.Element} - Rendered component
 */
const SymbolPage = ({ onResultsUpdate }) => {
  // State variables
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symbolResults, setSymbolResults] = useState(null);
  const [imageShape, setImageShape] = useState(null);
  const [symbolVisualization, setSymbolVisualization] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Handle image file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    // Reset states
    setError(null);
    setSymbolResults(null);
    setImageShape(null);
    setSymbolVisualization(null);

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

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSymbolResults(null);
    setImageShape(null);
    setSymbolVisualization(null);

    try {
      // Call symbol detection API
      const symbolData = await detectSymbols(selectedFile);
      
      // Set the results
      setSymbolResults(symbolData.symbols);
      setImageShape(symbolData.imageShape);
      setSymbolVisualization(symbolData.visualization);
      
      // Update parent component with results
      if (onResultsUpdate) {
        onResultsUpdate(symbolData.symbols);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while processing the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image dimensions change
  const handleDimensionsChange = (dimensions) => {
    setImageDimensions(dimensions);
  };

  return (
    <div className="space-y-6">
      {/* File upload section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Image for Symbol Detection</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploader
            id="symbol-image-upload"
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
                Processing...
              </>
            ) : (
              'Detect Symbols'
            )}
          </button>
        </form>
      </div>
      
      {/* Results section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Symbol Detection Results</h2>
        
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
          
          {/* Symbol Results */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Detected Symbols</h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <LoadingSpinner size="lg" />
              </div>
            ) : symbolResults ? (
              <SymbolResults symbols={symbolResults} className="max-h-[500px]" />
            ) : (
              <div className="flex items-center justify-center bg-gray-50 p-4 rounded-md h-[300px]">
                <p className="text-gray-500 italic">
                  {previewUrl ? 'Click "Detect Symbols" to analyze the image' : 'Please upload an image to begin'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Visualization with bounding boxes */}
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-700 mb-2">Symbol Visualization</h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <LoadingSpinner size="lg" />
            </div>
          ) : symbolVisualization ? (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">Model Visualization (with confidence)</h4>
              <VisualizationView 
                visualizationData={symbolVisualization} 
                altText="Symbol Detection Visualization from Model" 
                className="max-w-full mb-4"
              />
            </div>
          ) : previewUrl && symbolResults && symbolResults.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">Custom Visualization</h4>
              <SymbolVisualization 
                imageUrl={previewUrl} 
                symbols={symbolResults} 
                className="max-w-full"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-gray-50 p-4 rounded-md h-[300px]">
              <p className="text-gray-500 italic">
                {previewUrl ? 'Click "Detect Symbols" to analyze the image' : 'Please upload an image to begin'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymbolPage;
