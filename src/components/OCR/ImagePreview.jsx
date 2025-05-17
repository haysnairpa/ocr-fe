import React, { useEffect, useRef } from 'react';

/**
 * Image preview component with dimension tracking
 * @param {Object} props - Component props
 * @param {string} props.previewUrl - URL of the image to preview
 * @param {Function} props.onDimensionsChange - Callback when dimensions change
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
const ImagePreview = ({ 
  previewUrl, 
  onDimensionsChange, 
  className = '' 
}) => {
  const imageRef = useRef(null);
  
  useEffect(() => {
    if (previewUrl && imageRef.current) {
      const updateDimensions = () => {
        if (onDimensionsChange) {
          onDimensionsChange({
            width: imageRef.current.naturalWidth,
            height: imageRef.current.naturalHeight,
            displayWidth: imageRef.current.clientWidth,
            displayHeight: imageRef.current.clientHeight
          });
        }
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
  }, [previewUrl, onDimensionsChange]);

  if (!previewUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-md ${className}`}>
        <p className="text-gray-500 italic">No image selected</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imageRef}
        src={previewUrl}
        alt="Preview"
        className="w-full h-auto object-contain rounded-md"
      />
    </div>
  );
};

export default ImagePreview;
