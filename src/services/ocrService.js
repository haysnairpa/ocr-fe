/**
 * OCR API Service
 * Handles all interactions with the OCR API
 */

// API endpoint for text detection
const TEXT_DETECTION_API = 'https://2067-34-169-69-145.ngrok-free.app/detect';

/**
 * Process text detection from an image
 * @param {File} imageFile - The image file to process
 * @returns {Promise<Object>} - The processed OCR results
 */
export const detectText = async (imageFile) => {
  try {
    // Create form data for text detection
    const textFormData = new FormData();
    textFormData.append('image', imageFile);

    // Call text detection API
    const textResponse = await fetch(TEXT_DETECTION_API, {
      method: 'POST',
      body: textFormData,
    });

    if (!textResponse.ok) {
      throw new Error(`HTTP error in text detection! Status: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    
    // Debug logs to see the API response structure
    console.log('Text Detection API Response:', textData);
    
    // Check if the API response is valid
    if (!textData || !textData.results) {
      console.error('Invalid API response structure:', textData);
      return { results: [] };
    }
    
    // Process each result to extract text
    const extractedResults = textData.results.map((result, index) => {
      // Try to extract text from the result object
      let extractedText = '';
      
      // Check if the result has a direct text property
      if (result.text) {
        extractedText = result.text;
      }
      // Check if the result has a 'lines' property with text
      else if (result.lines && Array.isArray(result.lines)) {
        // Extract text from lines
        const lineTexts = [];
        for (const line of result.lines) {
          if (typeof line === 'string') {
            lineTexts.push(line);
          } else if (Array.isArray(line)) {
            lineTexts.push(line.join(' '));
          } else if (line && typeof line === 'object') {
            if (line.text) {
              lineTexts.push(line.text);
            }
          }
        }
        extractedText = lineTexts.join(' ');
      }
      // Check if the result has a 'words' property with text
      else if (result.words && Array.isArray(result.words)) {
        // Extract text from words
        const wordTexts = [];
        for (const word of result.words) {
          if (typeof word === 'string') {
            wordTexts.push(word);
          } else if (word && typeof word === 'object' && word.text) {
            wordTexts.push(word.text);
          }
        }
        extractedText = wordTexts.join(' ');
      }
      
      // If we couldn't extract any text, use the ID or a default value
      if (!extractedText) {
        if (result.id !== undefined) {
          extractedText = `Region ${result.id}`;
        } else {
          extractedText = `Region ${index + 1}`;
        }
      }
      
      // Create a new result object with the extracted text
      return {
        ...result,
        text: extractedText
      };
    });
    
    // Create the final processed results object
    return {
      ...textData,
      results: extractedResults
    };
  } catch (error) {
    console.error('Error in detectText:', error);
    throw error;
  }
};
