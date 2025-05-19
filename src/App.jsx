import React, { useState } from 'react';
import './App.css';
import OCRPage from './components/OCR/OCRPage';
import SymbolPage from './components/Symbols/SymbolPage';
import LegalValidationPage from './components/LegalValidation/LegalValidationPage';
import TabNavigation from './components/common/TabNavigation';

/**
 * Main App component that orchestrates the different pages of the application
 * @returns {JSX.Element} - Rendered component
 */
function App() {
  // State variables for the main app
  const [activeTab, setActiveTab] = useState('text'); // 'text', 'symbol', or 'legal'
  const [ocrResults, setOcrResults] = useState(null);
  const [symbolResults, setSymbolResults] = useState(null);

  // Define tabs for navigation
  const tabs = [
    { id: 'text', label: 'Text Detection' },
    { id: 'symbol', label: 'Symbol Detection' },
    { id: 'legal', label: 'Legal Validation' }
  ];

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Handle OCR results update
  const handleOcrResultsUpdate = (results) => {
    setOcrResults(results);
  };

  // Handle symbol results update
  const handleSymbolResultsUpdate = (results) => {
    setSymbolResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">OCR and Symbol Detection</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tab Navigation */}
          <TabNavigation 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            tabs={tabs} 
            className="mb-6"
          />
          
          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === 'text' && (
              <OCRPage onResultsUpdate={handleOcrResultsUpdate} />
            )}
            
            {activeTab === 'symbol' && (
              <SymbolPage onResultsUpdate={handleSymbolResultsUpdate} />
            )}
            
            {activeTab === 'legal' && (
              <LegalValidationPage 
                ocrResults={ocrResults} 
                symbolResults={symbolResults} 
              />
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-white shadow mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            OCR and Symbol Detection Application
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
