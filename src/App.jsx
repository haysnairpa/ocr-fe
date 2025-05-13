import React, { useState, useEffect, useRef } from 'react';

function App() {
  // State variables
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // References
  const imageRef = useRef(null);
  
  // Effect to update image dimensions when image loads
  useEffect(() => {
    if (previewUrl && imageRef.current) {
      const updateDimensions = () => {
        setImageDimensions({
          width: imageRef.current.naturalWidth,
          height: imageRef.current.naturalHeight,
          displayWidth: imageRef.current.clientWidth,
          displayHeight: imageRef.current.clientHeight
        });
      };
      
      // Set initial dimensions
      if (imageRef.current.complete) {
        updateDimensions();
      }
      
      // Update dimensions when image loads
      imageRef.current.addEventListener('load', updateDimensions);
      
      // Create a resize observer to update dimensions when container resizes
      const resizeObserver = new ResizeObserver(() => {
        if (imageRef.current) {
          updateDimensions();
        }
      });
      
      if (imageRef.current) {
        resizeObserver.observe(imageRef.current);
      }
      
      return () => {
        if (imageRef.current) {
          imageRef.current.removeEventListener('load', updateDimensions);
          resizeObserver.disconnect();
        }
      };
    }
  }, [previewUrl]);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    // Reset states
    setError(null);
    setResults(null);
    
    // Validate file type
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size <= 5 * 1024 * 1024) {
        setSelectedFile(file);
        
        // Create preview URL
        const fileReader = new FileReader();
        fileReader.onload = () => {
          setPreviewUrl(fileReader.result);
        };
        fileReader.readAsDataURL(file);
      } else {
        setSelectedFile(null);
        setPreviewUrl(null);
        setError('File size exceeds the limit of 5MB');
      }
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError('Please select a valid image file (JPEG or PNG)');
    }
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
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Put the PUBLIC Ngrok URL that u get from backend
      const response = await fetch('https://xxxx-xx-xx-xx.ngrok-free.app/detect', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process and display results
      setResults(data);
      
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while processing the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gray-100 p-0 m-0">
      <div className="w-full h-full bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white text-center">Text Detection Demo</h1>
        </div>
        
        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Left Column - Upload and Preview */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload Section */}
                <div className="space-y-2">
                  <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">
                    Upload Image (JPEG or PNG, max 5MB)
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  
                  {/* Error Message */}
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>
                
                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={!selectedFile || isLoading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!selectedFile || isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : 'Detect Text'}
                  </button>
                </div>
              </form>
              
              {/* Preview Section */}
              {previewUrl && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Image Preview</h3>
                  <div className="mt-2 border border-gray-300 rounded-md overflow-hidden relative" style={{ maxWidth: '100%' }}>
                    <img
                      ref={imageRef}
                      id="preview-image"
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-auto"
                      style={{ display: 'block', maxWidth: '100%' }}
                      onLoad={() => {
                        if (imageRef.current) {
                          // Force a small delay to ensure accurate measurements
                          setTimeout(() => {
                            setImageDimensions({
                              width: imageRef.current.naturalWidth,
                              height: imageRef.current.naturalHeight,
                              displayWidth: imageRef.current.clientWidth,
                              displayHeight: imageRef.current.clientHeight
                            });
                          }, 100);
                        }
                      }}
                    />
                    
                    {/* Overlay detected text boxes */}
                    {results && results.results && results.results.length > 0 && imageDimensions.width > 0 && (
                      <div className="absolute top-0 left-0 w-full h-full">
                        {results.results.map((result, index) => {
                          // Get current image display dimensions
                          const currentDisplayWidth = imageRef.current ? imageRef.current.clientWidth : imageDimensions.displayWidth;
                          const currentDisplayHeight = imageRef.current ? imageRef.current.clientHeight : imageDimensions.displayHeight;
                          
                          // Calculate scaling factors based on current display dimensions
                          const scaleX = currentDisplayWidth / imageDimensions.width;
                          const scaleY = currentDisplayHeight / imageDimensions.height;
                          
                          // Ensure coordinates are numbers and not strings
                          const xmin = parseFloat(result.xmin);
                          const ymin = parseFloat(result.ymin);
                          const xmax = parseFloat(result.xmax);
                          const ymax = parseFloat(result.ymax);
                          
                          // Calculate scaled coordinates
                          const scaledXmin = xmin * scaleX;
                          const scaledYmin = ymin * scaleY;
                          const scaledWidth = (xmax - xmin) * scaleX;
                          const scaledHeight = (ymax - ymin) * scaleY;
                          
                          // Determine border color based on index (for variety)
                          const borderClass = index % 5 === 0 ? 'border-blue-500' : 
                                            index % 5 === 1 ? 'border-green-500' : 
                                            index % 5 === 2 ? 'border-yellow-500' : 
                                            index % 5 === 3 ? 'border-purple-500' : 'border-red-500';
                          
                          // Determine background color with opacity
                          const bgClass = index % 5 === 0 ? 'bg-blue-500' : 
                                         index % 5 === 1 ? 'bg-green-500' : 
                                         index % 5 === 2 ? 'bg-yellow-500' : 
                                         index % 5 === 3 ? 'bg-purple-500' : 'bg-red-500';
                          
                          return (
                            <div
                              key={index}
                              className={`absolute border-2 ${borderClass} ${bgClass} bg-opacity-20`}
                              style={{
                                left: `${scaledXmin}px`,
                                top: `${scaledYmin}px`,
                                width: `${scaledWidth}px`,
                                height: `${scaledHeight}px`,
                                zIndex: 10 + index,
                                pointerEvents: 'none' // Prevent interference with image interactions
                              }}
                              title={result.text} // Show text on hover instead of label
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - Results */}
            <div className="h-full flex flex-col">
              {/* Results Section */}
              {results && !isLoading ? (
                <div className="flex flex-col h-full">
                  <h3 className="text-lg font-medium text-gray-900">Detection Results</h3>
                  
                  {/* Text Results */}
                  {results.results && results.results.length > 0 ? (
                    <div className="bg-gray-50 p-4 rounded-md flex-grow mt-2 flex flex-col">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Detected Text: <span className="text-sm font-normal text-gray-500">({results.results.length} items)</span></h4>
                      
                      <div className="flex-grow overflow-y-auto pr-2">
                        <table className="w-full text-sm text-left text-gray-600">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2">Text</th>
                              <th className="px-3 py-2">Position</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.results.slice(0, 50).map((result, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium">{result.text}</td>
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  [{Math.round(result.xmin)}, {Math.round(result.ymin)}, {Math.round(result.xmax)}, {Math.round(result.ymax)}]
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {results.results.length > 50 && (
                          <p className="text-xs text-gray-500 mt-2 text-center italic">
                            Showing 50 of {results.results.length} detected items
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center">
                      <p className="text-sm text-gray-600">No text was detected in the image.</p>
                    </div>
                  )}
                </div>
              ) : previewUrl ? (
                <div className="h-full flex items-center justify-center bg-gray-50 p-4 rounded-md mt-2">
                  <p className="text-gray-500 italic">{isLoading ? 'Processing image...' : 'Click "Detect Text" to analyze the image'}</p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 p-4 rounded-md mt-2">
                  <p className="text-gray-500 italic">Please upload an image to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;