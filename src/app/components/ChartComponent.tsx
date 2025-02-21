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

// ✅ Register Chart.js Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ✅ Static Placeholder Data for Now
const labels = [
  "Walmart",
  "Target",
  "CVS",
  "CMMC Hospital",
  "Tree Street",
  "Flagship Cinema",
  "Connors Elementary School",
  "Lewiston High School",
  "Auburn Mall",
];

const rideData = [25, 18, 15, 10, 13, 11, 17, 14, 20];

const data = {
  labels,
  datasets: [
    {
      label: "🚖 Number of Rides",
      data: rideData,
      backgroundColor: [
        "#FF0000",
        "#FFFF00",
        "#008000",
        "#0000FF",
        "#FFA500",
        "#00FFFF",
        "#800080",
        "#808080",
        "#000000",
      ],
      borderColor: "#fff",
      borderWidth: 2,
      hoverBackgroundColor: "#881124", // Bobcat Exress Theme
    },
  ],
};

// Chart Options

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "#333",
        font: {
          size: 14,
          weight: "bold", // ✅ Fix: Explicitly cast the weight
        },
      },
    },
    title: {
      display: true,
      text: "🚌 Ride Requests by Destination at Bates College",
      font: {
        size: 16,
        weight: "bold", // ✅ Fix: Explicitly cast the weight
      },
      color: "#333",
    },
  },
  scales: {
    x: {
      ticks: {
        color: "#333",
        font: {
          size: 12,
          weight: "normal", // ✅ Fix: Explicitly cast the weight
        },
      },
    },
    y: {
      ticks: {
        color: "#333",
        font: {
          size: 12,
          weight: "normal", // ✅ Fix: Explicitly cast the weight
        },
        stepSize: 1,
      },
    },
  },
};

export default function StaticDestinationChart() {
  return (
    <div className="w-full shadow-lg rounded-lg border border-gray-200">
      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center"></h2>

      {/* Chart */}
      <div className="w-full h-80 md:h-72 lg:h-64 xl:h-72 flex items-center justify-center">
        <Bar data={data} options={options} />
      </div>

      {/* Footer */}
      <div className="mt-4 p-3 text-center text-gray-600 bg-gray-100 rounded-b-lg text-sm">
        Data represents ride requests per destination.
      </div>
    </div>
  );
}
