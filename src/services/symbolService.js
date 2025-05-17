/**
 * Symbol Detection API Service
 * Handles all interactions with the Symbol Detection API
 */

// API endpoint for symbol detection
const SYMBOL_DETECTION_API = 'https://a474-35-196-100-241.ngrok-free.app/detect_symbols';

/**
 * Process symbol detection from an image
 * @param {File} imageFile - The image file to process
 * @returns {Promise<Object>} - The processed symbol detection results
 */
export const detectSymbols = async (imageFile) => {
  try {
    // Create form data for symbol detection
    const symbolFormData = new FormData();
    symbolFormData.append('image', imageFile);
    
    // Call symbol detection API
    const symbolResponse = await fetch(SYMBOL_DETECTION_API, {
      method: 'POST',
      body: symbolFormData,
    });
    
    if (!symbolResponse.ok) {
      throw new Error(`HTTP error in symbol detection! Status: ${symbolResponse.status}`);
    }
    
    const symbolData = await symbolResponse.json();
    
    // Process symbol results
    const processedSymbols = symbolData.symbols?.map(symbol => ({
      ...symbol,
      class: symbol.class?.toLowerCase() // Ensure class name is lowercase for consistency
    })) || [];
    
    console.log('Processed symbol results:', processedSymbols);
    
    return {
      symbols: processedSymbols,
      visualization: symbolData.visualization
    };
  } catch (error) {
    console.error('Error in detectSymbols:', error);
    throw error;
  }
};
