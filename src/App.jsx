import React from 'react';
import './App.css';
import IntegratedPage from './components/Integrated/IntegratedPage';
import ApiUrlSetter from './components/common/ApiUrlSetter';

/**
 * Main App component with integrated OCR, Symbol Detection, and Legal Validation
 * @returns {JSX.Element} - Rendered component
 */
function App() {

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">OCR and Symbol Detection</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* API URL Setter */}
          <ApiUrlSetter />
          
          {/* Integrated Page with all functionality */}
          <IntegratedPage />
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
