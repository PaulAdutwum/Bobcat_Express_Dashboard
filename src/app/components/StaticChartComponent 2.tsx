"use client";

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

// Register necessary chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Sample Data (Static)
const destinations = [
  "Dorms",
  "Library",
  "Mall",
  "Downtown",
  "Lewiston High School",
  "CMMC",
  "Tree Street",
  "Walmart",
  "Auburn Mall",
  "Target",
  "Connors Elementary School",
  "CVS",
  "Flagship Cinema",
  "Shaws",
  "Walgreens",
  "Salvation Army",
];

const rideRequests = [
  25, 18, 30, 12, 14, 20, 10, 35, 40, 22, 19, 8, 12, 9, 7, 5,
];

const data = {
  labels: destinations,
  datasets: [
    {
      label: "Ride Requests",
      data: rideRequests,
      backgroundColor: [
        "#3b82f6",
        "#ef4444",
        "#22c55e",
        "#eab308",
        "#6366f1",
        "#ec4899",
        "#f97316",
        "#14b8a6",
        "#8b5cf6",
        "#f43f5e",
        "#10b981",
        "#d946ef",
        "#4ade80",
        "#a855f7",
        "#0ea5e9",
        "#9333ea",
      ],
    },
  ],
};

export default function StaticChartComponent() {
  return (
    <div className=" shadow-md rounded-lg">
      <h2 className="text-lg font-bold text-gray-400 mb-4 text-center">
        Shuttle Ride Analytics (Static)
      </h2>
      <Bar data={data} />
    </div>
  );
}
