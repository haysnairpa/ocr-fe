import React, { useState, useEffect } from 'react';
import { TEXT_API_URL, SYMBOL_API_URL, updateTextApiUrl, updateSymbolApiUrl, API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Component for setting the API URLs
 * This is useful when the backend ngrok URLs change
 */
const ApiUrlSetter = () => {
  const [textApiUrl, setTextApiUrl] = useState(TEXT_API_URL);
  const [symbolApiUrl, setSymbolApiUrl] = useState(SYMBOL_API_URL);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isEditingSymbol, setIsEditingSymbol] = useState(false);
  const [textStatus, setTextStatus] = useState(null);
  const [symbolStatus, setSymbolStatus] = useState(null);

  // Check API status with timeout to prevent hanging
  const checkTextApiStatus = async (url) => {
    try {
      setTextStatus({ connected: false, message: 'Checking connection...' });
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
      
      // Ensure URL ends with /status and has no trailing slash before adding /status
      const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      const statusUrl = baseUrl.endsWith('/status') ? baseUrl : `${baseUrl}/status`;
      console.log('Checking Text API status at:', statusUrl);
      
      // Create fetch promise with appropriate headers
      const fetchPromise = fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Race the fetch against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (response.ok) {
        try {
          // Clone the response before reading it to avoid 'body stream already read' error
          const responseClone = response.clone();
          
          // Try to parse the response as JSON
          const data = await response.json();
          setTextStatus({ connected: true, message: data.message || 'Connected' });
          console.log('Text API connected successfully');
          return true;
        } catch (parseError) {
          // Handle JSON parsing errors
          console.error('Failed to parse Text API response as JSON:', parseError);
          
          try {
            // Get a fresh response since the original one was consumed
            const freshResponse = await fetch(`${url}/status`);
            const responseText = await freshResponse.text();
            const errorMessage = responseText.includes('<!DOCTYPE') 
              ? 'Received HTML instead of JSON. Check if URL is correct.' 
              : `Invalid JSON response: ${responseText.substring(0, 50)}...`;
            setTextStatus({ connected: false, message: errorMessage });
          } catch (textError) {
            // If we can't even get the text, just use the parse error
            setTextStatus({ connected: false, message: `Parse error: ${parseError.message}` });
          }
          return false;
        }
      } else {
        // Handle non-OK responses
        const statusText = `${response.status} ${response.statusText}`;
        setTextStatus({ connected: false, message: `API error: ${statusText}` });
        console.log('Text API returned error:', statusText);
        return false;
      }
    } catch (error) {
      // Handle network errors
      console.error('Text API connection error:', error);
      const errorMessage = error.message.includes('Failed to fetch') 
        ? 'Network error: Could not reach the server. Check if the URL is correct and the server is running.' 
        : error.message || 'Cannot connect to API';
      setTextStatus({ connected: false, message: errorMessage });
      return false;
    }
  };

  // Check symbol API status with timeout
  const checkSymbolApiStatus = async (url) => {
    try {
      setSymbolStatus({ connected: false, message: 'Checking connection...' });
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
      
      // Ensure URL ends with /status and has no trailing slash before adding /status
      const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      const statusUrl = baseUrl.endsWith('/status') ? baseUrl : `${baseUrl}/status`;
      console.log('Checking Symbol API status at:', statusUrl);
      
      // Create fetch promise with appropriate headers
      const fetchPromise = fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Race the fetch against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (response.ok) {
        try {
          // Clone the response before reading it to avoid 'body stream already read' error
          const responseClone = response.clone();
          
          // Try to parse the response as JSON
          const data = await response.json();
          setSymbolStatus({ connected: true, message: data.message || 'Connected' });
          console.log('Symbol API connected successfully');
          return true;
        } catch (parseError) {
          // Handle JSON parsing errors
          console.error('Failed to parse Symbol API response as JSON:', parseError);
          
          try {
            // Get a fresh response since the original one was consumed
            const freshResponse = await fetch(`${url}/status`);
            const responseText = await freshResponse.text();
            const errorMessage = responseText.includes('<!DOCTYPE') 
              ? 'Received HTML instead of JSON. Check if URL is correct.' 
              : `Invalid JSON response: ${responseText.substring(0, 50)}...`;
            setSymbolStatus({ connected: false, message: errorMessage });
          } catch (textError) {
            // If we can't even get the text, just use the parse error
            setSymbolStatus({ connected: false, message: `Parse error: ${parseError.message}` });
          }
          return false;
        }
      } else {
        // Handle non-OK responses
        const statusText = `${response.status} ${response.statusText}`;
        setSymbolStatus({ connected: false, message: `API error: ${statusText}` });
        console.log('Symbol API returned error:', statusText);
        return false;
      }
    } catch (error) {
      // Handle network errors
      console.error('Symbol API connection error:', error);
      const errorMessage = error.message.includes('Failed to fetch') 
        ? 'Network error: Could not reach the server. Check if the URL is correct and the server is running.' 
        : error.message || 'Cannot connect to API';
      setSymbolStatus({ connected: false, message: errorMessage });
      return false;
    }
  };

  // Check status on component mount
  useEffect(() => {
    checkTextApiStatus(textApiUrl);
    checkSymbolApiStatus(symbolApiUrl);
  }, []);

  // Handle text URL change
  const handleTextUrlChange = (e) => {
    setTextApiUrl(e.target.value);
  };

  // Handle symbol URL change
  const handleSymbolUrlChange = (e) => {
    setSymbolApiUrl(e.target.value);
  };

  // Handle text API form submission
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    
    // Validate URL format
    if (!textApiUrl.startsWith('http')) {
      setTextStatus({ connected: false, message: 'URL must start with http:// or https://' });
      return;
    }
    
    // Remove trailing slash if present
    const formattedUrl = textApiUrl.endsWith('/') ? textApiUrl.slice(0, -1) : textApiUrl;
    
    try {
      // Update the status to indicate we're checking
      setTextStatus({ connected: false, message: 'Checking connection...' });
      
      // Check if we can connect to the new URL
      const isConnected = await checkTextApiStatus(formattedUrl);
      
      if (isConnected) {
        // Update the API URL in the config
        updateTextApiUrl(formattedUrl);
        setTextApiUrl(formattedUrl);
        setIsEditingText(false);
        
        // Show success message
        alert('Text API URL updated successfully!');
      } else {
        // Show error message
        alert('Could not connect to the Text API. Please check the URL and try again.');
      }
    } catch (error) {
      console.error('Error updating Text API URL:', error);
      alert(`Error: ${error.message || 'Could not update Text API URL'}`);
    }
  };

  // Handle symbol API form submission
  const handleSymbolSubmit = async (e) => {
    e.preventDefault();
    
    // Validate URL format
    if (!symbolApiUrl.startsWith('http')) {
      setSymbolStatus({ connected: false, message: 'URL must start with http:// or https://' });
      return;
    }
    
    // Remove trailing slash if present
    const formattedUrl = symbolApiUrl.endsWith('/') ? symbolApiUrl.slice(0, -1) : symbolApiUrl;
    
    try {
      // Update the status to indicate we're checking
      setSymbolStatus({ connected: false, message: 'Checking connection...' });
      
      // Check if we can connect to the new URL
      const isConnected = await checkSymbolApiStatus(formattedUrl);
      
      if (isConnected) {
        // Update the API URL in the config
        updateSymbolApiUrl(formattedUrl);
        setSymbolApiUrl(formattedUrl);
        setIsEditingSymbol(false);
        
        // Show success message
        alert('Symbol API URL updated successfully!');
      } else {
        // Show error message
        alert('Could not connect to the Symbol API. Please check the URL and try again.');
      }
    } catch (error) {
      console.error('Error updating Symbol API URL:', error);
      alert(`Error: ${error.message || 'Could not update Symbol API URL'}`);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      {/* Text API Connection */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Text API Connection</h3>
            <div className="flex items-center mt-1">
              <div 
                className={`w-3 h-3 rounded-full mr-2 ${textStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`} 
              />
              <span className="text-sm text-gray-600">
                {textStatus?.connected ? 'Connected' : 'Disconnected'}
              </span>
              {textStatus?.message && (
                <span className="text-xs text-gray-500 ml-2">
                  {textStatus.message}
                </span>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setIsEditingText(!isEditingText)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {isEditingText ? 'Cancel' : 'Change Text API URL'}
          </button>
        </div>
        
        {isEditingText && (
          <form onSubmit={handleTextSubmit} className="mt-3">
            <div className="flex items-center">
              <input
                type="text"
                value={textApiUrl}
                onChange={handleTextUrlChange}
                placeholder="Enter Text API URL"
                className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-black"
              />
              <button
                type="submit"
                className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Update
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Example: http://a1b2-104-196-119-93.ngrok-free.app
            </p>
          </form>
        )}
      </div>

      {/* Symbol API Connection */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Symbol API Connection</h3>
            <div className="flex items-center mt-1">
              <div 
                className={`w-3 h-3 rounded-full mr-2 ${symbolStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`} 
              />
              <span className="text-sm text-gray-600">
                {symbolStatus?.connected ? 'Connected' : 'Disconnected'}
              </span>
              {symbolStatus?.message && (
                <span className="text-xs text-gray-500 ml-2">
                  {symbolStatus.message}
                </span>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setIsEditingSymbol(!isEditingSymbol)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {isEditingSymbol ? 'Cancel' : 'Change Symbol API URL'}
          </button>
        </div>
        
        {isEditingSymbol && (
          <form onSubmit={handleSymbolSubmit} className="mt-3">
            <div className="flex items-center">
              <input
                type="text"
                value={symbolApiUrl}
                onChange={handleSymbolUrlChange}
                placeholder="Enter Symbol API URL"
                className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-black"
              />
              <button
                type="submit"
                className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Update
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Example: http://a1b2-104-196-119-93.ngrok-free.app
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ApiUrlSetter;
