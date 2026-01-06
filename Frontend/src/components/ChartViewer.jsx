import React from 'react';
import LineChart from './Visuals/LineChart';

function prepareChartData(selectedData) {
  if (!Array.isArray(selectedData) || selectedData.length === 0) {
    return {
      labels: [],
      datasets: [],
    };
  }

  // Get unique dates for x-axis
  const labels = Array.from(new Set(selectedData.map(item => item.date)));

  // Get unique tags
  const tags = Array.from(new Set(selectedData.map(item => item.tag)));

  // Assign colors for tags
  const colors = [
    'rgba(34,197,94,1)',
    'rgba(59,130,246,1)',
    'rgba(244,63,94,1)',
    'rgba(251,191,36,1)',
    'rgba(168,85,247,1)',
    'rgba(16,185,129,1)',
    'rgba(239,68,68,1)'
  ];
  const bgColors = [
    'rgba(34,197,94,0.2)',
    'rgba(59,130,246,0.2)',
    'rgba(244,63,94,0.2)',
    'rgba(251,191,36,0.2)',
    'rgba(168,85,247,0.2)',
    'rgba(16,185,129,0.2)',
    'rgba(239,68,68,0.2)'
  ];

  const datasets = tags.map((tag, idx) => {
    // For each tag, get values for each label (date)
    const data = labels.map(date => {
      const found = selectedData.find(item => item.date === date && item.tag === tag);
      return found ? found.value : null;
    });
    return {
      label: tag,
      data,
      borderColor: colors[idx % colors.length],
      backgroundColor: bgColors[idx % bgColors.length],
      tension: 0.4,
    };
  });

  return { labels, datasets };
}


const ChartViewer = ({ data: selectedData, loading }) => {
  
  const chartData = prepareChartData(selectedData);
  
  return (
    <div className="bg-black rounded-lg p-1 h-[92%] overflow-auto flex items-center justify-center">
      {loading ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <svg className="animate-spin h-8 w-8 text-green-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="text-green-400">Loading chart...</span>
        </div>
      ) : (
        <LineChart data={chartData} />
      )}
    </div>
  );
};

export default ChartViewer;