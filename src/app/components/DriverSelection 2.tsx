"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const shuttleUnits = [
  { id: "65", name: "CELS Community Lewiston" },
  { id: "66", name: "CELS Lewiston & Auburn" },
  { id: "67", name: "CELS Lewiston Schools" },
  { id: "68", name: "L/A Express" },
  { id: "69", name: "Medical Transport" },
  { id: "70", name: "Safe Ride Escort" },
];

export default function DriverSelection() {
  const [selectedUnit, setSelectedUnit] = useState<string>("65");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentUnit = shuttleUnits.find((unit) => unit.id === selectedUnit);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">
        🚌 Select Your Shuttle
      </h2>

      {/* ✅ Dropdown Menu */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded-md flex justify-between items-center shadow-md hover:bg-gray-300 transition"
        >
          {currentUnit?.name}
          {dropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {dropdownOpen && (
          <ul className="absolute left-0 w-full bg-white shadow-md mt-2 rounded-md overflow-hidden z-10">
            {shuttleUnits.map((unit) => (
              <li
                key={unit.id}
                onClick={() => {
                  setSelectedUnit(unit.id);
                  setDropdownOpen(false);
                }}
                className="cursor-pointer px-4 py-3 hover:bg-gray-100 text-gray-700 transition"
              >
                {unit.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ✅ Shuttle Details (Text Below Selection) */}
      <div className="text-gray-700 text-sm mt-4 space-y-2">
        <p>
          <strong>Accessible Support:</strong> Academic & co-curricular
          transport for students with accessibility needs.
        </p>
        <p>
          <strong>8AM - 6PM:</strong> CELS Shuttle – Lewiston, Auburn, &
          Schools.
        </p>
        <p>
          <strong>8AM - 6PM:</strong> Medical Transport (schedule in advance).
        </p>
        <p>
          <strong>6PM - 9PM:</strong> Safe Ride Shuttle – TO local destinations.
        </p>
        <p>
          <strong>9PM - 12AM:</strong> Safe Ride Shuttle – FROM local
          destinations.
        </p>
        <p>
          <strong>Safe Ride Escort:</strong> Available anytime for students
          needing safety transport (1-2 passengers).
        </p>
      </div>
    </div>
  );
}
