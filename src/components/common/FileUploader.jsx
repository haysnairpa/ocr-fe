import React, { useState } from 'react';

/**
 * Reusable file uploader component with modern design
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.label - Label text
 * @param {string} props.accept - Accepted file types
 * @param {Function} props.onChange - Change handler function
 * @param {string} props.buttonText - Text for upload button
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
const FileUploader = ({ 
  id, 
  label, 
  accept, 
  onChange, 
  buttonText = 'Choose File', 
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    }
    onChange(e);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length) {
      const fileInput = document.getElementById(id);
      fileInput.files = e.dataTransfer.files;
      setFileName(e.dataTransfer.files[0].name);
      
      // Create a synthetic event to pass to onChange
      const event = { target: { files: e.dataTransfer.files } };
      onChange(event);
    }
  };
  
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      
      <div 
        className={`mt-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p className="text-sm text-gray-600 mb-2">
            {fileName ? (
              <span className="font-medium text-blue-600">{fileName}</span>
            ) : (
              <span>
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </span>
            )}
          </p>
          
          <p className="text-xs text-gray-500">
            {accept.split(',').map(type => type.trim().replace('image/', '').toUpperCase()).join(', ')} files only
          </p>
          
          <input
            id={id}
            name={id}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleChange}
          />
          
          <button 
            type="button" 
            onClick={() => document.getElementById(id).click()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
