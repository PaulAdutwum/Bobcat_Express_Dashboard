"use client";

import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";

// ✅ Register Chart.js Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// ✅ Example Data (Time vs Destinations)
const destinationScatterData: ChartData<"scatter"> = {
  datasets: [
    {
      label: "Shuttle Destinations Over Time",
      data: [
        { x: 8, y: 1 },
        { x: 10, y: 4 },
        { x: 12, y: 3 },
        { x: 14, y: 5 },
        { x: 16, y: 2 },
        { x: 18, y: 6 },
        { x: 20, y: 4 },
        { x: 22, y: 3 },
        { x: 24, y: 2 },
      ],
      backgroundColor: "rgba(75, 192, 192, 0.8)", // Teal Color
      borderColor: "rgba(75, 192, 192, 1)",
      borderWidth: 2,
    },
  ],
};

// ✅ FIX: Explicitly define `options` using `ChartOptions<"scatter">`
const options: ChartOptions<"scatter"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: {
      display: true,
      text: "📍 Time vs Destinations",
      font: { size: 16 },
    },
  },
  scales: {
    x: {
      type: "linear", // ✅ FIX: Ensure this is set for scatter charts
      title: { display: true, text: "Time of Day (Hours)" },
      ticks: { color: "#333", font: { weight: "bold" } },
    },
    y: {
      type: "linear", // ✅ FIX: Ensure this is set for scatter charts
      title: { display: true, text: "Number of Destinations" },
      ticks: { color: "#333", font: { weight: "bold" }, stepSize: 1 },
    },
  },
};

export default function AnalyticsScatterPlot() {
  return (
    <div className="w-full h-full rounded-lg shadow-md border border-gray-200">
      {/* Title */}
      <h3 className="text-md font-semibold text-gray-700 text-center">
        📊 Shuttle Destinations Over Time
      </h3>

      {/* Scatter Chart */}
      <div className="w-full h-[400px] md:h-[350px] lg:h-[320px] xl:h-[340px] flex items-center justify-center">
        <Scatter data={destinationScatterData} options={options} />
      </div>

      {/* Footer Styling */}
      <div className="mt-4 p-3 text-center text-gray-600 bg-gray-100 rounded-b-lg text-sm">
        Data represents time vs shuttle destinations.
      </div>
    </div>
  );
}
