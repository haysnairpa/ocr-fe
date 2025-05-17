/**
 * File Utility Functions
 * Common functions for file operations
 */

/**
 * Validate image file type and size
 * @param {File} file - The file to validate
 * @param {number} maxSizeInMB - Maximum allowed file size in MB
 * @returns {Object} - Validation result with status and error message if any
 */
export const validateImageFile = (file, maxSizeInMB = 5) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  // Validate file type
  if (!(file.type === 'image/jpeg' || file.type === 'image/png')) {
    return { isValid: false, error: 'Please select a valid image file (JPEG or PNG)' };
  }
  
  // Validate file size (maxSizeInMB in bytes)
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return { isValid: false, error: `File size exceeds the limit of ${maxSizeInMB}MB` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate Excel/CSV file type and size
 * @param {File} file - The file to validate
 * @param {number} maxSizeInMB - Maximum allowed file size in MB
 * @returns {Object} - Validation result with status and error message if any
 */
export const validateExcelFile = (file, maxSizeInMB = 5) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  // Validate file type
  const validTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  
  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: 'Please select a valid file (CSV or XLSX)' };
  }
  
  // Validate file size (maxSizeInMB in bytes)
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return { isValid: false, error: `File size exceeds the limit of ${maxSizeInMB}MB` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Convert file to base64
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 representation of the file
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
