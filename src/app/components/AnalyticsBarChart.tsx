"use client";

import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DataPoint {
  name: string;
  value: number;
}

interface AnalyticsBarChartProps {
  data: DataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
}

export default function AnalyticsBarChart({
  data = [],
  xAxisLabel = "Category",
  yAxisLabel = "Value",
  color = "#4F46E5",
}: AnalyticsBarChartProps) {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: yAxisLabel,
        data: [] as number[],
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 35,
      },
    ],
  });

  // Update chart data when props change
  useEffect(() => {
    // Sort data by value in descending order for better visualization
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    setChartData({
      labels: sortedData.map((item) => item.name),
      datasets: [
        {
          label: yAxisLabel,
          data: sortedData.map((item) => item.value),
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 35,
        },
      ],
    });
  }, [data, xAxisLabel, yAxisLabel, color]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#ffffff",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
          title: function (context: any) {
            return context[0].label;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisLabel,
          color: "#ffffff",
        },
        ticks: {
          color: "#d1d5db",
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
          drawBorder: false,
        },
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
          color: "#ffffff",
        },
        beginAtZero: true,
        ticks: {
          color: "#d1d5db",
          font: {
            size: 11,
          },
          precision: 0,
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
    animation: {
      duration: 1000,
    },
  };

  return (
    <div className="w-full h-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
