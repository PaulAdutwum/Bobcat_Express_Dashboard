"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Title, Tooltip, Legend);

// Define prop types
interface PieChartItem {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsPieChartProps {
  data: PieChartItem[];
}

export default function AnalyticsPieChart({ data }: AnalyticsPieChartProps) {
  // Map the data to chart format
  const labels = data.map((item) => item.name);
  const values = data.map((item) => item.value);
  const colors = data.map((item) => item.color);

  return (
    <Pie
      data={{
        labels: labels,
        datasets: [
          {
            label: "Number of Rides",
            data: values,
            backgroundColor: colors,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Ride Distribution",
            font: {
              size: 18,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
            color: "#6b7280",
          },
        },
      }}
      style={{ width: "100%", height: "40vh" }}
    />
  );
}
