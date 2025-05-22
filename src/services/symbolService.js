/**
 * Symbol Detection API Service
 * Handles all interactions with the Symbol Detection API
 */

import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * Process symbol detection from an image using YOLOv8 model
 * @param {File} imageFile - The image file to process
 * @returns {Promise<Object>} - The processed symbol detection results
 */
export const detectSymbols = async (imageFile) => {
  try {
    console.log('Attempting to detect symbols from image:', imageFile.name);
    
    // Create form data for symbol detection
    const symbolFormData = new FormData();
    symbolFormData.append('image', imageFile);
    
    // Call symbol detection API (YOLOv8 backend)
    const symbolResponse = await fetch(API_ENDPOINTS.SYMBOL_DETECTION, {
      method: 'POST',
      body: symbolFormData,
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!symbolResponse.ok) {
      const errorText = await symbolResponse.text();
      console.error('Symbol detection API error:', errorText);
      throw new Error(`HTTP error in symbol detection! Status: ${symbolResponse.status}`);
    }
    
    const symbolData = await symbolResponse.json();
    console.log('Symbol Detection API Response:', symbolData);
    
    // Process symbol results from the updated YOLOv8 model response format
    // The new format has a "labels" array with objects containing label, confidence, x, y, width, height
    const imageShape = symbolData.image_shape || { width: 0, height: 0, width_cm: 0, height_cm: 0 };
    
    console.log('Image shape from backend:', imageShape);
    
    const processedSymbols = symbolData.labels?.map(label => {
      // Backend mengirimkan ukuran gambar keseluruhan dalam cm, bukan ukuran simbol
      // Kita perlu menghitung ukuran simbol dalam cm berdasarkan proporsinya terhadap ukuran gambar
      let symbolWidthCm, symbolHeightCm;
      
      // Hitung ukuran simbol dalam cm berdasarkan proporsi terhadap ukuran gambar
      symbolWidthCm = (label.width / imageShape.width) * imageShape.width_cm;
      symbolHeightCm = (label.height / imageShape.height) * imageShape.height_cm;
      
      // Log untuk debugging
      console.log(`Symbol ${label.label} dimensions:`, {
        width_px: label.width,
        height_px: label.height,
        image_width_px: imageShape.width,
        image_height_px: imageShape.height,
        image_width_cm: imageShape.width_cm,
        image_height_cm: imageShape.height_cm,
        calculated_width_cm: symbolWidthCm,
        calculated_height_cm: symbolHeightCm
      });
      
      // Pastikan nilai tidak NaN atau undefined
      symbolWidthCm = isNaN(symbolWidthCm) ? 0 : symbolWidthCm;
      symbolHeightCm = isNaN(symbolHeightCm) ? 0 : symbolHeightCm;
      
      const result = {
        id: Math.random().toString(36).substr(2, 9),
        class: label.label?.toLowerCase(), // Ensure class name is lowercase for consistency
        xmin: label.x,
        ymin: label.y,
        xmax: label.x + label.width,
        ymax: label.y + label.height,
        width: label.width,
        height: label.height,
        // Tambahkan ukuran dalam cm dengan 2 angka di belakang koma
        width_cm: parseFloat(symbolWidthCm.toFixed(2)),
        height_cm: parseFloat(symbolHeightCm.toFixed(2)),
        // Format string untuk tampilan
        width_cm_display: `${symbolWidthCm.toFixed(2)} cm`,
        height_cm_display: `${symbolHeightCm.toFixed(2)} cm`,
        label: label.label,
        confidence: label.confidence // Now includes confidence from the backend
      };
      
      console.log(`Processed symbol ${label.label}:`, result);
      return result;
    }) || [];
    
    return {
      symbols: processedSymbols,
      visualization: symbolData.visualization || '', // Now includes visualization data from backend
      imageShape: imageShape
    };
  } catch (error) {
    console.error('Error in detectSymbols:', error);
    throw error;
  }
};

/**
 * Process symbol detection with LLM refinement
 * This uses both the text detection API and the symbol refinement API
 * @param {File} imageFile - The image file to process
 * @returns {Promise<Object>} - The processed symbol detection results with refinement
 */
export const detectSymbolsWithRefinement = async (imageFile) => {
  try {
    // First, use the text detection API to get the text regions
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
    console.log('Text Detection API Response for symbols:', textData);
    
    // Convert the image to base64 for the refinement API
    const reader = new FileReader();
    const imageBase64Promise = new Promise((resolve, reject) => {
      reader.onload = () => {
        // Extract the base64 part (remove the data:image/jpeg;base64, prefix)
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
    
    const imageBase64 = await imageBase64Promise;
    
    // Now use the refinement API to get symbol information
    const refinementResponse = await fetch(API_ENDPOINTS.SYMBOL_REFINEMENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageBase64,
        result: textData.results,
        product_requirement: {} // Empty object as default
      })
    });
    
    if (!refinementResponse.ok) {
      throw new Error(`HTTP error in symbol refinement! Status: ${refinementResponse.status}`);
    }
    
    const refinementData = await refinementResponse.json();
    console.log('Symbol Refinement API Response:', refinementData);
    
    // Extract symbols from predictions
    const symbols = refinementData.predictions?.map((prediction, index) => ({
      id: index,
      item: prediction.item,
      layout_status: prediction.layout_requirement,
      statement_status: prediction.statement_requirement,
      class: prediction.item?.toLowerCase() // Ensure class name is lowercase for consistency
    })) || [];
    
    // Use the paragraph visualization from text detection
    const visualization = textData.visualizations?.para_image || '';
    
    return {
      symbols,
      visualization,
      refinedText: refinementData.refined_text || [],
      predictions: refinementData.predictions || []
    };
  } catch (error) {
    console.error('Error in detectSymbolsWithRefinement:', error);
    throw error;
  }
};

/**
 * Upload requirements file for symbol validation
 * @param {File} requirementsFile - The requirements file (Excel or CSV)
 * @returns {Promise<Object>} - The parsed requirements data
 */
export const uploadRequirements = async (requirementsFile) => {
  try {
    const formData = new FormData();
    formData.append('file', requirementsFile);
    
    const response = await fetch(API_ENDPOINTS.UPLOAD_REQUIREMENTS, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error in uploading requirements! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Requirements upload response:', data);
    
    return data;
  } catch (error) {
    console.error('Error in uploadRequirements:', error);
    throw error;
  }
};

/**
 * Validate product against requirements
 * @param {File} imageFile - The product image file
 * @param {File} requirementsFile - The requirements file
 * @returns {Promise<Object>} - The validation results
 */
export const validateProduct = async (imageFile, requirementsFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('requirements', requirementsFile);
    
    const response = await fetch(API_ENDPOINTS.VALIDATE_PRODUCT, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error in product validation! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Product validation response:', data);
    
    return data;
  } catch (error) {
    console.error('Error in validateProduct:', error);
    throw error;
  }
};
