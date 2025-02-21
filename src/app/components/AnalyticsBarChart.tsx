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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Time labels (8 AM - 12 AM)
const timeLabels = [
  "8 AM",
  "10 AM",
  "12 PM",
  "2 PM",
  "4 PM",
  "6 PM",
  "8 PM",
  "10 PM",
  "12 AM",
];

const requestCounts = [5, 15, 25, 20, 18, 22, 30, 12, 8];

export default function AnalyticsBarChart() {
  return (
    <div className=" w-full h-full rounded-lg shadow-md border hover:shadow-lg transition duration-300">
      <h3 className="text-md font-semibold text-gray-900 text-center">
        Time vs Ride Requests
      </h3>
      <Bar
        data={{
          labels: timeLabels,
          datasets: [
            {
              label: "Number of Requests",
              data: requestCounts,
              backgroundColor: "#4F46E5",
            },
          ],
        }}
      />
    </div>
  );
}
