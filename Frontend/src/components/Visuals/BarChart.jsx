import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);



const BarChart = ({ data, xAxisLabel, yAxisLabel }) => {
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
  return <Bar data={data} options={options} />;
};

export default BarChart;
