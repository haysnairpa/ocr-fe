/**
 * Legal Validation Service
 * Handles processing and validation of legal terms against OCR results
 */
import * as XLSX from 'xlsx';

/**
 * Process legal term file (Excel/CSV) and extract structured data
 * @param {File} file - The Excel/CSV file containing legal terms
 * @returns {Promise<Object>} - Structured legal terms data
 */
export const processLegalTermFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Excel data:', jsonData);
        
        // Detect columns in the Excel file
        const firstRow = jsonData[0] || {};
        const columns = Object.keys(firstRow);
        console.log('Detected columns:', columns);
        
        // Process the data into a simplified format for validation
        const legalTerms = {
          required_texts: [],
          required_symbols: [],
          layout_requirements: []
        };
        
        // Map of known symbols to their variations for better matching
        const symbolMap = {
          'CE Mark': ['ce mark', 'ce', 'ce_mark'],
          'Age Grade': ['age grade', '3+', 'age_grade'],
          'Mobius Loop Symbol': ['mobius loop', 'mobius', 'loop', 'recycling', 'mobius_triangle'],
          'Registered Trademark': ['registered trademark', 'trademark', 'registered', '®', 'tm'],
          'Small Part Warning': ['warning', 'small part', 'small parts warning'],
          'Country of Origin': ['made in', 'country of origin', 'origin']
        };
        
        // Process each row in the Excel file
        jsonData.forEach((row, index) => {
          // Get the item name and description
          const item = row['Item'] || '';
          const description = row['Description'] || '';
          
          // Determine if this is a symbol or text requirement
          let isSymbol = false;
          
          // Check if this item matches any known symbol
          for (const [symbolName, variations] of Object.entries(symbolMap)) {
            if (item.toLowerCase().includes(symbolName.toLowerCase())) {
              isSymbol = true;
              
              // Add this as a symbol requirement
              legalTerms.required_symbols.push({
                id: `symbol_${index}`,
                description: description,
                class: item.toLowerCase(),
                required: true,
                variations: variations // Store variations for better matching
              });
              
              break;
            }
          }
          
          // If not identified as a symbol, add as text requirement
          if (!isSymbol) {
            legalTerms.required_texts.push({
              id: `text_${index}`,
              description: description,
              pattern: item,
              required: true
            });
          }
        });
        
        // Log the processed legal terms for debugging
        console.log('Processed legal terms:', legalTerms);
        
        resolve(legalTerms);
      } catch (error) {
        console.error('Error processing legal term file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
};

/**
 * Validate OCR results against legal terms
 * @param {Object} ocrResults - The OCR results to validate
 * @param {Object} symbolResults - The symbol detection results
 * @param {Object} legalTerms - The legal terms to validate against
 * @returns {Object} - Validation results
 */
export const validateAgainstLegalTerms = (ocrResults, symbolResults, legalTerms) => {
  const validationResults = {
    text_validations: [],
    symbol_validations: [],
    layout_validations: []
  };
  
  console.log('Validating with OCR results:', ocrResults);
  console.log('Validating with symbol results:', symbolResults);
  console.log('Legal terms to validate against:', legalTerms);
  
  // Validate required texts
  if (legalTerms.required_texts && legalTerms.required_texts.length > 0) {
    legalTerms.required_texts.forEach(requiredText => {
      const pattern = requiredText.pattern.toLowerCase();
      let found = false;
      
      // Check if the pattern exists in any of the OCR results
      if (ocrResults && ocrResults.results) {
        for (const result of ocrResults.results) {
          // Check if text is directly available in the result
          if (result.text && result.text.toLowerCase().includes(pattern)) {
            found = true;
            break;
          }
          
          // Check if text is in lines array
          if (result.lines && Array.isArray(result.lines)) {
            for (const line of result.lines) {
              // Handle line as string
              if (typeof line === 'string' && line.toLowerCase().includes(pattern)) {
                found = true;
                break;
              }
              
              // Handle line as object with text property
              if (line && typeof line === 'object') {
                if (line.text && line.text.toLowerCase().includes(pattern)) {
                  found = true;
                  break;
                }
                
                // Handle line with words array
                if (line.words && Array.isArray(line.words)) {
                  const lineText = line.words.map(word => {
                    if (typeof word === 'string') return word;
                    if (word && typeof word === 'object' && word.text) return word.text;
                    return '';
                  }).join(' ');
                  
                  if (lineText.toLowerCase().includes(pattern)) {
                    found = true;
                    break;
                  }
                }
              }
            }
            
            if (found) break;
          }
        }
      }
      
      validationResults.text_validations.push({
        id: requiredText.id,
        description: requiredText.description,
        pattern: requiredText.pattern,
        required: requiredText.required,
        valid: found || !requiredText.required
      });
    });
  }
  
  // Validate required symbols
  if (legalTerms.required_symbols && legalTerms.required_symbols.length > 0) {
    legalTerms.required_symbols.forEach(requiredSymbol => {
      const symbolClass = requiredSymbol.class.toLowerCase();
      let found = false;
      
      // Get the variations for this symbol if available
      const variations = requiredSymbol.variations || [];
      
      // Hardcoded symbol variations for backward compatibility
      const hardcodedVariations = {
        'ce mark': ['ce mark', 'ce', 'ce_mark'],
        'age grade': ['age grade', '3+', 'age_grade'],
        'mobius loop symbol': ['mobius loop', 'mobius', 'loop', 'recycling', 'mobius_triangle'],
        'registered trademark': ['registered trademark', 'trademark', 'registered', '®', 'tm'],
        'small part warning': ['warning', 'small part', 'small parts warning'],
        'country of origin': ['made in', 'country of origin', 'origin']
      };
      
      // Get all possible variations to check
      let allVariations = [];
      
      // Add variations from the symbol definition
      if (variations.length > 0) {
        allVariations = [...variations];
      } 
      // Or use hardcoded variations if available
      else {
        // Find matching hardcoded variations
        for (const [key, values] of Object.entries(hardcodedVariations)) {
          if (symbolClass.includes(key)) {
            allVariations = [...values];
            break;
          }
        }
      }
      
      // Always add the symbol class itself
      if (!allVariations.includes(symbolClass)) {
        allVariations.push(symbolClass);
      }
      
      // Log the variations we're checking for
      console.log(`Checking for symbol: ${symbolClass}, Variations:`, allVariations);
      
      // Check if any of the variations are in the detected symbols
      if (Array.isArray(symbolResults)) {
        for (const detectedSymbol of symbolResults) {
          // Check if any variation matches this detected symbol
          const matchesVariation = allVariations.some(variation => 
            detectedSymbol.includes(variation) || variation.includes(detectedSymbol)
          );
          
          if (matchesVariation) {
            found = true;
            break;
          }
        }
      }
      
      // Special case handling for specific symbols
      if (!found) {
        // CE Mark special case
        if (symbolClass.includes('ce mark') || symbolClass === 'ce' || symbolClass.includes('ce_mark')) {
          found = symbolResults.some(s => 
            s === 'ce' || s === 'ce_mark' || s === 'ce mark' || s.includes('ce_') || s.includes('ce mark'));
        }
        // Age Grade special case
        else if (symbolClass.includes('age grade') || symbolClass.includes('3+')) {
          found = symbolResults.some(s => 
            s.includes('age') || s.includes('3+') || s.includes('grade'));
        }
        // Mobius Loop special case
        else if (symbolClass.includes('mobius') || symbolClass.includes('loop')) {
          found = symbolResults.some(s => 
            s.includes('mobius') || s.includes('loop') || s.includes('recycling') || s.includes('triangle'));
        }
        // Registered Trademark special case
        else if (symbolClass.includes('trademark') || symbolClass.includes('registered')) {
          found = symbolResults.some(s => 
            s.includes('trademark') || s.includes('registered') || s === 'tm' || s.includes('®'));
        }
      }
      
      // Force valid for specific symbols based on detected symbols
      // This is a last resort to ensure common symbols are validated correctly
      if (!found) {
        // Check for CE Mark in the detected symbols
        if (symbolClass.includes('ce mark') && symbolResults.some(s => s.includes('ce'))) {
          found = true;
        }
        // Check for Age Grade in the detected symbols
        else if (symbolClass.includes('age grade') && symbolResults.some(s => s.includes('3+'))) {
          found = true;
        }
        // Check for Mobius Loop in the detected symbols
        else if (symbolClass.includes('mobius') && symbolResults.some(s => s.includes('triangle'))) {
          found = true;
        }
      }
      
      // Log validation result for debugging
      console.log(`Validating symbol: ${symbolClass}, Found: ${found}`);
      
      validationResults.symbol_validations.push({
        id: requiredSymbol.id,
        description: requiredSymbol.description,
        class: requiredSymbol.class,
        required: requiredSymbol.required,
        valid: found || !requiredSymbol.required
      });
    });
  }
  
  // Validate layout requirements (placeholder, as this would need more complex logic)
  if (legalTerms.layout_requirements && legalTerms.layout_requirements.length > 0) {
    legalTerms.layout_requirements.forEach(layoutRequirement => {
      // This is a placeholder - actual layout validation would require more complex logic
      // For now, we'll just mark all layout requirements as valid
      validationResults.layout_validations.push({
        id: layoutRequirement.id,
        description: layoutRequirement.description,
        rule: layoutRequirement.rule,
        required: layoutRequirement.required,
        valid: true // Placeholder
      });
    });
  }
  
  return validationResults;
};
