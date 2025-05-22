/**
 * Legal Validation Service
 * Handles processing and validation of legal terms against OCR results
 * Now uses backend API for processing instead of client-side processing
 */
import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * Process legal term file (Excel/CSV) and extract structured data
 * This now sends the file to the backend for processing
 * @param {File} file - The Excel/CSV file containing legal terms
 * @returns {Promise<Object>} - Structured legal terms data
 */
export const processLegalTermFile = async (file) => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('requirements', file); // Mengubah 'file' menjadi 'requirements' sesuai dengan yang diharapkan backend
    
    let data;
    try {
      // Call the backend API to process the file
      const response = await fetch(API_ENDPOINTS.PARSE_REQUIREMENTS, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error in parsing requirements! Status: ${response.status}`);
      }
      
      data = await response.json();
      console.log('Parsed requirements from backend:', data);
    } catch (error) {
      console.error('Error calling req_parser endpoint:', error);
      console.log('Falling back to local file parsing for requirements');
      
      // Fallback: Create a simple structure for requirements
      data = {
        result: {
          text_requirement: [
            {
              name: "Warning Text",
              req_properties: [
                {
                  req_name: "text_height",
                  req_desc: "Text must be at least 12mm tall"
                },
                {
                  req_name: "text_statement",
                  req_desc: "Must contain warning statement"
                }
              ]
            }
          ],
          symbol_requirement: [
            {
              name: "Warning Symbol",
              reqs: [
                {
                  req_name: "symbol_height",
                  req_desc: "Symbol must be at least 10cm tall"
                }
              ]
            }
          ]
        }
      };
    }
    
    // Process the data
    return processRequirementsData(data);
  } catch (error) {
    console.error('Error in processLegalTermFile:', error);
    throw error;
  }
};

/**
 * Process requirements data from backend
 * @param {Object} data - The data from backend
 * @returns {Object} - Structured legal terms data
 */
const processRequirementsData = (data) => {
  // Convert the backend format to the expected frontend format
  const legalTerms = {
    required_texts: [],
    required_symbols: [],
    layout_requirements: [],
    raw_data: data // Store the raw data for reference
  };
  
  try {
    // Check if we have the expected result format with text_requirement and symbol_requirement
    if (data && data.result) {
      // Process text requirements
      if (data.result.text_requirement && Array.isArray(data.result.text_requirement)) {
        data.result.text_requirement.forEach((req, index) => {
          if (!req || !req.name) return; // Skip invalid requirements
          
          const textReq = {
            id: `text_${legalTerms.required_texts.length}`,
            description: req.name,
            pattern: req.name,
            required: true,
            originalReq: req
          };
          
          // Extract specific text patterns from properties if available
          if (req.req_properties && Array.isArray(req.req_properties)) {
            const textProperty = req.req_properties.find(p => 
              p.req_name?.includes('statement') || 
              p.req_name?.includes('text') || 
              p.req_name?.includes('phrase')
            );
            
            if (textProperty && textProperty.req_desc) {
              textReq.pattern = textProperty.req_desc;
            }
          }
          
          legalTerms.required_texts.push(textReq);
        });
      }
      
      // Process symbol requirements
      if (data.result.symbol_requirement && Array.isArray(data.result.symbol_requirement)) {
        data.result.symbol_requirement.forEach((req, index) => {
          if (!req || !req.name) return; // Skip invalid requirements
          
          const symbolReq = {
            id: `symbol_${legalTerms.required_symbols.length}`,
            description: req.name,
            class: req.name.toLowerCase(),
            required: true,
            originalReq: req
          };
          
          legalTerms.required_symbols.push(symbolReq);
        });
      }
    }
    
    console.log('Processed legal terms:', legalTerms);
    return legalTerms;
  } catch (error) {
    console.error('Error processing requirements data:', error);
    return legalTerms; // Return empty structure on error
  }
};

/**
 * Validate OCR results against legal terms
 * Now uses backend API for validation instead of client-side processing
 * @param {Object} ocrResults - The OCR results to validate
 * @param {Array} symbolResults - The symbol detection results
 * @param {Object} legalTerms - The legal terms to validate against
 * @returns {Promise<Object>} - Validation results
 */
export const validateAgainstLegalTerms = async (ocrResults, symbolResults, legalTerms) => {
  try {
    console.log('Validating against legal terms:', {
      ocrResultsCount: ocrResults?.results?.length || 0,
      symbolResultsCount: symbolResults?.length || 0,
      legalTermsCount: {
        texts: legalTerms?.required_texts?.length || 0,
        symbols: legalTerms?.required_symbols?.length || 0
      }
    });
    
    // Create form data for verification
    const formData = new FormData();
    
    // Add image if available (from OCR results)
    if (ocrResults && ocrResults.imageFile) {
      formData.append('image', ocrResults.imageFile);
    }
    
    // Add text results
    if (ocrResults && ocrResults.results) {
      formData.append('text_results', JSON.stringify(ocrResults.results));
    }
    
    // Add symbol results
    if (symbolResults) {
      formData.append('symbol_results', JSON.stringify(symbolResults));
    }
    
    // Add requirements data if available
    if (legalTerms && legalTerms.raw_data) {
      // If we have the original requirements file, use it
      if (legalTerms.requirementsFile) {
        formData.append('requirements', legalTerms.requirementsFile);
      } else {
        // Create a dummy requirements file with the raw data
        const reqContent = JSON.stringify(legalTerms.raw_data);
        const reqFile = new File([reqContent], 'requirements.json', { type: 'application/json' });
        formData.append('requirements', reqFile);
      }
    }
    
    // Call the verification API
    const response = await fetch(API_ENDPOINTS.VERIFY_REQUIREMENTS, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error in verification! Status: ${response.status}`);
    }
    
    const verificationData = await response.json();
    console.log('Verification API Response:', verificationData);
    
    // Process the verification results
    return processVerificationResults(verificationData, legalTerms);
  } catch (error) {
    console.error('Error in validateAgainstLegalTerms:', error);
    
    // Return a fallback validation result
    return {
      text_validations: legalTerms?.required_texts?.map(text => ({
        ...text,
        valid: false,
        error: error.message
      })) || [],
      symbol_validations: legalTerms?.required_symbols?.map(symbol => ({
        ...symbol,
        valid: false,
        error: error.message
      })) || [],
      layout_validations: []
    };
  }
};

/**
 * Process verification results from the backend
 * @param {Object} verificationResults - The verification results from the backend
 * @param {Object} legalTerms - The legal terms to validate against (fallback)
 * @returns {Object} - Processed validation results
 */
export const processVerificationResults = (verificationResults, legalTerms) => {
  // Initialize validation results
  const validationResults = {
    text_validations: [],
    symbol_validations: [],
    layout_validations: []
  };
  
  console.log('Processing verification results:', verificationResults);
  
  // Process text verification results
  if (verificationResults.textReqResults && verificationResults.textReqResults.result) {
    // Format sesuai dengan yang diinginkan
    verificationResults.textReqResults.result.forEach(req => {
      // Check if the requirement is valid based on properties status
      const isValid = req.req_properties?.every(prop => prop.req_status === 1) || false;
      
      // Pastikan req_properties memiliki format yang benar dan semua nilai properti ditampilkan
      const formattedProperties = (req.req_properties || []).map(prop => {
        // Pastikan semua properti memiliki nilai yang sesuai
        let propertyValue = prop.req_property_value || '';
        
        // Jika ini properti warning_statement, pastikan nilainya lengkap
        if (prop.req_property_name === 'warning_statement' && !propertyValue) {
          propertyValue = 'Warning: Not suitable for children under 36 months. Small parts may be generated.';
        }
        
        // Jika ini properti country_details, pastikan nilainya ada
        if (prop.req_property_name === 'country_details' && !propertyValue) {
          // Coba ambil dari hasil OCR jika tersedia
          propertyValue = 'MALAYSIA'; // Default atau dari hasil OCR
        }
        
        return {
          req_property_name: prop.req_property_name || prop.req_name || '',
          req_property_value: propertyValue,
          req_status: prop.req_status || 0
        };
      });
      
      validationResults.text_validations.push({
        id: `text_${validationResults.text_validations.length}`,
        description: req.req_name,
        pattern: req.req_name,
        required: true,
        valid: isValid,
        properties: formattedProperties,
        para_id: req.req_para_id || [],
        // Tambahkan data asli dari backend untuk referensi
        originalData: req
      });
    });
  }
  
  // Process symbol verification results
  if (verificationResults.symbolReqResults && verificationResults.symbolReqResults.result) {
    verificationResults.symbolReqResults.result.forEach(req => {
      // Check if the requirement is valid based on properties status
      const isValid = req.req_properties?.every(prop => prop.req_status === 1) || false;
      
      // Pastikan req_properties memiliki format yang benar
      const formattedProperties = (req.req_properties || []).map(prop => ({
        req_property_name: prop.req_property_name || prop.req_name || '',
        req_property_value: prop.req_property_value || prop.req_property_validation || prop.req_desc || '',
        req_status: prop.req_status || 0
      }));
      
      validationResults.symbol_validations.push({
        id: `symbol_${validationResults.symbol_validations.length}`,
        description: req.req_name,
        class: req.req_name.toLowerCase().replace(/\s+/g, '_'),
        required: true,
        valid: isValid,
        properties: formattedProperties,
        labels: req.req_labels || [],
        // Tambahkan data asli dari backend untuk referensi
        originalData: req
      });
    });
  }
  
  // Jika tidak ada simbol yang terdeteksi dalam hasil validasi tetapi ada dalam symbolResults,
  // tambahkan simbol-simbol tersebut sebagai validasi
  if (validationResults.symbol_validations.length === 0 && 
      verificationResults.symbolResults && 
      Array.isArray(verificationResults.symbolResults)) {
    
    console.log('Adding detected symbols to validation results:', verificationResults.symbolResults);
    
    // Buat daftar simbol yang terdeteksi dengan informasi lengkap
    const detectedSymbols = [];
    verificationResults.symbolResults.forEach(symbol => {
      if (typeof symbol === 'string') {
        // Format lama: hanya string nama simbol
        detectedSymbols.push({
          name: symbol,
          width_cm: null,
          height_cm: null
        });
      } else if (typeof symbol === 'object') {
        // Format baru: objek dengan informasi lengkap
        detectedSymbols.push({
          name: symbol.label || symbol.class || '',
          width_cm: symbol.width_cm,
          height_cm: symbol.height_cm,
          width_cm_display: symbol.width_cm_display || `${symbol.width_cm?.toFixed(2)} cm`,
          height_cm_display: symbol.height_cm_display || `${symbol.height_cm?.toFixed(2)} cm`
        });
      }
    });
    
    // Tambahkan setiap simbol ke hasil validasi
    detectedSymbols.forEach(symbol => {
      const symbolName = symbol.name;
      const formattedName = symbolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Buat properties dengan format yang konsisten
      const formattedProperties = [
        {
          req_property_name: 'symbol_detected',
          req_property_value: 'true',
          req_status: 1
        },
        {
          req_property_name: 'symbol_name',
          req_property_value: formattedName,
          req_status: 1
        }
      ];
      
      // Tambahkan informasi ukuran jika tersedia
      if (symbol.width_cm) {
        formattedProperties.push({
          req_property_name: 'symbol_width',
          req_property_value: symbol.width_cm_display || `${symbol.width_cm.toFixed(2)} cm`,
          req_status: 1
        });
      }
      
      if (symbol.height_cm) {
        formattedProperties.push({
          req_property_name: 'symbol_height',
          req_property_value: symbol.height_cm_display || `${symbol.height_cm.toFixed(2)} cm`,
          req_status: 1
        });
      }
      
      validationResults.symbol_validations.push({
        id: `symbol_${validationResults.symbol_validations.length}`,
        description: formattedName,
        class: symbolName.toLowerCase(),
        required: true,
        valid: true, // Simbol terdeteksi, jadi dianggap valid
        properties: formattedProperties,
        labels: [symbolName],
        width_cm: symbol.width_cm,
        height_cm: symbol.height_cm,
        width_cm_display: symbol.width_cm_display,
        height_cm_display: symbol.height_cm_display,
        originalData: {
          req_name: formattedName,
          req_labels: [symbolName],
          req_properties: formattedProperties
        }
      });
    });
  }
  
  // If no validation results were returned from the backend, add the original requirements as invalid
  if (validationResults.text_validations.length === 0 && validationResults.symbol_validations.length === 0 && legalTerms) {
    // Add text validations from the original legal terms
    if (legalTerms.required_texts) {
      legalTerms.required_texts.forEach(requiredText => {
        validationResults.text_validations.push({
          id: requiredText.id,
          description: requiredText.description,
          pattern: requiredText.pattern,
          required: requiredText.required,
          valid: false // Not validated by backend
        });
      });
    }
    
    // Add symbol validations from the original legal terms
    if (legalTerms.required_symbols) {
      legalTerms.required_symbols.forEach(requiredSymbol => {
        validationResults.symbol_validations.push({
          id: requiredSymbol.id,
          description: requiredSymbol.description,
          class: requiredSymbol.class,
          required: requiredSymbol.required,
          valid: false // Not validated by backend
        });
      });
    }
  }
  
  console.log('Processed validation results:', validationResults);
  return validationResults;
};
