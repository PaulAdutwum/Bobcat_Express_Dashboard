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
  ChartData,
} from "chart.js";

//  Register Chart.js Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

const data: ChartData<"bar"> = {
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
        "#FFFF00",
        "#FF0000",
      ],
      borderColor: "#fff",
      borderWidth: 2,
      hoverBackgroundColor: "#881124",
    },
  ],
} as const;

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#333",
        font: { size: 14 },
      },
    },
    title: {
      display: true,
      text: "🚌 Ride Requests by Destination at Bates College",
      font: { size: 16 },
      color: "#333",
    },
  },
  scales: {
    x: {
      ticks: {
        color: "#333",
        font: { size: 12 },
      },
    },
    y: {
      ticks: {
        color: "#333",
        font: { size: 12 },
        stepSize: 1,
      },
    },
  },
} as const;

export default function StaticDestinationChart() {
  return (
    <div className="w-full shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
        📊 Ride Requests by Destination
      </h2>

      <div className="w-full h-72 flex items-center justify-center">
        <Bar data={data} options={options} />
      </div>

      <div className="mt-4 p-3 text-center text-gray-600 bg-gray-100 rounded-b-lg text-sm">
        Data represents ride requests per destination.
      </div>
    </div>
  );
}
