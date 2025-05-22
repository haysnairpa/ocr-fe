/**
 * API Configuration
 * 
 * This file contains all API endpoint configurations.
 * Using proxy to avoid CORS issues.
 */

// Direct API URLs (for reference)
// export const TEXT_API_URL = 'https://66ce-34-16-148-119.ngrok-free.app'; // Text detection backend
// export const SYMBOL_API_URL = 'https://eb39-35-243-181-247.ngrok-free.app'; // Symbol detection backend

// Proxy API URLs (using Vite's proxy configuration)
export const TEXT_API_URL = '/api/text'; // Text detection backend via proxy
export const SYMBOL_API_URL = '/api/symbol'; // Symbol detection backend via proxy

// API Endpoints
/**
 * API_ENDPOINTS provides a centralized configuration of all API endpoints for the
 * application. These endpoints are categorized based on their functionality and
 * are designed to work with both text and symbol detection backends.
 *
 * - Text detection endpoints:
 *   - TEXT_DETECTION: Endpoint for detecting text in images.
 *   - TEXT_REFINEMENT: Endpoint for refining detected text using LLM.
 *
 * - Symbol detection endpoints:
 *   - SYMBOL_DETECTION: Endpoint for detecting symbols in images.
 *   - SYMBOL_REFINEMENT: Endpoint for refining detected symbols using LLM.
 *
 * - Requirements endpoints:
 *   - UPLOAD_REQUIREMENTS: Endpoint for uploading requirements files.
 *   - VALIDATE_PRODUCT: Endpoint for product validation against requirements.
 *   - PARSE_REQUIREMENTS: Endpoint for parsing requirement files.
 *   - CHECK_TEXT_REQUIREMENTS: Endpoint for checking text against requirements.
 *   - TEXT_PIPELINE: Endpoint for processing the complete text pipeline.
 *   - VERIFY_REQUIREMENTS: Endpoint for verifying requirements.
 *
 * - Status endpoints:
 *   - TEXT_STATUS: Endpoint for checking the status of the text detection backend.
 *   - SYMBOL_STATUS: Endpoint for checking the status of the symbol detection backend.
 */
export const API_ENDPOINTS = {
  // Text detection endpoints - using predict_pipeline since there's no dedicated text detection endpoint
  TEXT_DETECTION: `${TEXT_API_URL}/predict_pipeline`,
  TEXT_REFINEMENT: `${TEXT_API_URL}/refine_texts`,
  
  // Symbol detection endpoints
  SYMBOL_DETECTION: `${SYMBOL_API_URL}/detect_symbols`,
  SYMBOL_REFINEMENT: `${TEXT_API_URL}/refine_symbols`,
  
  // Requirements endpoints
  UPLOAD_REQUIREMENTS: `${TEXT_API_URL}/upload_requirements`,
  VALIDATE_PRODUCT: `${TEXT_API_URL}/validate_product`,
  PARSE_REQUIREMENTS: `${TEXT_API_URL}/req_parser`,
  CHECK_TEXT_REQUIREMENTS: `${TEXT_API_URL}/check_text_requirement`,
  TEXT_PIPELINE: `${TEXT_API_URL}/predict_pipeline`,
  VERIFY_REQUIREMENTS: `${TEXT_API_URL}/verify_requirements`,
  
  // Status endpoints
  TEXT_STATUS: `${TEXT_API_URL}/status`,
  SYMBOL_STATUS: `${SYMBOL_API_URL}/status`
};

/**
 * Update the text API URL
 * @param {string} newUrl - The new base URL for the text API
 */
export const updateTextApiUrl = (newUrl) => {
  // This is just for runtime updates - you'll still need to modify the constant above for persistence
  Object.keys(API_ENDPOINTS).forEach(key => {
    if (API_ENDPOINTS[key].startsWith(TEXT_API_URL)) {
      API_ENDPOINTS[key] = API_ENDPOINTS[key].replace(TEXT_API_URL, newUrl);
    }
  });
};

/**
 * Update the symbol API URL
 * @param {string} newUrl - The new base URL for the symbol API
 */
export const updateSymbolApiUrl = (newUrl) => {
  // This is just for runtime updates - you'll still need to modify the constant above for persistence
  Object.keys(API_ENDPOINTS).forEach(key => {
    if (API_ENDPOINTS[key].startsWith(SYMBOL_API_URL)) {
      API_ENDPOINTS[key] = API_ENDPOINTS[key].replace(SYMBOL_API_URL, newUrl);
    }
  });
};
