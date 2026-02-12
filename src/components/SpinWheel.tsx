"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { WHEEL_CATEGORIES, WHEEL_EMOJIS, WheelCategory } from "@/lib/types";
import { vibrate } from "@/lib/haptics";

// Roulette-style: alternating red/black, Wild Card in green
const SEGMENT_COLORS = [
  "#C41E3A",  // Funny Stories — red
  "#1A1A1A",  // Big Questions — black
  "#C41E3A",  // Guilty Pleasures — red
  "#1A1A1A",  // Hot Takes — black
  "#C41E3A",  // Fears & Peeves — red
  "#1A1A1A",  // Confessions — black
  "#C41E3A",  // Situationships — red
  "#1B5E32",  // Wild Card — green (the "0")
];

const SEGMENT_TEXT_COLORS = [
  "#FFF8F0",
  "#FFF8F0",
  "#FFF8F0",
  "#FFF8F0",
  "#FFF8F0",
  "#FFF8F0",
  "#FFF8F0",
  "#FFF8F0",
];

// Full labels split into lines for the wheel
const WHEEL_LINES: Record<WheelCategory, string[]> = {
  "Funny Stories": ["Funny", "Stories"],
  "Big Questions": ["Big", "Questions"],
  "Guilty Pleasures": ["Guilty", "Pleasures"],
  "Hot Takes": ["Hot", "Takes"],
  "Fears & Peeves": ["Fears &", "Peeves"],
  "Confessions": ["Confessions"],
  "Situationships": ["Situation-", "ships"],
  "Wild Card": ["Wild", "Card"],
};

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

    // Integer full rotations (3-5) for visual satisfaction + uniform random landing
    const fullRotations = (3 + Math.floor(Math.random() * 3)) * 360;
    const randomOffset = Math.random() * 360;
    const newRotation = rotation + fullRotations + randomOffset;

    setRotation(newRotation);

    // Determine which category the pointer lands on after spin
    setTimeout(() => {
      const normalizedAngle = newRotation % 360;
      const pointerAngle = (360 - normalizedAngle) % 360;
      const index = Math.floor(pointerAngle / segmentAngle) % WHEEL_CATEGORIES.length;

      console.log("[Wheel] Spin result:", {
        totalRotation: newRotation.toFixed(1),
        mod360: normalizedAngle.toFixed(1),
        pointerAngle: pointerAngle.toFixed(1),
        segmentIndex: index,
        category: WHEEL_CATEGORIES[index],
      });

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

  function getTextPosition(index: number, radiusMultiplier: number) {
    const angle = index * segmentAngle + segmentAngle / 2 - 90;
    const rad = (angle * Math.PI) / 180;
    const textRadius = radius * radiusMultiplier;
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
          {/* Outer wooden rail ring */}
          <circle
            cx={center}
            cy={center}
            r={radius + 4}
            fill="none"
            stroke="#8B6914"
            strokeWidth="4"
          />
          {/* Inner gold ring */}
          <circle
            cx={center}
            cy={center}
            r={radius + 2}
            fill="none"
            stroke="#D4A845"
            strokeWidth="2"
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
            const lines = WHEEL_LINES[category];
            const emojiPos = getTextPosition(i, 0.85);

            // For single-line labels, place at 0.62
            // For two-line labels, place lines at 0.64 and 0.56 (tighter spacing)
            const linePositions = lines.length === 1
              ? [getTextPosition(i, 0.62)]
              : [getTextPosition(i, 0.64), getTextPosition(i, 0.56)];

            return (
              <g key={category}>
                {/* Emoji */}
                <text
                  x={emojiPos.x}
                  y={emojiPos.y}
                  fontSize="13"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${emojiPos.rotation}, ${emojiPos.x}, ${emojiPos.y})`}
                >
                  {WHEEL_EMOJIS[category]}
                </text>
                {/* Label lines */}
                {lines.map((line, li) => {
                  const pos = linePositions[li];
                  return (
                    <text
                      key={li}
                      x={pos.x}
                      y={pos.y}
                      fill={SEGMENT_TEXT_COLORS[i]}
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${pos.rotation}, ${pos.x}, ${pos.y})`}
                    >
                      {line}
                    </text>
                  );
                })}
              </g>
            );
          })}
          {/* Roulette ball pocket dots at segment boundaries */}
          {WHEEL_CATEGORIES.map((_, i) => {
            const angle = i * segmentAngle - 90;
            const rad = (angle * Math.PI) / 180;
            const dotR = radius - 2;
            return (
              <circle
                key={`dot-${i}`}
                cx={center + dotR * Math.cos(rad)}
                cy={center + dotR * Math.sin(rad)}
                r="3"
                fill="#D4A845"
                opacity="0.6"
              />
            );
          })}
          {/* Center hub */}
          <circle cx={center} cy={center} r="30" fill="#0B1A0F" stroke="#D4A845" strokeWidth="2" />
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
