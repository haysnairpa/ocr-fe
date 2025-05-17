import React from 'react';

/**
 * Component to display visualization results from OCR or symbol detection
 * @param {Object} props - Component props
 * @param {string} props.visualizationData - Base64 encoded visualization image
 * @param {string} props.altText - Alternative text for the image
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
const VisualizationView = ({ 
  visualizationData, 
  altText = 'Visualization', 
  className = '' 
}) => {
  if (!visualizationData) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-md p-4 ${className}`}>
        <p className="text-gray-500 italic">No visualization available</p>
      </div>
    );
  }

  // Check if the visualization data already has the data URL prefix
  const imageSource = visualizationData.startsWith('data:image') 
    ? visualizationData 
    : `data:image/png;base64,${visualizationData}`;

  return (
    <div className={`overflow-hidden rounded-md ${className}`}>
      <img
        src={imageSource}
        alt={altText}
        className="w-full h-auto object-contain"
      />
    </div>
  );
};

export default VisualizationView;
