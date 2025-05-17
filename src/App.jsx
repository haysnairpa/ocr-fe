import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

function App() {
  // State variables
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [visualizations, setVisualizations] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isRefining, setIsRefining] = useState(false);
  const [refinedResults, setRefinedResults] = useState(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState(null);
  const [symbolResults, setSymbolResults] = useState(null);
  const [symbolVisualization, setSymbolVisualization] = useState(null);
  const [activeTab, setActiveTab] = useState('text'); // 'text', 'symbol', or 'legal'
  
  // Legal term validation states
  const [legalTermFile, setLegalTermFile] = useState(null);
  const [isLegalTermUploaded, setIsLegalTermUploaded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null);

  // References
  const imageRef = useRef(null);

  // Effect to update image dimensions when image loads
  useEffect(() => {
    if (previewUrl && imageRef.current) {
      const updateDimensions = () => {
        setImageDimensions({
          width: imageRef.current.naturalWidth,
          height: imageRef.current.naturalHeight,
          displayWidth: imageRef.current.clientWidth,
          displayHeight: imageRef.current.clientHeight
        });
      };

      // Set initial dimensions
      if (imageRef.current.complete) {
        updateDimensions();
      }

      // Update dimensions when image loads
      imageRef.current.addEventListener('load', updateDimensions);

      // Create a resize observer to update dimensions when container resizes
      const resizeObserver = new ResizeObserver(() => {
        if (imageRef.current) {
          updateDimensions();
        }
      });

      if (imageRef.current) {
        resizeObserver.observe(imageRef.current);
      }

      return () => {
        if (imageRef.current) {
          imageRef.current.removeEventListener('load', updateDimensions);
          resizeObserver.disconnect();
        }
      };
    }
  }, [previewUrl]);

  // Handle image file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    // Reset states
    setError(null);
    setResults(null);
    setVisualizations(null);
    setRefinedResults(null);
    setValidationResults(null);

    // Validate file type
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size <= 5 * 1024 * 1024) {
        setSelectedFile(file);

        // Create preview URL
        const fileReader = new FileReader();
        fileReader.onload = () => {
          setPreviewUrl(fileReader.result);
          // Store base64 for refinement API
          setSelectedFileBase64(fileReader.result.split(',')[1]);
        };
        fileReader.readAsDataURL(file);
      } else {
        setSelectedFile(null);
        setPreviewUrl(null);
        setError('File size exceeds the limit of 5MB');
      }
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError('Please select a valid image file (JPEG or PNG)');
    }
  };
  
  // Handle legal term file selection
  const handleLegalTermFileChange = (event) => {
    const file = event.target.files[0];
    
    // Reset validation results
    setValidationResults(null);
    
    // Validate file type
    if (file && (file.type === 'application/vnd.ms-excel' || 
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                file.type === 'text/csv')) {
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size <= 5 * 1024 * 1024) {
        setLegalTermFile(file);
        setIsLegalTermUploaded(true);
      } else {
        setLegalTermFile(null);
        setIsLegalTermUploaded(false);
        setError('Legal term file size exceeds the limit of 5MB');
      }
    } else {
      setLegalTermFile(null);
      setIsLegalTermUploaded(false);
      setError('Please select a valid legal term file (CSV or XLSX)');
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setVisualizations(null);
    setRefinedResults(null);
    setSymbolResults(null);
    setSymbolVisualization(null);
    setValidationResults(null);

    try {
      // Create form data for text detection
      const textFormData = new FormData();
      textFormData.append('image', selectedFile);

      // Call text detection API
      const textResponse = await fetch('https://2067-34-169-69-145.ngrok-free.app/detect', {
        method: 'POST',
        body: textFormData,
      });

      if (!textResponse.ok) {
        throw new Error(`HTTP error in text detection! Status: ${textResponse.status}`);
      }

      const textData = await textResponse.json();
      
      // Debug logs to see the API response structure
      console.log('Text Detection API Response:', textData);
      console.log('Results structure:', textData.results);
      if (textData.results && textData.results.length > 0) {
        console.log('First result item:', textData.results[0]);
      }
      
      // Create form data for symbol detection
      const symbolFormData = new FormData();
      symbolFormData.append('image', selectedFile);
      
      // Call symbol detection API
      const symbolResponse = await fetch('https://a474-35-196-100-241.ngrok-free.app/detect_symbols', {
        method: 'POST',
        body: symbolFormData,
      });
      
      if (!symbolResponse.ok) {
        throw new Error(`HTTP error in symbol detection! Status: ${symbolResponse.status}`);
      }
      
      const symbolData = await symbolResponse.json();

      // Process and display results
      console.log('API Response:', textData);
      
      // After analyzing your Google Colab implementation and the API response structure,
      // we need to make sure we're correctly extracting the text from the API response
      
      // Check if the API response is valid
      if (!textData || !textData.results) {
        console.error('Invalid API response structure:', textData);
        setResults({ results: [] });
        return;
      }
      
      // Create a new results array with the text extracted correctly
      const extractedResults = [];
      
      // Process each result to extract text
      textData.results.forEach((result, index) => {
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
        extractedResults.push({
          ...result,
          text: extractedText
        });
      });
      
      // Create the final processed results object
      const processedResults = {
        ...textData,
        results: extractedResults
      };
      
      // Set the results with the processed data
      setResults(processedResults);
      
      // Pastikan data simbol diproses dengan benar
      const processedSymbols = symbolData.symbols?.map(symbol => ({
        ...symbol,
        class: symbol.class?.toLowerCase() // Pastikan class name lowercase untuk konsistensi
      })) || [];
      
      console.log('Processed symbol results:', processedSymbols);
      setSymbolResults(processedSymbols);
      
      // Combine visualizations
      setVisualizations({
        word_image: textData.visualizations?.word_image || '',
        line_image: textData.visualizations?.line_image || '',
        para_image: textData.visualizations?.para_image || ''
      });
      setSymbolVisualization(symbolData.visualization);
      
      // If legal term file is uploaded, automatically validate against it
      if (isLegalTermUploaded && legalTermFile) {
        await validateAgainstLegalTerms();
      }

    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while processing the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to process legal term file
  const processLegalTermFile = async (file) => {
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
          
          // Deteksi kolom-kolom yang ada di file Excel
          const firstRow = jsonData[0] || {};
          const columns = Object.keys(firstRow);
          console.log('Detected columns:', columns);
          
          // Cari kolom yang mungkin berisi informasi item/term
          const itemColumns = columns.filter(col => 
            col.toLowerCase().includes('item') || 
            col.toLowerCase().includes('term') || 
            col.toLowerCase().includes('text')
          );
          
          // Cari kolom yang mungkin berisi informasi simbol
          const symbolColumns = columns.filter(col => 
            col.toLowerCase().includes('symbol') || 
            col.toLowerCase().includes('icon') || 
            col.toLowerCase().includes('mark')
          );
          
          // Cari kolom yang mungkin berisi deskripsi
          const descriptionColumns = columns.filter(col => 
            col.toLowerCase().includes('desc') || 
            col.toLowerCase().includes('requirement') || 
            col.toLowerCase().includes('rule')
          );
          
          // Cari kolom yang mungkin berisi informasi required
          const requiredColumns = columns.filter(col => 
            col.toLowerCase().includes('required') || 
            col.toLowerCase().includes('mandatory')
          );
          
          // Cari kolom yang mungkin berisi informasi tipe
          const typeColumns = columns.filter(col => 
            col.toLowerCase().includes('type') || 
            col.toLowerCase().includes('category')
          );
          
          console.log('Item columns:', itemColumns);
          console.log('Symbol columns:', symbolColumns);
          console.log('Description columns:', descriptionColumns);
          console.log('Required columns:', requiredColumns);
          console.log('Type columns:', typeColumns);
          
          // Process the data into the format expected by the backend
          const legalTerms = {
            required_texts: [],
            required_symbols: [],
            layout_requirements: []
          };
          
          jsonData.forEach((row, index) => {
            // Ambil nilai dari kolom yang terdeteksi
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
            
            // Jika ada kolom tipe, gunakan itu untuk menentukan jenis item
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
                  description: description || item,
                  element_id: row.element_id || '',
                  rule: row.rule || 'position',
                  parameters: row.parameters || '{}'
                });
              }
            } else {
              // Jika tidak ada kolom tipe, coba deteksi berdasarkan konten
              
              // Jika ada simbol, anggap sebagai persyaratan simbol
              if (symbol && symbol !== '#UNKNOWN' && symbol !== 'undefined' && symbol !== 'null') {
                legalTerms.required_symbols.push({
                  id: `symbol_${index}`,
                  description: item || description,
                  class: (symbol || item || '').toLowerCase(),
                  required: required
                });
                
                // Tambahkan juga layout requirement jika ada
                if (description && (description.includes('must be') || description.includes('should be'))) {
                  legalTerms.layout_requirements.push({
                    id: `layout_symbol_${index}`,
                    description: description,
                    element_id: `symbol_${index}`,
                    rule: 'position',
                    parameters: '{}'
                  });
                }
              } 
              // Jika tidak ada simbol tapi ada item/deskripsi, anggap sebagai persyaratan teks
              else if (item || description) {
                // Deteksi berdasarkan konten item
                const isTextRequirement = 
                  (item && (item.includes('Warning') || 
                          item.includes('Trademark') || 
                          item.includes('Country') || 
                          item.includes('Origin') || 
                          item.includes('Age') || 
                          item.includes('Grade'))) ||
                  (description && (description.includes('text') || 
                                  description.includes('statement') || 
                                  description.includes('warning')));
                
                if (isTextRequirement) {
                  legalTerms.required_texts.push({
                    id: `text_${index}`,
                    description: item || description,
                    pattern: item || description,
                    required: required
                  });
                  
                  // Tambahkan juga layout requirement jika ada
                  if (description && (description.includes('must be') || description.includes('should be'))) {
                    legalTerms.layout_requirements.push({
                      id: `layout_${index}`,
                      description: description,
                      element_id: `text_${index}`,
                      rule: 'position',
                      parameters: '{}'
                    });
                  }
                }
              }
            }
          });
          
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
      
      // Read the file as binary string
      reader.readAsBinaryString(file);
    });
  };
  
  // Function to validate against legal terms
  const validateAgainstLegalTerms = async () => {
    if (!legalTermFile) {
      setError('Please upload a legal term file first');
      return;
    }
    
    // Periksa apakah ada hasil deteksi
    const hasTextResults = Array.isArray(results) && results.length > 0;
    const hasSymbolResults = Array.isArray(symbolResults) && symbolResults.length > 0;
    
    if (!hasTextResults && !hasSymbolResults) {
      setError('No detection results available. Please detect text and symbols first.');
      return;
    }
    
    setIsValidating(true);
    setError(null);
    setValidationResults(null);
    
    // Log data yang akan digunakan untuk validasi
    console.log('Text detection results for validation:', results);
    console.log('Symbol detection results for validation:', symbolResults);
    
    try {
      // Proses file legal term
      const legalTerms = await processLegalTermFile(legalTermFile);
      console.log('Processed legal terms:', legalTerms);
      
      // Pastikan data simbol diproses dengan benar
      // Ini penting untuk memastikan bahwa data simbol digunakan dengan benar dalam validasi
      const processedSymbols = symbolResults.map(symbol => ({
        ...symbol,
        class: symbol.class?.toLowerCase() || '' // Pastikan class name lowercase untuk konsistensi
      }));
      
      console.log('Processed symbols for validation:', processedSymbols);
      
      // Coba validasi di backend terlebih dahulu
      let validationData = null;
      let useLocalValidation = true; // Selalu gunakan validasi lokal untuk sementara
      
      if (!useLocalValidation) {
        try {
          // Call validation API using the /validate endpoint
          const response = await fetch('https://2067-34-169-69-145.ngrok-free.app/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text_results: results,
              symbol_results: processedSymbols,
              legal_terms: legalTerms,
              image_dimensions: imageDimensions
            }),
          });
          
          if (!response.ok) {
            console.warn(`Backend validation failed with status: ${response.status}`);
            useLocalValidation = true;
          } else {
            validationData = await response.json();
            console.log('Backend validation response:', validationData);
          }
        } catch (backendError) {
          console.warn('Backend validation error:', backendError);
          useLocalValidation = true;
        }
      }
      
      // Jika backend validation gagal, lakukan validasi lokal di frontend
      if (useLocalValidation) {
        console.log('Using local validation');
        validationData = performLocalValidation(results, processedSymbols, legalTerms, imageDimensions);
      }
      
      // Transform response to match frontend expected format
      const transformedData = {
        is_compliant: validationData.passed || false,
        compliance_message: validationData.passed ? 
          "All legal requirements are met." : 
          "Some legal requirements are not met.",
        term_validations: validationData.text_validations?.map(item => ({
          term: item.description,
          required: item.required,
          found: item.found,
          valid: item.required ? item.found : true
        })) || [],
        symbol_validations: validationData.symbol_validations?.map(item => ({
          symbol: item.description,
          required: item.required,
          found: item.found,
          valid: item.required ? item.found : true
        })) || [],
        layout_validations: validationData.layout_validations?.map(item => ({
          rule: item.rule,
          description: item.description,
          valid: item.valid
        })) || []
      };
      
      setValidationResults(transformedData);
      
      // Switch to legal tab to show results
      setActiveTab('legal');
      
    } catch (error) {
      console.error('Error during validation:', error);
      setError('An error occurred during legal term validation. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };
  
  // Function to perform local validation if backend is not available
  const performLocalValidation = (textResults, symbolResults, legalTerms, imageDimensions) => {
    console.log('Performing local validation with:', { textResults, symbolResults, legalTerms });
    
    // Convert symbol detection results to a more usable format
    const detectedSymbolClasses = {};
    const symbolKeywords = new Set(); // Menyimpan semua keyword dari simbol
    
    if (symbolResults && symbolResults.length > 0) {
      symbolResults.forEach(symbol => {
        const className = (symbol.class || '').toLowerCase();
        if (className) {
          // Simpan class asli
          detectedSymbolClasses[className] = true;
          
          // Pecah class name menjadi kata-kata individual dan simpan sebagai keywords
          const words = className.split(/[\s_-]+/);
          words.forEach(word => {
            if (word.length > 2) { // Hanya simpan kata yang cukup bermakna (> 2 karakter)
              symbolKeywords.add(word);
            }
          });
          
          // Tambahkan juga variasi format (dengan underscore, dengan spasi)
          const withUnderscore = className.replace(/\s+/g, '_');
          const withSpace = className.replace(/[_-]+/g, ' ');
          
          detectedSymbolClasses[withUnderscore] = true;
          detectedSymbolClasses[withSpace] = true;
        }
      });
    }
    console.log('Detected symbol classes:', detectedSymbolClasses);
    console.log('Symbol keywords:', Array.from(symbolKeywords));
    
    // Konversi hasil deteksi teks ke format yang lebih mudah digunakan
    const detectedTexts = [];
    const textKeywords = new Set(); // Menyimpan semua keyword dari teks
    
    if (textResults && textResults.length > 0) {
      textResults.forEach(result => {
        if (result.text) {
          const text = result.text.toLowerCase();
          detectedTexts.push(text);
          
          // Pecah teks menjadi kata-kata individual dan simpan sebagai keywords
          const words = text.split(/[\s_-]+/);
          words.forEach(word => {
            if (word.length > 2) { // Hanya simpan kata yang cukup bermakna (> 2 karakter)
              textKeywords.add(word);
            }
          });
        }
      });
    }
    console.log('Detected texts:', detectedTexts);
    console.log('Text keywords:', Array.from(textKeywords));
    
    // Fungsi untuk memeriksa kecocokan teks/simbol berdasarkan keywords dan exact match
    const checkMatch = (targetText, sourceTexts, sourceKeywords, symbolClasses) => {
      if (!targetText) return false;
      
      console.log(`Checking match for: ${targetText}`);
      console.log('Symbol classes available:', Object.keys(symbolClasses));
      
      // 1. Cek exact match dalam sourceTexts
      const targetLower = targetText.toLowerCase();
      for (const text of sourceTexts) {
        if (text.includes(targetLower)) {
          console.log(`Found exact match in text: ${text} contains ${targetLower}`);
          return true;
        }
      }
      
      // 2. Cek exact match dalam symbolClasses
      if (symbolClasses[targetLower]) {
        console.log(`Found exact match in symbol classes: ${targetLower}`);
        return true;
      }
      
      // 3. Cek variasi format
      const targetWithUnderscore = targetLower.replace(/\s+/g, '_');
      const targetWithSpace = targetLower.replace(/[_-]+/g, ' ');
      
      if (symbolClasses[targetWithUnderscore]) {
        console.log(`Found match with underscore format: ${targetWithUnderscore}`);
        return true;
      }
      
      if (symbolClasses[targetWithSpace]) {
        console.log(`Found match with space format: ${targetWithSpace}`);
        return true;
      }
      
      // 4. Cek berdasarkan keywords
      const targetWords = targetLower.split(/[\s_-]+/).filter(word => word.length > 2);
      if (targetWords.length === 0) return false;
      
      console.log(`Target words: ${targetWords.join(', ')}`);
      console.log(`Source keywords: ${Array.from(sourceKeywords).join(', ')}`);
      
      // Hitung berapa banyak kata kunci yang cocok
      let matchCount = 0;
      let matchedWords = [];
      for (const word of targetWords) {
        if (sourceKeywords.has(word)) {
          matchCount++;
          matchedWords.push(word);
        }
      }
      
      // 5. Cek apakah ada simbol yang mengandung kata kunci dari target
      for (const symbolClass of Object.keys(symbolClasses)) {
        for (const word of targetWords) {
          if (symbolClass.includes(word)) {
            console.log(`Found symbol class containing keyword: ${symbolClass} contains ${word}`);
            matchCount++;
            matchedWords.push(word);
            break; // Hanya hitung sekali per simbol
          }
        }
      }
      
      const matchRatio = matchedWords.length > 0 ? matchCount / targetWords.length : 0;
      console.log(`Match ratio: ${matchRatio} (matched ${matchCount}/${targetWords.length} words: ${matchedWords.join(', ')})`);
      
      // Jika lebih dari 40% kata kunci cocok, anggap ditemukan
      return matchRatio >= 0.4;
    };
    
    // Validasi teks
    const textValidations = [];
    for (const reqText of legalTerms.required_texts || []) {
      const pattern = reqText.pattern || reqText.description || '';
      const found = checkMatch(pattern, detectedTexts, textKeywords, detectedSymbolClasses);
      
      textValidations.push({
        id: reqText.id || `text_${textValidations.length}`,
        description: reqText.description || pattern,
        required: reqText.required !== false, // Default to true if not specified
        found: found
      });
    }
    
    // Validasi simbol
    const symbolValidations = [];
    for (const reqSymbol of legalTerms.required_symbols || []) {
      const symbolClass = reqSymbol.class || reqSymbol.description || '';
      
      // Cek apakah simbol ini adalah age grade
      const isAgeGrade = symbolClass.toLowerCase().includes('age') || 
                        symbolClass.toLowerCase().includes('grade') || 
                        symbolClass.toLowerCase().includes('3+');
                        
      // Cek apakah simbol ini adalah small part warning
      const isSmallPartWarning = symbolClass.toLowerCase().includes('small') || 
                                symbolClass.toLowerCase().includes('part') || 
                                symbolClass.toLowerCase().includes('warning');
                                
      // Cek apakah ada simbol yang cocok
      let found = false;
      
      // Cek secara langsung di symbolResults
      for (const symbol of symbolResults || []) {
        const detectedClass = (symbol.class || '').toLowerCase();
        
        // Cek kecocokan langsung
        if (detectedClass === symbolClass.toLowerCase()) {
          found = true;
          console.log(`Found exact match for symbol: ${symbolClass} = ${detectedClass}`);
          break;
        }
        
        // Cek kecocokan untuk age grade
        if (isAgeGrade && (detectedClass.includes('age') || detectedClass.includes('grade') || detectedClass.includes('3+'))) {
          found = true;
          console.log(`Found age grade symbol: ${detectedClass}`);
          break;
        }
        
        // Cek kecocokan untuk small part warning
        if (isSmallPartWarning && (detectedClass.includes('small') || detectedClass.includes('part') || detectedClass.includes('warning'))) {
          found = true;
          console.log(`Found small part warning symbol: ${detectedClass}`);
          break;
        }
      }
      
      // Jika tidak ditemukan dengan cara di atas, gunakan checkMatch
      if (!found) {
        found = checkMatch(symbolClass, detectedTexts, symbolKeywords, detectedSymbolClasses);
      }
      
      symbolValidations.push({
        id: reqSymbol.id || `symbol_${symbolValidations.length}`,
        description: reqSymbol.description || symbolClass,
        required: reqSymbol.required !== false, // Default to true if not specified
        found: found
      });
    }
    
    // Validasi layout (sederhana)
    const layoutValidations = [];
    for (const layoutReq of legalTerms.layout_requirements || []) {
      // Untuk sementara, anggap semua layout valid
      layoutValidations.push({
        id: layoutReq.id || `layout_${layoutValidations.length}`,
        description: layoutReq.description || '',
        rule: layoutReq.rule || 'position',
        valid: true // Sementara anggap valid
      });
    }
    
    // Hitung overall compliance
    const requiredTexts = textValidations.filter(v => v.required);
    const requiredSymbols = symbolValidations.filter(v => v.required);
    
    const foundRequiredTexts = requiredTexts.filter(v => v.found);
    const foundRequiredSymbols = requiredSymbols.filter(v => v.found);
    
    const textCompliance = requiredTexts.length > 0 ? foundRequiredTexts.length / requiredTexts.length : 1.0;
    const symbolCompliance = requiredSymbols.length > 0 ? foundRequiredSymbols.length / requiredSymbols.length : 1.0;
    const layoutCompliance = layoutValidations.length > 0 ? 
      layoutValidations.filter(v => v.valid).length / layoutValidations.length : 1.0;
    
    // Calculate weighted overall compliance
    const weights = {
      text: 0.4,
      symbol: 0.4,
      layout: 0.2
    };
    
    const overallCompliance = (
      textCompliance * weights.text +
      symbolCompliance * weights.symbol +
      layoutCompliance * weights.layout
    );
    
    // Determine if passed (90% compliance)
    const passed = overallCompliance >= 0.9;
    
    console.log('Validation results:', {
      textValidations,
      symbolValidations,
      layoutValidations,
      compliance: {
        text: textCompliance,
        symbol: symbolCompliance,
        layout: layoutCompliance,
        overall: overallCompliance
      },
      passed
    });
    
    return {
      text_validations: textValidations,
      symbol_validations: symbolValidations,
      layout_validations: layoutValidations,
      compliance: {
        text: textCompliance,
        symbol: symbolCompliance,
        layout: layoutCompliance,
        overall: overallCompliance
      },
      passed: passed
    };
  };

  // Handle refinement request
  const handleRefine = async () => {
    if (!results) return;

    setIsRefining(true);
    setError(null);

    try {
      const response = await fetch('https://2067-34-169-69-145.ngrok-free.app/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedFileBase64,
          result: results,
          product_requirement: {} // customize this, base on we needs
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setRefinedResults(data);

    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred during refinement. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gray-100 p-0 m-0">
      <div className="w-full h-full bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white text-center">Demo</h1>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Left Column - Upload and Preview */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload Section */}
                <div className="space-y-2">
                  <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">
                    Upload Image (JPEG or PNG, max 5MB)
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />

                  {/* Error Message */}
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={!selectedFile || isLoading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!selectedFile || isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : 'Detect Text'}
                  </button>
                </div>
              </form>

              {/* Preview Section */}
              {previewUrl && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Image Preview</h3>
                  <div className="mt-2 border border-gray-300 rounded-md overflow-hidden relative" style={{ maxWidth: '100%' }}>
                    <img
                      ref={imageRef}
                      id="preview-image"
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-auto"
                      style={{ display: 'block', maxWidth: '100%' }}
                      onLoad={() => {
                        if (imageRef.current) {
                          // Force a small delay to ensure accurate measurements
                          setTimeout(() => {
                            setImageDimensions({
                              width: imageRef.current.naturalWidth,
                              height: imageRef.current.naturalHeight,
                              displayWidth: imageRef.current.clientWidth,
                              displayHeight: imageRef.current.clientHeight
                            });
                          }, 100);
                        }
                      }}
                    />

                    {/* Overlay detected boxes based on active tab */}
                    {activeTab === 'text' && results && results.length > 0 && imageDimensions.width > 0 && (
                      <div className="absolute top-0 left-0 w-full h-full">
                        {results.map((result, index) => {
                          // Get current image display dimensions
                          const currentDisplayWidth = imageRef.current ? imageRef.current.clientWidth : imageDimensions.displayWidth;
                          const currentDisplayHeight = imageRef.current ? imageRef.current.clientHeight : imageDimensions.displayHeight;

                          // Calculate scaling factors based on current display dimensions
                          const scaleX = currentDisplayWidth / imageDimensions.width;
                          const scaleY = currentDisplayHeight / imageDimensions.height;

                          // Ensure coordinates are numbers and not strings
                          const xmin = parseFloat(result.xmin);
                          const ymin = parseFloat(result.ymin);
                          const xmax = parseFloat(result.xmax);
                          const ymax = parseFloat(result.ymax);

                          // Calculate scaled coordinates
                          const scaledXmin = xmin * scaleX;
                          const scaledYmin = ymin * scaleY;
                          const scaledWidth = (xmax - xmin) * scaleX;
                          const scaledHeight = (ymax - ymin) * scaleY;

                          // Determine border color based on index (for variety)
                          const borderClass = index % 5 === 0 ? 'border-blue-500' :
                            index % 5 === 1 ? 'border-green-500' :
                              index % 5 === 2 ? 'border-yellow-500' :
                                index % 5 === 3 ? 'border-purple-500' : 'border-red-500';

                          // Determine background color with opacity
                          const bgClass = index % 5 === 0 ? 'bg-blue-500' :
                            index % 5 === 1 ? 'bg-green-500' :
                              index % 5 === 2 ? 'bg-yellow-500' :
                                index % 5 === 3 ? 'bg-purple-500' : 'bg-red-500';

                          return (
                            <div
                              key={index}
                              className={`absolute border-2 ${borderClass} ${bgClass} bg-opacity-20`}
                              style={{
                                left: `${scaledXmin}px`,
                                top: `${scaledYmin}px`,
                                width: `${scaledWidth}px`,
                                height: `${scaledHeight}px`,
                                zIndex: 10 + index,
                                pointerEvents: 'none' // Prevent interference with image interactions
                              }}
                              title={result.text} // Show text on hover instead of label
                            />
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Overlay symbol detection boxes */}
                    {activeTab === 'symbol' && symbolResults && symbolResults.length > 0 && imageDimensions.width > 0 && (
                      <div className="absolute top-0 left-0 w-full h-full">
                        {symbolResults.map((symbol, index) => {
                          // Get current image display dimensions
                          const currentDisplayWidth = imageRef.current ? imageRef.current.clientWidth : imageDimensions.displayWidth;
                          const currentDisplayHeight = imageRef.current ? imageRef.current.clientHeight : imageDimensions.displayHeight;
                          
                          // Calculate scaling factors based on current display dimensions
                          const scaleX = currentDisplayWidth / imageDimensions.width;
                          const scaleY = currentDisplayHeight / imageDimensions.height;
                          
                          // Ensure coordinates are numbers and not strings
                          const xmin = parseFloat(symbol.xmin);
                          const ymin = parseFloat(symbol.ymin);
                          const xmax = parseFloat(symbol.xmax);
                          const ymax = parseFloat(symbol.ymax);
                          
                          // Calculate scaled coordinates
                          const scaledXmin = xmin * scaleX;
                          const scaledYmin = ymin * scaleY;
                          const scaledWidth = (xmax - xmin) * scaleX;
                          const scaledHeight = (ymax - ymin) * scaleY;
                          
                          // Determine border color based on class
                          const colorMap = {
                            'barcode': 'border-blue-500 bg-blue-500',
                            'car': 'border-red-500 bg-red-500',
                            'logo': 'border-green-500 bg-green-500',
                            'matchbox': 'border-purple-500 bg-purple-500',
                            'small_part_warning': 'border-orange-500 bg-orange-500',
                            'triangle': 'border-cyan-500 bg-cyan-500'
                          };
                          
                          const colorClass = colorMap[symbol.class] || 'border-yellow-500 bg-yellow-500';
                          
                          return (
                            <div
                              key={index}
                              className={`absolute border-2 ${colorClass} bg-opacity-20`}
                              style={{
                                left: `${scaledXmin}px`,
                                top: `${scaledYmin}px`,
                                width: `${scaledWidth}px`,
                                height: `${scaledHeight}px`,
                                zIndex: 10 + index,
                                pointerEvents: 'none' // Prevent interference with image interactions
                              }}
                              title={`${symbol.class} (${(symbol.confidence * 100).toFixed(1)}%)`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="h-full flex flex-col">
              {/* Tab Navigation */}
              {(results || symbolResults) && !isLoading && (
                <div className="mb-4 border-b border-gray-200">
                  <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                    <li className="mr-2">
                      <button
                        className={`inline-block p-4 ${activeTab === 'text' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('text')}
                      >
                        Text Detection
                      </button>
                    </li>
                    <li className="mr-2">
                      <button
                        className={`inline-block p-4 ${activeTab === 'symbol' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('symbol')}
                      >
                        Symbol Detection
                      </button>
                    </li>
                    <li className="mr-2">
                      <button
                        className={`inline-block p-4 ${activeTab === 'legal' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('legal')}
                      >
                        Legal Validation
                      </button>
                    </li>
                  </ul>
                </div>
              )}
              
              {/* Legal Term Upload Section */}
              {(results || symbolResults) && !isLoading && activeTab === 'legal' && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Legal Term Validation</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="mb-4">
                      <label htmlFor="legal-term-upload" className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Legal Terms File (CSV or XLSX)
                      </label>
                      <input
                        id="legal-term-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleLegalTermFileChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                    </div>
                    
                    {legalTermFile && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-4">
                          File loaded: <span className="font-medium">{legalTermFile.name}</span>
                        </span>
                        <button
                          onClick={validateAgainstLegalTerms}
                          disabled={isValidating || !results || !symbolResults}
                          className={`px-4 py-2 rounded-md text-white text-sm ${isValidating || !results || !symbolResults ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          {isValidating ? 'Validating...' : 'Validate'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Results Section */}
              {(results || symbolResults) && !isLoading ? (
                <div className="flex flex-col h-full">
                  {activeTab !== 'legal' && <h3 className="text-lg font-medium text-gray-900">Detection Results</h3>}
                  
                  {/* Text Results */}
                  {activeTab === 'text' && results && results.results && results.results.length > 0 ? (
                    <div className="bg-gray-50 p-4 rounded-md flex-grow mt-2 flex flex-col">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Detected Text: <span className="text-sm font-normal text-gray-500">({results.results.length} items)</span></h4>

                      <div className="flex-grow overflow-y-auto pr-2">
                        <table className="w-full text-sm text-left text-gray-600">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2">Text</th>
                              <th className="px-3 py-2">Position</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.results.slice(0, 50).map((result, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium">{result.text || 'No text available'}</td>
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  [{Math.round(result.xmin)}, {Math.round(result.ymin)}, {Math.round(result.xmax)}, {Math.round(result.ymax)}]
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {results.results.length > 50 && (
                          <p className="text-xs text-gray-500 mt-2 text-center italic">
                            Showing 50 of {results.results.length} detected items
                          </p>
                        )}
                      </div>
                    </div>
                  ) : activeTab === 'symbol' && symbolResults && symbolResults.length > 0 ? (
                    <div className="bg-gray-50 p-4 rounded-md flex-grow mt-2 flex flex-col">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Detected Symbols: <span className="text-sm font-normal text-gray-500">({symbolResults.length} items)</span></h4>
                      
                      <div className="flex-grow overflow-y-auto pr-2">
                        <table className="w-full text-sm text-left text-gray-600">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2">Symbol</th>
                              <th className="px-3 py-2">Confidence</th>
                              <th className="px-3 py-2">Position</th>
                            </tr>
                          </thead>
                          <tbody>
                            {symbolResults.slice(0, 50).map((symbol, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium">{symbol.class}</td>
                                <td className="px-3 py-2">{(symbol.confidence * 100).toFixed(1)}%</td>
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  [{Math.round(symbol.xmin)}, {Math.round(symbol.ymin)}, {Math.round(symbol.xmax)}, {Math.round(symbol.ymax)}]
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {symbolResults.length > 50 && (
                          <p className="text-xs text-gray-500 mt-2 text-center italic">
                            Showing 50 of {symbolResults.length} detected items
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center">
                      <p className="text-sm text-gray-600">No {activeTab === 'text' ? 'text' : 'symbols'} were detected in the image.</p>
                    </div>
                  )}

                  {/* Visualizations Section */}
                  {activeTab === 'text' && visualizations && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900">Visualizations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <p className="text-sm font-medium">Word Detection</p>
                          <img
                            src={`data:image/png;base64,${visualizations.word_image}`}
                            alt="Word Detection"
                            className="w-full mt-1 border border-gray-200 rounded"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Line Detection</p>
                          <img
                            src={`data:image/png;base64,${visualizations.line_image}`}
                            alt="Line Detection"
                            className="w-full mt-1 border border-gray-200 rounded"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Paragraph Detection</p>
                          <img
                            src={`data:image/png;base64,${visualizations.para_image}`}
                            alt="Paragraph Detection"
                            className="w-full mt-1 border border-gray-200 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Symbol Visualization */}
                  {activeTab === 'symbol' && symbolVisualization && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900">Symbol Detection</h3>
                      <div className="mt-2">
                        <img 
                          src={`data:image/png;base64,${symbolVisualization}`} 
                          alt="Symbol Detection" 
                          className="w-full mt-1 border border-gray-200 rounded"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Refinement Button */}
                  {activeTab === 'text' && results && (
                    <div className="mt-4">
                      <button
                        onClick={handleRefine}
                        disabled={isRefining}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                      >
                        {isRefining ? 'Refining...' : 'Refine Results'}
                      </button>
                    </div>
                  )}

                  {/* Refined Results */}
                  {refinedResults && activeTab === 'text' && (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-gray-900">Refined Results</h3>
                      <div className="bg-gray-50 p-4 rounded-md mt-2 overflow-auto">
                        <pre className="text-xs">
                          {JSON.stringify(refinedResults, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Legal Validation Results */}
                  {activeTab === 'legal' && validationResults && (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-gray-900">Validation Results</h3>
                      <div className="bg-gray-50 p-4 rounded-md mt-2">
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-gray-700 mb-2">Compliance Status</h4>
                          <div className={`px-4 py-3 rounded-md ${validationResults.is_compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <div className="flex items-center">
                              <span className="text-lg mr-2">
                                {validationResults.is_compliant ? '✓' : '✗'}
                              </span>
                              <span className="font-medium">
                                {validationResults.is_compliant ? 'Compliant' : 'Non-Compliant'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">
                              {validationResults.compliance_message}
                            </p>
                          </div>
                        </div>
                        
                        {/* Required Terms */}
                        {validationResults.term_validations && (
                          <div className="mb-4">
                            <h4 className="text-md font-medium text-gray-700 mb-2">Term Validations</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2">Term</th>
                                    <th className="px-3 py-2">Required</th>
                                    <th className="px-3 py-2">Found</th>
                                    <th className="px-3 py-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {validationResults.term_validations.map((validation, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                      <td className="px-3 py-2 font-medium">{validation.term}</td>
                                      <td className="px-3 py-2">{validation.required ? 'Yes' : 'No'}</td>
                                      <td className="px-3 py-2">{validation.found ? 'Yes' : 'No'}</td>
                                      <td className="px-3 py-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${validation.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                          {validation.valid ? 'Valid' : 'Invalid'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        
                        {/* Symbol Validations */}
                        {validationResults.symbol_validations && (
                          <div className="mb-4">
                            <h4 className="text-md font-medium text-gray-700 mb-2">Symbol Validations</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2">Symbol</th>
                                    <th className="px-3 py-2">Required</th>
                                    <th className="px-3 py-2">Found</th>
                                    <th className="px-3 py-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {validationResults.symbol_validations.map((validation, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                      <td className="px-3 py-2 font-medium">{validation.symbol}</td>
                                      <td className="px-3 py-2">{validation.required ? 'Yes' : 'No'}</td>
                                      <td className="px-3 py-2">{validation.found ? 'Yes' : 'No'}</td>
                                      <td className="px-3 py-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${validation.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                          {validation.valid ? 'Valid' : 'Invalid'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        
                        {/* Layout Validations */}
                        {validationResults.layout_validations && (
                          <div>
                            <h4 className="text-md font-medium text-gray-700 mb-2">Layout Validations</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2">Rule</th>
                                    <th className="px-3 py-2">Description</th>
                                    <th className="px-3 py-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {validationResults.layout_validations.map((validation, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                      <td className="px-3 py-2 font-medium">{validation.rule}</td>
                                      <td className="px-3 py-2">{validation.description}</td>
                                      <td className="px-3 py-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${validation.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                          {validation.valid ? 'Valid' : 'Invalid'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : previewUrl ? (
                <div className="h-full flex items-center justify-center bg-gray-50 p-4 rounded-md mt-2">
                  <p className="text-gray-500 italic">{isLoading ? 'Processing image...' : 'Click "Detect Text" to analyze the image'}</p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 p-4 rounded-md mt-2">
                  <p className="text-gray-500 italic">Please upload an image to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;