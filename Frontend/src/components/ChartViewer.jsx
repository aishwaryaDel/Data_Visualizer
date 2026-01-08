import React from 'react';
import LineChart from './Visuals/LineChart';
import BarChart from './Visuals/BarChart';
import PieChart from './Visuals/PieChart';


function prepareChartData(selectedData, selection) {
  if (
    !selectedData ||
    !Array.isArray(selectedData.rows) ||
    selectedData.rows.length === 0 ||
    !selection ||
    !selection.selectedChartDetails
  ) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const { type, xCol, yCol, groupCol } = selection.selectedChartDetails;
  const rows = selectedData.rows;

  // Get unique x values for x-axis
  let labels = Array.from(new Set(rows.map(item => item[xCol])));

  // Format labels if they are date/timestamp
  function formatDate(val) {
    if (!val) return '';
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).replace(',', '');
    }
    return val;
  }
  const formattedLabels = labels.map(formatDate);

  // For pie chart, just one dataset
  if (type === 'pie') {
    return {
      labels: formattedLabels,
      datasets: [
        {
          label: yCol,
          data: labels.map(label => {
            const found = rows.find(item => item[xCol] === label);
            return found ? parseFloat(found[yCol]) : 0;
          }),
          backgroundColor: [
            'rgba(34,197,94,0.7)', 'rgba(59,130,246,0.7)', 'rgba(244,63,94,0.7)',
            'rgba(251,191,36,0.7)', 'rgba(168,85,247,0.7)', 'rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'
          ]
        }
      ]
    };
  }

  // For line/bar chart, support groupCol for multi-series
  if (groupCol) {
    // Get unique group values
    const groupValues = Array.from(new Set(rows.map(item => item[groupCol])));
    // Assign colors for each group
    const colorPalette = [
      'rgba(34,197,94,0.7)', 'rgba(59,130,246,0.7)', 'rgba(244,63,94,0.7)',
      'rgba(251,191,36,0.7)', 'rgba(168,85,247,0.7)', 'rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'
    ];
    const datasets = groupValues.map((group, idx) => ({
      label: group,
      data: labels.map(label => {
        const found = rows.find(item => item[xCol] === label && item[groupCol] === group);
        return found ? parseFloat(found[yCol]) : 0;
      }),
      borderColor: colorPalette[idx % colorPalette.length],
      backgroundColor: colorPalette[idx % colorPalette.length],
      tension: 0.4,
    }));
    return {
      labels: formattedLabels,
      datasets,
    };
  }

  // For line/bar chart, one dataset (no group)
  return {
    labels: formattedLabels,
    datasets: [
      {
        label: yCol,
        data: labels.map(label => {
          const found = rows.find(item => item[xCol] === label);
          return found ? parseFloat(found[yCol]) : 0;
        }),
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.2)',
        tension: 0.4,
      }
    ]
  };
}


const ChartViewer = ({ data: selectedData, selection, loading }) => {
  const chartType = selection?.selectedChartDetails?.type;
  const chartData = prepareChartData(selectedData, selection);
  // Get axis labels from selection
  const xAxisLabel = selection?.selectedChartDetails?.xCol || 'X';
  const yAxisLabel = selection?.selectedChartDetails?.yCol || 'Y';
  
  return (
    <div className="bg-black rounded-lg p-1 max-h-[92%] overflow-auto flex items-center justify-center">
      {loading ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <svg className="animate-spin h-20 w-8 text-green-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="text-green-400">Loading chart...</span>
        </div>
      ) : (
        chartType === 'line' ? (
          <LineChart data={chartData} xAxisLabel={xAxisLabel} yAxisLabel={yAxisLabel} selection={selection} />
        ) : chartType === 'bar' ? (
          <BarChart data={chartData} xAxisLabel={xAxisLabel} yAxisLabel={yAxisLabel} selection={selection} />
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