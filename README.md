# OCR-Mattel: Packaging Verification System

A comprehensive AI-driven solution for automated packaging verification using Optical Character Recognition (OCR) and symbol detection for PT Mattel Indonesia.

## Overview

This system automates the verification of packaging labels and layouts by detecting and recognizing text and symbols, and validating them against legal requirements. It consists of a React frontend for user interaction and two separate Google Colab-based backend services for AI processing.

## Features

- **Text Detection and Recognition**: Uses Hi-SAM for text region detection and ParseQ for character recognition
- **Symbol Detection**: Employs YOLOv8 to identify logos, warning symbols, and other graphical elements
- **Legal Requirement Validation**: Parses Excel/CSV files containing legal requirements and verifies packaging compliance
- **Interactive UI**: Displays detection results and validation reports with visual overlays

## System Requirements

### Frontend Requirements
- **Node.js**: Version 16.x or higher
- **Modern Web Browser**: Chrome, Firefox, Edge, or Safari (latest versions)
- **Git**: Latest version

### Backend Requirements
- **Google Account**: Access to Google Colab for running backend notebooks
- **Stable Internet Connection**: For communicating between frontend and Colab-hosted backend

## Installation and Setup

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/haysnairpa/ocr-fe.git
   cd ocr-fe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoints**
   - Open `src/config/apiConfig.js`
   - Update with the ngrok URLs from your running Colab notebooks (see backend setup)

### Backend Setup

The backend consists of two Google Colab notebooks that need to be run separately:

#### Text Detection Backend

1. **Access the Text Detection Colab notebook**
   - Navigate to [Scene Text Detection and Recognition Notebook](https://colab.research.google.com/drive/10FY8iufpptH2_vMkTgalcOyS2mM8SOPJ)
   - If access is restricted, request access from the repository owner

2. **Run the notebook**
   - Open the table of content in colab, and navigate to cell with title "Flask Backend"
   - Start to Run the cells from there sequentially until the Flask server starts
   - Mount your Google Drive when prompted
   - Note the ngrok URL displayed (something like `https://xxxx-xx-xx-xxx-xx.ngrok.io`)

#### Symbol Detection Backend

1. **Access the Symbol Detection Colab notebook**
   - Navigate to [Object/Symbol Detection Notebook](https://colab.research.google.com/drive/1p81wp6UHBKl4QZFiDsMe08ACLTK29OLy)
   - If access is restricted, request access from the repository owner

2. **Run the notebook**
   - Navigate to the cell with the title of "BACKEND"
   - Run cells sequentially, start from there, until the Flask server starts
   - Mount your Google Drive when prompted
   - Note the ngrok URL displayed

### Connecting Frontend to Backend

1. **Update API configuration**
   - Open `src/config/apiConfig.js` in the frontend codebase
   - Update the endpoint URLs with the ngrok URLs from both Colab notebooks:

   ```javascript
   export const API_ENDPOINTS = {
     TEXT_DETECTION: 'https://your-text-detection-ngrok-url.ngrok.io/predict_pipeline',
     SYMBOL_DETECTION: 'https://your-symbol-detection-ngrok-url.ngrok.io/detect_symbols',
   };
   ```

2. **Alternative: Use the UI to update endpoints**
   - In the frontend application, use the "Change Text API URL" and "Change Symbol API URL" buttons to update the API URLs dynamically

## Running the Application

### Start the Backend Services

1. **Ensure both Colab notebooks are running**
   - Keep both notebook tabs open in your browser
   - Verify the cells are executed and the Flask servers are running
   - Make sure ngrok tunnels are active and URLs are available

2. **Note about Colab runtime limitations**
   - Google Colab may disconnect after periods of inactivity
   - You may need to reconnect and re-run the notebooks periodically
   - Always check the ngrok URLs after reconnecting as they may change

### Start the Frontend Application

1. **Run the development server**
   ```bash
   npm run dev
   ```

2. **Access the application**
   - Open your browser and navigate to `http://localhost:5173`
   - The application should now connect to the Colab backends

## Usage Guide

### Basic Workflow

1. **Upload an image**
   - Click "Select Image" in the Image Analysis section
   - Choose a packaging image file (JPEG or PNG format)

2. **Upload a legal term file (optional)**
   - Click "Select Legal Term File" in the Legal Validation section
   - Choose an Excel or CSV file containing legal requirements

3. **Process the image**
   - Click "Analyze Image" to run OCR and symbol detection only
   - Click "Run Complete Pipeline" to perform OCR, symbol detection, and legal validation

4. **View results**
   - After processing completes, results will appear in the tabbed interface:
     - **Text Tab**: Shows detected text regions and content
     - **Symbols Tab**: Shows detected symbols and classifications
     - **Validation Tab**: Shows compliance verification results

### Tips for Best Results

- **Image Quality**: Use clear, well-lit images for best detection results
- **Image Size**: High-resolution images work best (at least 1000px width)
- **Legal Term Format**: Follow the template for legal term Excel/CSV files
- **Backend Connectivity**: Ensure both Colab notebooks remain active while using the application

## API Structure

The frontend expects the following API endpoints from the backends:

### Text Detection Backend
- `/predict_pipeline` - For complete text detection pipeline
- `/verify_requirements` - For validating against legal requirements
- `/status` - For checking server status

### Symbol Detection Backend
- `/detect_symbols` - For symbol detection using YOLOv8
- `/status` - For checking server status

## Troubleshooting

### Common Issues and Solutions

1. **Backend connection error**
   - Check if the Colab notebooks are still running (they may disconnect after periods of inactivity)
   - Verify the ngrok URLs are still active and correctly configured in apiConfig.js
   - Restart the Colab notebooks if necessary and update the URLs

2. **Image processing failure**
   - Ensure the image is in a supported format (JPEG, PNG)
   - Try with a smaller or less complex image
   - Check the browser console and Colab output for error messages

3. **"Unterminated string literal" error**
   - This is a known issue with some API responses from the LLM
   - Try processing a different image or requirement file
   - Check the Colab output for detailed error information

4. **Slow processing times**
   - Google Colab free tier may have limited resources
   - Processing large images may take time, especially without GPU acceleration
   - Try using smaller images or upgrading to Colab Pro for better performance

## Project Structure

```
ocr-fe/
├── public/               # Static assets
├── src/
│   ├── assets/           # Application assets
│   ├── components/       # React components
│   │   ├── common/       # Shared components
│   │   ├── Integrated/   # Main application page
│   │   ├── LegalValidation/  # Legal validation components
│   │   ├── OCR/          # OCR-related components
│   │   └── Symbols/      # Symbol detection components
│   ├── config/           # Configuration files
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service functions
│   └── utils/            # Helper utilities
├── package.json          # Dependencies and scripts
└── vite.config.js        # Vite configuration
```

## Legal Term File Format

The legal term file should be an Excel or CSV file, you can use the following format:

| text_requirement | description                         | required |
|------------------|-------------------------------------|---------|
| warning_text     | CHOKING HAZARD - Small parts        | true     |
| minimum_font     | 2.5mm                               | true     |
| symbol_required  | ce_mark                             | true     |

## Backend Response Structure

The OCR API response structure doesn't have a direct 'text' property in the results. Instead, each result item has properties like font_size, id, lines, xmax, xmin, etc. The text content needs to be extracted from the 'lines' array in each result item.

## Known Issues

Backend may experience error 500 on endpoint `/verify_requirements` due to an "unterminated string literal" issue in the response from the AI model that cannot be properly processed by `ast.literal_eval()`.

## License

MIT
