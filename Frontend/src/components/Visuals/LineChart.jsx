import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);



const LineChart = ({ data, xAxisLabel, yAxisLabel }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#fff',
          font: { size: 11 },
          boxWidth: 30,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: (xAxisLabel || 'X').toUpperCase(),
          color: '#fff',
          font: { size: 11, weight: 'bold' },
        },
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        title: {
          display: true,
          text: (yAxisLabel || 'Y').toUpperCase(),
          color: '#fff',
          font: { size: 11, weight: 'bold' },
        },
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  };
  // Ensure each dataset is a line and lines are shown
  const chartData = {
    ...data,
    datasets: (data.datasets || []).map(ds => ({
      ...ds,
      type: 'line',
      showLine: true,
      pointRadius: 0,
      fill: false,
      borderWidth: 2,
    }))
  };
  return <Line data={chartData} options={options} />;
};

export default LineChart;
