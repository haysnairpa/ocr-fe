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
        
        // Find columns that may contain item/term information
        const itemColumns = columns.filter(col => 
          col.toLowerCase().includes('item') || 
          col.toLowerCase().includes('term') || 
          col.toLowerCase().includes('text')
        );
        
        // Find columns that may contain symbol information
        const symbolColumns = columns.filter(col => 
          col.toLowerCase().includes('symbol') || 
          col.toLowerCase().includes('icon') || 
          col.toLowerCase().includes('mark')
        );
        
        // Find columns that may contain description
        const descriptionColumns = columns.filter(col => 
          col.toLowerCase().includes('desc') || 
          col.toLowerCase().includes('requirement') || 
          col.toLowerCase().includes('rule')
        );
        
        // Find columns that may contain required information
        const requiredColumns = columns.filter(col => 
          col.toLowerCase().includes('required') || 
          col.toLowerCase().includes('mandatory')
        );
        
        // Find columns that may contain type information
        const typeColumns = columns.filter(col => 
          col.toLowerCase().includes('type') || 
          col.toLowerCase().includes('category')
        );
        
        // Process the data into the format expected by the backend
        const legalTerms = {
          required_texts: [],
          required_symbols: [],
          layout_requirements: []
        };
        
        jsonData.forEach((row, index) => {
          // Get values from detected columns
          const itemColumn = itemColumns.length > 0 ? itemColumns[0] : null;
          const symbolColumn = symbolColumns.length > 0 ? symbolColumns[0] : null;
          const descriptionColumn = descriptionColumns.length > 0 ? descriptionColumns[0] : null;
          const requiredColumn = requiredColumns.length > 0 ? requiredColumns[0] : null;
          const typeColumn = typeColumns.length > 0 ? typeColumns[0] : null;
          
          const item = itemColumn ? row[itemColumn] || '' : '';
          const symbol = symbolColumn ? row[symbolColumn] || '' : '';
          const description = descriptionColumn ? row[descriptionColumn] || '' : '';
          const required = requiredColumn ? 
            (row[requiredColumn] === 'false' || row[requiredColumn] === false ? false : true) : 
            true;
          const type = typeColumn ? (row[typeColumn] || '').toLowerCase() : '';
          
          // If there's a type column, use it to determine the item type
          if (type) {
            if (type.includes('text')) {
              legalTerms.required_texts.push({
                id: `text_${index}`,
                description: item || description,
                pattern: item || description,
                required: required
              });
            } else if (type.includes('symbol')) {
              legalTerms.required_symbols.push({
                id: `symbol_${index}`,
                description: item || description,
                class: (symbol || item || '').toLowerCase(),
                required: required
              });
            } else if (type.includes('layout')) {
              legalTerms.layout_requirements.push({
                id: `layout_${index}`,
                description: item || description,
                rule: item || description,
                required: required
              });
            }
          } else {
            // If no type column, try to determine type based on other columns
            if (symbol) {
              legalTerms.required_symbols.push({
                id: `symbol_${index}`,
                description: description || item,
                class: symbol.toLowerCase(),
                required: required
              });
            } else {
              legalTerms.required_texts.push({
                id: `text_${index}`,
                description: description || item,
                pattern: item,
                required: required
              });
            }
          }
        });
        
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
  
  // Validate required texts
  if (legalTerms.required_texts && legalTerms.required_texts.length > 0) {
    legalTerms.required_texts.forEach(requiredText => {
      const pattern = requiredText.pattern.toLowerCase();
      let found = false;
      
      // Check if the pattern exists in any of the OCR results
      if (ocrResults && ocrResults.results) {
        for (const result of ocrResults.results) {
          if (result.text && result.text.toLowerCase().includes(pattern)) {
            found = true;
            break;
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
      
      // Check if the symbol class exists in any of the symbol results
      if (symbolResults && symbolResults.symbols) {
        for (const symbol of symbolResults.symbols) {
          if (symbol.class && symbol.class.toLowerCase() === symbolClass) {
            found = true;
            break;
          }
        }
      }
      
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
