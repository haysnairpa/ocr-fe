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
    console.log('Attempting to detect text from image:', imageFile.name);
    
    // Create form data for OCR processing
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Create a dummy requirements file for the backend
    // This is needed because the backend expects a requirements file
    // even though we're just doing text detection
    const dummyReqContent = 'text_requirement,description\nplaceholder,placeholder';
    const dummyReqFile = new File([dummyReqContent], 'dummy_requirements.csv', { type: 'text/csv' });
    formData.append('requirements', dummyReqFile);
    
    // We need to send a detected_image parameter as well
    // For text detection, we'll just send the same image
    formData.append('detected_image', imageFile);
    
    let data;
    try {
      // Call the text detection API
      const response = await fetch(API_ENDPOINTS.TEXT_DETECTION, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        // Handle specific error cases
        const errorText = await response.text();
        console.error('Text detection API error:', errorText);
        
        // Check if it's a division by zero error
        if (errorText.includes('division by zero') || errorText.includes('ZeroDivisionError')) {
          console.warn('Backend encountered a division by zero error. This may happen with certain images.');
          // Return a fallback empty result instead of throwing
          return {
            results: [],
            visualizations: {
              word_image: '',
              line_image: '',
              para_image: ''
            }
          };
        }
        
        throw new Error(`HTTP error in text detection! Status: ${response.status}`);
      }
      
      // Parse the response data
      data = await response.json();
      console.log('Text Detection API Response:', data);
      
    } catch (error) {
      console.error('Error in text detection API call:', error);
      // If it's a network error or other unexpected error, throw it
      if (!error.message.includes('division by zero')) {
        throw error;
      }
      // For division by zero errors, return fallback
      return {
        results: [],
        visualizations: {
          word_image: '',
          line_image: '',
          para_image: ''
        }
      };
    }
    
    // Handle the response from predict_pipeline endpoint
    let results = [];
    
    if (data.refined_text && Array.isArray(data.refined_text)) {
      // If we have refined_text in the response, use it
      results = data.refined_text;
    } else if (data.text_req_results && data.text_req_results.result) {
      // If we have text_req_results, extract the text from there
      results = data.text_req_results.result.map(req => ({
        id: req.req_para_id && req.req_para_id.length > 0 ? req.req_para_id[0] : `para_${Math.random().toString(36).substr(2, 9)}`,
        text: req.req_name || ''
      }));
    } else {
      console.error('Invalid API response structure:', data);
      return { results: [] };
    }
    
    // Process each result to extract text if needed
    const extractedResults = results.map((result, index) => {
      // If the result doesn't have text property, try to extract it
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
              // If line has text property
              if (line.text) {
                lineTexts.push(line.text);
              }
              // If line is an object with words property
              else if (line.words && Array.isArray(line.words)) {
                const wordTexts = [];
                for (const word of line.words) {
                  if (typeof word === 'string') {
                    wordTexts.push(word);
                  } else if (word && typeof word === 'object' && word.text) {
                    wordTexts.push(word.text);
                  }
                }
                if (wordTexts.length > 0) {
                  lineTexts.push(wordTexts.join(' '));
                }
              }
            }
          }
          
          if (lineTexts.length > 0) {
            extractedText = lineTexts.join('\n');
          }
        }
        
        // If we extracted text, add it to the result
        if (extractedText) {
          result.text = extractedText;
        } else {
          // If we couldn't extract text, use a placeholder
          result.text = `Text Block ${index + 1}`;
        }
      }
      
      return result;
    });
    
    // Return the processed results
    return {
      results: extractedResults,
      visualizations: data.visualizations || {
        word_image: '',
        line_image: '',
        para_image: ''
      }
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

/**
 * Parse requirements from a file
 * @param {File} requirementsFile - The requirements file (Excel or CSV)
 * @returns {Promise<Object>} - The parsed requirements
 */
export const parseRequirements = async (requirementsFile) => {
  try {
    const formData = new FormData();
    formData.append('file', requirementsFile);

    const response = await fetch(API_ENDPOINTS.UPLOAD_REQUIREMENTS, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error in requirements parsing! Status: ${response.status}`);
    }

    const uploadData = await response.json();
    console.log('Requirements Upload Response:', uploadData);
    
    // If we have requirements data, parse it using the new endpoint
    if (uploadData.requirements) {
      const parseResponse = await fetch(API_ENDPOINTS.TEXT_API_URL + '/parse_requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requirements: uploadData.requirements
        })
      });

      if (!parseResponse.ok) {
        throw new Error(`HTTP error in requirements parsing! Status: ${parseResponse.status}`);
      }

      const parsedData = await parseResponse.json();
      console.log('Requirements Parsing Response:', parsedData);
      
      return parsedData;
    }
    
    return uploadData;
  } catch (error) {
    console.error('Error in parseRequirements:', error);
    throw error;
  }
};

/**
 * Check text against requirements
 * @param {string} imageBase64 - Base64 encoded image
 * @param {Array} refinedText - Refined text from text detection
 * @param {Object} textRequirement - Text requirements to check against
 * @returns {Promise<Object>} - The requirement check results
 */
export const checkTextRequirements = async (imageBase64, refinedText, textRequirement) => {
  try {
    const response = await fetch(API_ENDPOINTS.CHECK_TEXT_REQUIREMENTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageBase64,
        refined_text: refinedText,
        text_requirement: textRequirement
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error in text requirement check! Status: ${response.status}`);
    }

    const checkData = await response.json();
    console.log('Text Requirement Check Response:', checkData);
    
    return checkData;
  } catch (error) {
    console.error('Error in checkTextRequirements:', error);
    throw error;
  }
};

/**
 * Process complete text pipeline in one call
 * This uses the backend's text_pipeline endpoint to perform all steps at once:
 * - Text detection
 * - Text refinement
 * - Requirements parsing
 * - Requirements validation
 * 
 * @param {File} imageFile - The image file to process
 * @param {File} requirementsFile - The requirements file (Excel/CSV)
 * @returns {Promise<Object>} - The complete pipeline results
 */
export const processTextPipeline = async (imageFile, requirementsFile) => {
  try {
    // Create form data for the pipeline request
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('requirements', requirementsFile);
    
    // Call the text pipeline API
    const response = await fetch(API_ENDPOINTS.TEXT_PIPELINE, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error in text pipeline! Status: ${response.status}`);
    }
    
    const pipelineData = await response.json();
    console.log('Text Pipeline API Response:', pipelineData);
    
    // Return the complete pipeline results
    return {
      detectionResults: pipelineData.detection_results || [],
      refinedText: pipelineData.refined_text || [],
      requirementCheck: pipelineData.requirement_check || {},
      parsedRequirements: pipelineData.parsed_requirements || {},
      visualizations: pipelineData.visualizations || {},
      // Add any additional data from the pipeline response
      refinedSymbols: pipelineData.refined_symbols || [],
      symbolCheck: pipelineData.symbol_check || []
    };
  } catch (error) {
    console.error('Error in processTextPipeline:', error);
    throw error;
  }
};

/**
 * Refine symbols and check against requirements
 * @param {string} imageBase64 - Base64 encoded image
 * @param {Array} detectionResults - Results from text detection
 * @param {Object} requirements - Requirements to check against
 * @returns {Promise<Object>} - The symbol refinement and check results
 */
export const refineSymbols = async (imageBase64, detectionResults, requirements) => {
  try {
    const response = await fetch(API_ENDPOINTS.SYMBOL_REFINEMENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageBase64,
        result: detectionResults,
        product_requirement: requirements
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error in symbol refinement! Status: ${response.status}`);
    }

    const refinedData = await response.json();
    console.log('Symbol Refinement API Response:', refinedData);
    
    return refinedData;
  } catch (error) {
    console.error('Error in refineSymbols:', error);
    throw error;
  }
};

/**
 * Verify requirements against detected text and symbols
 * @param {File} imageFile - The image file to process
 * @param {Object} ocrResults - Results from text detection
 * @param {Array} symbolResults - Results from symbol detection
 * @param {File} requirementsFile - The requirements file
 * @returns {Promise<Object>} - The verification results
 */
export const verifyRequirements = async (imageFile, ocrResults, symbolResults, requirementsFile) => {
  try {
    console.log('Attempting to verify requirements with:', {
      imageFileName: imageFile.name,
      ocrResultsCount: ocrResults.results?.length || 0,
      symbolResultsCount: symbolResults?.length || 0,
      requirementsFileName: requirementsFile.name
    });
    
    // Create form data for the verification request
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Prepare text results for sending
    const textResults = ocrResults.results || [];
    formData.append('text_results', JSON.stringify(textResults));
    
    // Prepare symbol results for sending
    formData.append('symbol_results', JSON.stringify(symbolResults));
    
    // Add requirements file
    formData.append('requirements', requirementsFile);
    
    // Call the verification API
    const response = await fetch(API_ENDPOINTS.VERIFY_REQUIREMENTS, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Verification API error:', errorText);
      throw new Error(`HTTP error in verification! Status: ${response.status}`);
    }
    
    const verificationData = await response.json();
    console.log('Verification API Response:', verificationData);
    
    return {
      textReqResults: verificationData.text_req_results || {},
      symbolReqResults: verificationData.symbol_req_results || {},
      parsedRequirements: verificationData.parsed_requirements || {}
    };
  } catch (error) {
    console.error('Error in verifyRequirements:', error);
    throw error;
  }
};

// Esta función ha sido reemplazada por la versión mejorada arriba
