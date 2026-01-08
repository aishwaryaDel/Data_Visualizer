import React, { useState } from 'react';
import { fetchPromptResponse } from '../api_functions/api';


const QueryBar = ({ setSelection, setView }) => {
  const [responseData, setResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);


  const handleChange = (e) => {
    setSqlQuery(e.target.value);
    setIsTyping(e.target.value.length > 0);
    setResponseData(null);
  };


  const handleRunQuery = async () => {
    if (sqlQuery) {
      setIsLoading(true);
      setResponseData(null);
      try {
        const apiResponse = await fetchPromptResponse(sqlQuery); // Replace with actual SQL query function if needed
        setResponseData(apiResponse);
      } catch (error) {
        setResponseData({ message: 'API request failed.' });
      } finally {
        setIsTyping(false);
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className="w-[100%] bg-black border border-gray-600 rounded-md relative overflow-hidden transition-all duration-300"
      style={{
        minHeight: isTyping ? '100px' : '32px',
        height: 'auto',
        transition: 'min-height 0.3s',
      }}
    >
      {/* Run Button */}
      <button
        className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-4 rounded transition-opacity duration-300"
        style={{
          opacity: isTyping ? 1 : 0,
        }}
        onClick={handleRunQuery}
        disabled={isLoading || !sqlQuery.trim()}
      >
        Run
      </button>
      {/* SQL Query Box */}
      <textarea
        placeholder="Type your query here..."
        value={
          isTyping
            ? sqlQuery && !isLoading
            : isLoading
              ? 'Running SQL...'
              : sqlQuery
        }
        onChange={handleChange}
        onFocus={() => setIsTyping(true)}
        onBlur={() => setIsTyping(false)}
        className="w-[100%] cursor-auto bg-black noborder rounded-md text-sm p-1 text-white 
          placeholder:text-gray-500 focus:outline-none transition-all duration-300 resize-none"
        style={{
          height: isTyping ? '100px' : '32px',
          transition: 'height 0.3s',
        }}
        rows={isTyping ? 3 : 1}
        disabled={isLoading}
      />
    </div>
  );
}

export default QueryBar;