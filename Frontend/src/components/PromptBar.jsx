import React, { useState } from 'react'
import { fetchPromptResponse } from '../api_functions/api';

const PromptBar = ({ setSelectedData }) => {
  const [responseData, setResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleChange = (e) => {
    setSearchPrompt(e.target.value);
    setIsTyping(e.target.value.length > 0);
    setResponseData(null);
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent newline
      setIsTyping(false);
      if (searchPrompt) {
        setSelectedData(null);
        // setSelectedData(sampleData); // Replace with actual data from apiResponse
        setIsLoading(true);
        setResponseData(null);
        try {
          const apiResponse = await fetchPromptResponse(searchPrompt);
          setResponseData(apiResponse);
        } catch (error) {
          // setSelectedData({ error: 'API request failed.' });
          setResponseData({ result: 'API request failed.' });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <>
      {/* Search box */}
      <textarea
        placeholder="Type your prompt here..."
        value={
          isTyping && !isLoading
            ? searchPrompt
            : isLoading
              ? 'Generating...'
              : (responseData?.result ? responseData.result : searchPrompt)
        }
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setIsTyping(false)}
        className={`w-[100%] cursor-auto bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none transition-all duration-300 resize-none ${isTyping ? 'h-[70%]' : 'h-[32px]'} ${(isLoading || responseData?.result) ? 'text-right' : ''}`}
        style={isTyping ? { height: '20%' } : { height: '32px' }}
        rows={isTyping ? 3 : 1}
        disabled={isLoading}
      />
    </>
  );
}

export default PromptBar;