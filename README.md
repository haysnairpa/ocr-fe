# OCR and Symbol Detection Frontend

A React-based frontend application for OCR (Optical Character Recognition) and symbol detection on product packaging. This application works with two separate Flask backends:

1. **Text Detection Backend**: Uses Hi-SAM and ParseQ models for text detection and LLM-based refinement
2. **Symbol Detection Backend**: Uses YOLOv8 for symbol detection on product packaging

## Features

- Text detection and recognition using Hi-SAM and ParseQ models
- Symbol detection and validation
- Legal requirements validation
- Visualization of detected text regions
- Dynamic API URL configuration for ngrok integration

## Installation

```bash
npm install
```

## Usage

### Starting the Frontend

```bash
npm run dev
```

### Connecting to the Backends

This frontend is designed to work with two separate Flask backends:

#### Text Detection Backend
1. Run the text detection backend in Google Colab using the provided code
2. Note the ngrok URL that is generated when the backend starts (usually on port 5000)
3. In the frontend application, use the "Change Text API URL" button at the top of the page to update the Text API URL

#### Symbol Detection Backend
1. Run the symbol detection backend in Google Colab using the YOLOv8 code
2. Note the ngrok URL that is generated when the backend starts (usually on port 5001)
3. In the frontend application, use the "Change Symbol API URL" button to update the Symbol API URL

### API Structure

The frontend expects the following API endpoints from the backends:

#### Text Detection Backend (port 5000)
- `/detect` - For text detection using Hi-SAM and ParseQ
- `/refine` - For text refinement using LLM
- `/refine_symbols` - For symbol refinement using LLM
- `/upload_requirements` - For uploading requirements files
- `/validate_product` - For product validation
- `/status` - For checking server status

#### Symbol Detection Backend (port 5001)
- `/detect_symbols` - For symbol detection using YOLOv8
- `/status` - For checking server status

## Backend Response Structure

The OCR API response structure from the backend doesn't have a direct 'text' property in the results. Instead, each result item has properties like font_size, id, lines, xmax, xmin, etc. The text content is extracted from the 'lines' array in each result item.

## Workflow

1. **Text Detection**: Upload an image to detect text regions
2. **Symbol Detection**: Use the same or different image to detect symbols and validate against requirements
3. **Legal Validation**: Upload requirements files and validate product compliance

## Troubleshooting

- If you encounter connection issues, make sure both ngrok URLs are correctly set in the application
- Check the browser console for detailed error messages
- Ensure both backends are running and accessible
- The application will still function with only one backend running, but with limited features
- If the symbol detection backend is not available, the application will fall back to using the text detection backend's symbol refinement capabilities

## License

MIT
