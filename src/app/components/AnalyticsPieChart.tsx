"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Title, Tooltip, Legend);

const driverLabels = [
  "Driver 65",
  "Driver 66",
  "Driver 67",
  "Driver 68",
  "Driver 69",
  "Driver 70",
];

const driverRides = [15, 20, 30, 10, 25, 12];

export default function AnalyticsPieChart() {
  return (
    <Pie
      data={{
        labels: driverLabels,
        datasets: [
          {
            label: "Number of Rides",
            data: driverRides,
            backgroundColor: [
              "#3B82F6",
              "#EF4444",
              "#22C55E",
              "#EAB308",
              "#9333EA",
              "#F97316",
            ],
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: " Driver Ride Distribution",
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
