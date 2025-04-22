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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Define prop types
interface DataPoint {
  x: number;
  y: number;
  size?: number;
}

interface AnalyticsScatterPlotProps {
  data: DataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function AnalyticsScatterPlot({
  data,
  xAxisLabel = "Time of Day (Hours)",
  yAxisLabel = "Number of Destinations",
}: AnalyticsScatterPlotProps) {
  const chartData: ChartData<"scatter"> = {
    datasets: [
      {
        label: "Shuttle Data",
        data: data,
        backgroundColor: "rgba(75, 192, 192, 0.8)", // Teal Color
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        pointRadius: data.map((point) => point.size || 5),
      },
    ],
  };

  const options: ChartOptions<"scatter"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Data Distribution",
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: xAxisLabel },
        ticks: { color: "#333", font: { weight: "bold" } },
      },
      y: {
        type: "linear",
        title: { display: true, text: yAxisLabel },
        ticks: { color: "#333", font: { weight: "bold" }, stepSize: 1 },
      },
    },
  };

  return (
    <div className="w-full h-full rounded-lg shadow-md border border-gray-200">
      {/* Title */}
      <h3 className="text-md font-semibold text-gray-700 text-center">
        📊 Shuttle Destinations Over Time
      </h3>

      {/* Scatter Chart */}
      <div className="w-full h-[400px] md:h-[350px] lg:h-[320px] xl:h-[340px] flex items-center justify-center">
        <Scatter data={chartData} options={options} />
      </div>

      {/* Footer Styling */}
      <div className="mt-4 p-3 text-center text-gray-600 bg-gray-100 rounded-b-lg text-sm">
        Data represents time vs shuttle destinations.
      </div>
    </div>
  );
}
