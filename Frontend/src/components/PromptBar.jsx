import React, { useState } from 'react'
import sampleData from '../sampleData.json';
import { fetchPromptResponse } from '../api_functions/api';

const PromptBar = ({ setSelectedData }) => {
  const [responseData, setResponseData] = useState(null);
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleChange = (e) => {
    setSearchPrompt(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent newline
      setIsTyping(false);
      if (searchPrompt) {
        setSelectedData(null);
        setSelectedData(sampleData); // Replace with actual data from apiResponse
        try {
          const apiResponse = await fetchPromptResponse(searchPrompt);
          setResponseData(apiResponse);
        } catch (error) {
          // Optionally handle error
          setSelectedData({ error: 'API request failed.' });
        }
      }
    }
  };

  return (
    <>
      {/* Search box */}
      <textarea
        placeholder="Type your prompt here..."
        value={searchPrompt}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`w-[100%] cursor-auto bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none transition-all duration-300 resize-none ${isTyping ? 'h-[70%]' : 'h-[32px]'}`}
        style={isTyping ? { height: '50%' } : { height: '32px' }}
        rows={isTyping ? 6 : 1}
      />
    </>
  );
}

export default PromptBar;