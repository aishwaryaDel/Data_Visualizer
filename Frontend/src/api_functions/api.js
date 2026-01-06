import axios from 'axios';

export async function fetchPromptResponse(promptContent) {
  const data = JSON.stringify({
    messages: [
      {
        role: 'user',
        content: promptContent
      }
    ],
    web_access: false
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://chatgpt-42.p.rapidapi.com/gpt4o',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
      'x-rapidapi-key': '777aaa9188msh918d63edccf6010p10f48ajsn4410e2e906ad'
    },
    data: data
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    throw error;
  }
}