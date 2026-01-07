import React from 'react';
import LineChart from './Visuals/LineChart';
import BarChart from './Visuals/BarChart';
import PieChart from './Visuals/PieChart';

function prepareChartData(selectedData, selection) {
  if (!Array.isArray(selectedData) || selectedData.length === 0 || !selection) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const { xAxisColumn, yAxisColumn, groupByColumn, dateColumn } = selection;
  const xKey = dateColumn || xAxisColumn;
  const yKey = yAxisColumn;
  const groupKey = groupByColumn;

  // Get unique x values for x-axis
  let labels = Array.from(new Set(selectedData.map(item => item[xKey])));

  // Format labels if they are date/timestamp
  function formatDate(val) {
    if (!val) return '';
    // Try to parse as ISO string
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      // Format as 'YYYY-MM-DD HH:mm:ss'
      return d.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '');
    }
    return val;
  }
  const formattedLabels = labels.map(formatDate);

  // Get unique groups (if any)
  const groups = groupKey ? Array.from(new Set(selectedData.map(item => item[groupKey]))) : [null];

  // Assign colors for groups
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

  // For each group, build a data array aligned to all labels, fill missing with 0
  const datasets = groups.map((group, idx) => {
    const data = labels.map(label => {
      const found = selectedData.find(item => item[xKey] === label && (!groupKey || item[groupKey] === group));
      return found ? parseFloat(found[yKey]) : 0;
    });
    return {
      label: group !== null ? group : yKey,
      data,
      borderColor: colors[idx % colors.length],
      backgroundColor: bgColors[idx % bgColors.length],
      tension: 0.4,
    };
  });

  return { labels: formattedLabels, datasets };
}


const ChartViewer = ({ data: selectedData, selection, loading }) => {
  const chartType = selection?.chartType;
  const chartData = prepareChartData(selectedData, selection);
  return (
    <div className="bg-black rounded-lg p-1 max-h-[92%] overflow-auto flex items-center justify-center">
      {loading ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <svg className="animate-spin h-8 w-8 text-green-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="text-green-400">Loading chart...</span>
        </div>
      ) : (
        chartType === 'line' ? (
          <LineChart data={chartData} selection={selection} />
        ) : chartType === 'bar' ? (
          <BarChart data={chartData} selection={selection} />
        ) : chartType === 'pie' ? (
          <PieChart data={chartData} />
        ) : (
          <div className="text-green-400">Unsupported chart type</div>
        )
      )}
    </div>
  );
};

export default ChartViewer;