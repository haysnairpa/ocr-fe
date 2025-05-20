/**
 * API Configuration
 * 
 * This file contains all API endpoint configurations.
 * Using proxy to avoid CORS issues.
 */

// Original API URLs (for reference only)
// export const TEXT_API_URL = 'https://9898-34-142-207-12.ngrok-free.app'; // Text detection backend
// export const SYMBOL_API_URL = 'https://e966-34-16-201-30.ngrok-free.app'; // Symbol detection backend

// Proxy API URLs (using Vite's proxy configuration)
export const TEXT_API_URL = '/api/text'; // Text detection backend via proxy
export const SYMBOL_API_URL = '/api/symbol'; // Symbol detection backend via proxy

// API Endpoints
export const API_ENDPOINTS = {
  // Text detection endpoints
  TEXT_DETECTION: `${TEXT_API_URL}/detect`,
  TEXT_REFINEMENT: `${TEXT_API_URL}/refine`,
  
  // Symbol detection endpoints
  SYMBOL_DETECTION: `${SYMBOL_API_URL}/detect_symbols`,
  SYMBOL_REFINEMENT: `${TEXT_API_URL}/refine_symbols`,
  
  // Requirements endpoints
  UPLOAD_REQUIREMENTS: `${TEXT_API_URL}/upload_requirements`,
  VALIDATE_PRODUCT: `${TEXT_API_URL}/validate_product`,
  
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
