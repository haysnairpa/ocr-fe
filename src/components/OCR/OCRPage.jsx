import React, { useState } from 'react';
import FileUploader from '../common/FileUploader';
import LoadingSpinner from '../common/LoadingSpinner';
import ImagePreview from './ImagePreview';
import OCRResults from './OCRResults';
import VisualizationView from '../common/VisualizationView';
import { detectText } from '../../services/ocrService';
import { validateImageFile, fileToBase64 } from '../../utils/fileUtils';

/**
 * OCR Page component for text detection functionality
 * @param {Object} props - Component props
 * @param {Function} props.onResultsUpdate - Callback to update parent component with OCR results
 * @returns {JSX.Element} - Rendered component
 */
const OCRPage = ({ onResultsUpdate }) => {
  // State variables
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [visualizations, setVisualizations] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [selectedFileBase64, setSelectedFileBase64] = useState(null);

  // Handle image file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    // Reset states
    setError(null);
    setResults(null);
    setVisualizations(null);

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

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setVisualizations(null);

    try {
      // Call text detection API
      const textData = await detectText(selectedFile);
      
      // Set the results
      setResults(textData);
      
      // Update parent component with results
      if (onResultsUpdate) {
        onResultsUpdate(textData);
      }
      
      // Set visualizations
      setVisualizations({
        word_image: textData.visualizations?.word_image || '',
        line_image: textData.visualizations?.line_image || '',
        para_image: textData.visualizations?.para_image || ''
      });
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
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Image</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploader
            id="image-upload"
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
              'Detect Text'
            )}
          </button>
        </form>
      </div>
      
      {/* Results section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Results</h2>
        
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
          
          {/* OCR Results */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Detected Text</h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <LoadingSpinner size="lg" />
              </div>
            ) : results ? (
              <OCRResults results={results} className="max-h-[500px]" />
            ) : (
              <div className="flex items-center justify-center bg-gray-50 p-4 rounded-md h-[300px]">
                <p className="text-gray-500 italic">
                  {previewUrl ? 'Click "Detect Text" to analyze the image' : 'Please upload an image to begin'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Visualizations */}
        {visualizations && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-700 mb-2">Visualizations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visualizations.word_image && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Word Detection</h4>
                  <VisualizationView 
                    visualizationData={visualizations.word_image} 
                    altText="Word Detection Visualization" 
                  />
                </div>
              )}
              
              {visualizations.line_image && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Line Detection</h4>
                  <VisualizationView 
                    visualizationData={visualizations.line_image} 
                    altText="Line Detection Visualization" 
                  />
                </div>
              )}
              
              {visualizations.para_image && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Paragraph Detection</h4>
                  <VisualizationView 
                    visualizationData={visualizations.para_image} 
                    altText="Paragraph Detection Visualization" 
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRPage;
