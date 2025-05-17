import React from 'react';

/**
 * Reusable file uploader component
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
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="mt-1 flex items-center">
        <label htmlFor={id} className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <span>{buttonText}</span>
          <input
            id={id}
            name={id}
            type="file"
            className="sr-only"
            accept={accept}
            onChange={onChange}
          />
        </label>
      </div>
    </div>
  );
};

export default FileUploader;
