/**
 * OCR API Service
 * Handles all interactions with the OCR API
 */

import { API_ENDPOINTS } from '../config/apiConfig';


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
    const textResponse = await fetch(API_ENDPOINTS.TEXT_DETECTION, {
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
    // The backend returns results with text in each paragraph object
    const extractedResults = textData.results.map((result, index) => {
      // The backend already includes a 'text' property in each result
      // But we'll handle cases where it might be missing
      if (!result.text) {
        let extractedText = '';
        
        // Try to extract text from lines array if present
        if (result.lines && Array.isArray(result.lines)) {
          const lineTexts = [];
          
          for (const line of result.lines) {
            // Handle different possible structures of lines
            if (typeof line === 'string') {
              lineTexts.push(line);
            } else if (line && typeof line === 'object') {
              // If line is an object with words property
              if (line.words && Array.isArray(line.words)) {
                const wordTexts = [];
                for (const word of line.words) {
                  if (typeof word === 'string') {
                    wordTexts.push(word);
                  } else if (word && typeof word === 'object' && word.text) {
                    wordTexts.push(word.text);
                  }
                }
                lineTexts.push(wordTexts.join(' '));
              }
            }
          }
          
          extractedText = lineTexts.join(' ');
        }
        
        // If we still couldn't extract any text, use the ID or a default value
        if (!extractedText) {
          if (result.id !== undefined) {
            extractedText = `Region ${result.id}`;
          } else {
            extractedText = `Region ${index + 1}`;
          }
        }
        
        // Add the extracted text to the result
        return {
          ...result,
          text: extractedText
        };
      }
      
      // If text is already present, return the result as is
      return result;
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

/**
 * Refine detected text using the LLM-based refinement endpoint
 * @param {string} imageBase64 - Base64 encoded image
 * @param {Array} detectionResults - Results from text detection
 * @returns {Promise<Object>} - The refined text results
 */
export const refineText = async (imageBase64, detectionResults) => {
  try {
    const response = await fetch(API_ENDPOINTS.TEXT_REFINEMENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageBase64,
        result: detectionResults
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error in text refinement! Status: ${response.status}`);
    }

    const refinedData = await response.json();
    console.log('Text Refinement API Response:', refinedData);
    
    return refinedData;
  } catch (error) {
    console.error('Error in refineText:', error);
    throw error;
  }
};
