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

// Analyze table columns and suggest visualization format
export async function analyzeTableForVisualization(columns, sampleRows) {
  const promptContent = `Analyze the following database table structure and suggest the best way to visualize it as a chart.

Table Columns: ${columns.join(', ')}

Sample Data (first 3 rows):
${JSON.stringify(sampleRows, null, 2)}

Please respond with a JSON object ONLY (no other text) in this exact format:
{
  "chartType": "line|bar|pie",
  "xAxisColumn": "column_name_for_x_axis",
  "yAxisColumn": "column_name_for_y_axis",
  "groupByColumn": "column_name_for_grouping_or_null",
  "dateColumn": "column_name_if_date_exists_or_null",
  "reasoning": "brief explanation"
}

Guidelines:
- If there's a date/time column, prefer line chart with date as x-axis
- If there are categories and numeric values, consider bar or pie chart
- For trends over time, use line chart
- For comparisons between categories, use bar chart
- For proportions/percentages, use pie chart`;

  try {
    const response = await fetchPromptResponse(promptContent);
    const content = response.result || response.content || response;
    
    // Extract JSON from the response (handle cases where AI adds extra text)
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback parsing
    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing table:', error);
    // Return a default configuration if API fails
    return {
      chartType: 'line',
      xAxisColumn: columns[0],
      yAxisColumn: columns.find(col => col.toLowerCase().includes('value') || col.toLowerCase().includes('count')) || columns[1],
      groupByColumn: columns.find(col => col.toLowerCase().includes('tag') || col.toLowerCase().includes('category')) || null,
      dateColumn: columns.find(col => col.toLowerCase().includes('date') || col.toLowerCase().includes('time')) || null,
      reasoning: 'Default configuration due to API error'
    };
  }
}