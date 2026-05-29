"use client";

import { useEffect, useState, useRef, useMemo } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  currencySymbol?: string;
  formatAsK?: boolean;
}

export function AnimatedCounter({
  value,
  duration = 500,
  currencySymbol = "₹",
  formatAsK = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = prevValueRef.current;
    const endValue = value;

    if (startValue === endValue) return;

    let animationFrameId: number;

    const updateCounter = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // easeOutQuad easing
      const easedProgress = progress * (2 - progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        prevValueRef.current = endValue;
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formatted = useMemo(() => {
    if (formatAsK) {
      if (displayValue >= 100000) {
        return `${currencySymbol}${(displayValue / 100000).toFixed(2).replace(/\.00$/, "")}L`;
      }
      if (displayValue >= 1000) {
        return `${currencySymbol}${(displayValue / 1000).toFixed(2).replace(/\.00$/, "")}K`;
      }
    }
    return `${currencySymbol}${Math.round(displayValue).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;
  }, [displayValue, currencySymbol, formatAsK]);

  return <>{formatted}</>;
}
