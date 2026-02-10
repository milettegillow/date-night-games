"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { WHEEL_CATEGORIES, WheelCategory } from "@/lib/types";
import { vibrate } from "@/lib/haptics";

const SEGMENT_COLORS = [
  "#2D0A1B",
  "#FFF8F0",
  "#B76E79",
  "#2D0A1B",
  "#FFF8F0",
  "#B76E79",
  "#2D0A1B",
  "#FFF8F0",
];

const SEGMENT_TEXT_COLORS = [
  "#FFF8F0",
  "#2D0A1B",
  "#FFF8F0",
  "#FFF8F0",
  "#2D0A1B",
  "#FFF8F0",
  "#FFF8F0",
  "#2D0A1B",
];

interface SpinWheelProps {
  onCategorySelected: (category: WheelCategory) => void;
  disabled?: boolean;
}

export default function SpinWheel({ onCategorySelected, disabled }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const segmentAngle = 360 / WHEEL_CATEGORIES.length;

  const spin = useCallback(() => {
    if (isSpinning || disabled) return;

    vibrate(50);
    setIsSpinning(true);

    // Random 3-5 full rotations + random offset
    const fullRotations = (3 + Math.random() * 2) * 360;
    const randomOffset = Math.random() * 360;
    const newRotation = rotation + fullRotations + randomOffset;

    setRotation(newRotation);

    // Determine which category the pointer lands on after spin
    setTimeout(() => {
      const normalizedAngle = newRotation % 360;
      const pointerAngle = (360 - normalizedAngle + segmentAngle / 2) % 360;
      const index = Math.floor(pointerAngle / segmentAngle) % WHEEL_CATEGORIES.length;

      setIsSpinning(false);
      vibrate([50, 30, 50]);
      onCategorySelected(WHEEL_CATEGORIES[index]);
    }, 4200);
  }, [isSpinning, disabled, rotation, segmentAngle, onCategorySelected]);

  const size = 300;
  const center = size / 2;
  const radius = size / 2 - 4;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  }

  function createSegmentPath(startAngle: number, endAngle: number) {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  }

  function getTextPosition(index: number) {
    const angle = index * segmentAngle + segmentAngle / 2 - 90;
    const rad = (angle * Math.PI) / 180;
    const textRadius = radius * 0.62;
    return {
      x: center + textRadius * Math.cos(rad),
      y: center + textRadius * Math.sin(rad),
      rotation: angle + 90,
    };
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Pointer at top */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "20px solid #D4A845",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        />
      </div>

      {/* Wheel */}
      <div
        ref={wheelRef}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning
            ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
            : "none",
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius + 2}
            fill="none"
            stroke="#D4A845"
            strokeWidth="3"
          />
          {WHEEL_CATEGORIES.map((category, i) => {
            const startAngle = i * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            return (
              <path
                key={category}
                d={createSegmentPath(startAngle, endAngle)}
                fill={SEGMENT_COLORS[i]}
                stroke="#D4A845"
                strokeWidth="1.5"
              />
            );
          })}
          {WHEEL_CATEGORIES.map((category, i) => {
            const pos = getTextPosition(i);
            const label =
              category.length > 14 ? category.slice(0, 12) + "…" : category;
            return (
              <text
                key={category}
                x={pos.x}
                y={pos.y}
                fill={SEGMENT_TEXT_COLORS[i]}
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${pos.rotation}, ${pos.x}, ${pos.y})`}
              >
                {label}
              </text>
            );
          })}
          <circle cx={center} cy={center} r="35" fill="#1A0A12" stroke="#D4A845" strokeWidth="2" />
        </svg>
      </div>

      {/* SPIN button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={spin}
        disabled={isSpinning || disabled}
        className="absolute font-display text-gold text-sm font-bold tracking-wider disabled:opacity-50"
        style={{ textShadow: "0 0 10px rgba(212, 168, 69, 0.5)" }}
      >
        {isSpinning ? "..." : "SPIN"}
      </motion.button>
    </div>
  );
}
