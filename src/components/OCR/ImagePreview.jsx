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
  
  // Menyimpan dimensi sebelumnya untuk mencegah pembaruan yang tidak perlu
  const prevDimensionsRef = useRef(null);
  
  useEffect(() => {
    if (previewUrl && imageRef.current) {
      const updateDimensions = () => {
        if (onDimensionsChange && imageRef.current) {
          const newDimensions = {
            width: imageRef.current.naturalWidth,
            height: imageRef.current.naturalHeight,
            displayWidth: imageRef.current.clientWidth,
            displayHeight: imageRef.current.clientHeight
          };
          
          // Hanya panggil onDimensionsChange jika dimensi benar-benar berubah
          const prevDimensions = prevDimensionsRef.current;
          if (!prevDimensions ||
              prevDimensions.width !== newDimensions.width ||
              prevDimensions.height !== newDimensions.height ||
              prevDimensions.displayWidth !== newDimensions.displayWidth ||
              prevDimensions.displayHeight !== newDimensions.displayHeight) {
            
            prevDimensionsRef.current = newDimensions;
            onDimensionsChange(newDimensions);
          }
        }
      };

      // Set initial dimensions
      if (imageRef.current.complete) {
        updateDimensions();
      }

      // Update dimensions when image loads
      const imageElement = imageRef.current;
      imageElement.addEventListener('load', updateDimensions);

      // Create a resize observer to update dimensions when container resizes
      const resizeObserver = new ResizeObserver(() => {
        if (imageRef.current) {
          updateDimensions();
        }
      });

      if (imageRef.current) {
        resizeObserver.observe(imageRef.current);
      }

      // Cleanup function
      return () => {
        if (imageElement) {
          imageElement.removeEventListener('load', updateDimensions);
        }
        resizeObserver.disconnect();
      };
    }
  }, [previewUrl]); // Hanya jalankan ulang effect ketika previewUrl berubah

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
