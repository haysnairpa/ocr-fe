import React, { useEffect, useRef } from 'react';

/**
 * Component to display image with bounding boxes for detected symbols
 * @param {Object} props - Component props
 * @param {string} props.imageUrl - URL of the image to display
 * @param {Array} props.symbols - Array of detected symbols with position and confidence data
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
const SymbolVisualization = ({ imageUrl, symbols, className = '' }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!imageUrl || !symbols || symbols.length === 0) return;

    const image = new Image();
    image.src = imageUrl;
    imageRef.current = image;

    image.onload = () => {
      drawSymbolsOnCanvas();
    };
  }, [imageUrl, symbols]);

  const drawSymbolsOnCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    // Set canvas dimensions to match the image
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw the image on the canvas
    ctx.drawImage(image, 0, 0, image.width, image.height);

    // Draw bounding boxes for each symbol
    symbols.forEach((symbol, index) => {
      const { xmin, ymin, width, height } = symbol;
      
      // Generate a unique color for each symbol
      const hue = (index * 137) % 360; // Golden angle approximation for good color distribution
      const boxColor = `hsl(${hue}, 100%, 50%)`;
      
      // Draw the bounding box
      ctx.lineWidth = 2;
      ctx.strokeStyle = boxColor;
      ctx.fillStyle = `${boxColor}33`; // 20% opacity
      ctx.strokeRect(xmin, ymin, width, height);
      ctx.fillRect(xmin, ymin, width, height);
      
      // Draw label with confidence and size
      const label = symbol.label || symbol.class || `Symbol ${index + 1}`;
      const confidence = symbol.confidence ? `${(symbol.confidence * 100).toFixed(1)}%` : 'N/A';
      const size = `${Math.round(width)}×${Math.round(height)}`;
      
      // Background for text
      ctx.fillStyle = boxColor;
      const textPadding = 4;
      const fontSize = 12;
      ctx.font = `${fontSize}px Arial`;
      
      const labelWidth = ctx.measureText(label).width;
      const confidenceWidth = ctx.measureText(`Conf: ${confidence}`).width;
      const sizeWidth = ctx.measureText(`Size: ${size}`).width;
      const maxWidth = Math.max(labelWidth, confidenceWidth, sizeWidth) + (textPadding * 2);
      
      // Position the label above the bounding box if possible, otherwise inside at the top
      const textX = xmin;
      const textY = ymin > fontSize * 3 + 10 ? ymin - 10 : ymin + fontSize;
      
      // Draw background for label
      ctx.fillStyle = `${boxColor}dd`; // 87% opacity
      ctx.fillRect(textX, textY - fontSize, maxWidth, fontSize * 3 + textPadding * 2);
      
      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, textX + textPadding, textY);
      ctx.fillText(`Conf: ${confidence}`, textX + textPadding, textY + fontSize + 2);
      ctx.fillText(`Size: ${size}`, textX + textPadding, textY + (fontSize + 2) * 2);
    });
  };

  if (!imageUrl) {
    return (
      <div className={`p-4 bg-gray-50 rounded-md flex items-center justify-center ${className}`}>
        <p className="text-gray-500 italic">No image available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto rounded-md"
      />
    </div>
  );
};

export default SymbolVisualization;
