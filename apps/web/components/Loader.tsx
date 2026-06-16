"use client";

import React, { useEffect, useState, useId } from "react";
import { motion } from "framer-motion";

export type LoaderSize = "sm" | "md" | "lg" | "xl" | number;
export type LoaderVariant = "standalone" | "overlay" | "inline";
export type LoaderTheme = "auto" | "light" | "dark";

interface LoaderProps {
  /**
   * Predefined sizes (sm=24px, md=48px, lg=80px, xl=128px) or a custom number.
   * @default "md"
   */
  size?: LoaderSize;
  /**
   * Layout presentation style.
   * @default "standalone"
   */
  variant?: LoaderVariant;
  /**
   * Adaptive theme mode.
   * @default "auto"
   */
  theme?: LoaderTheme;
  /**
   * Optional status message text.
   */
  label?: string;
  /**
   * Set to true when placed inside solid brand colored elements (e.g., primary buttons)
   * to render a white loader with white glow/shadows instead of the primary brand color.
   * @default false
   */
  contrast?: boolean;
  /**
   * If true, overlays the entire viewport (fixed), otherwise overlays the parent container (absolute).
   * Only applicable when variant is "overlay".
   * @default false
   */
  fullPage?: boolean;
  /**
   * Custom CSS classes for the container.
   */
  className?: string;
}

// Map sizes to pixel values
const SIZE_MAP = {
  sm: 24,
  md: 48,
  lg: 80,
  xl: 128,
};

/**
 * Generate keyframes for an elliptical orbit inside a 200x200 viewBox (center is 100, 100).
 */
const generateOrbitKeyframes = (
  rx: number,
  ry: number,
  steps = 16,
  startAngle = 0,
  clockwise = true
) => {
  const cx: number[] = [];
  const cy: number[] = [];
  const direction = clockwise ? 1 : -1;

  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + direction * ((i * 2 * Math.PI) / steps);
    cx.push(100 + rx * Math.cos(angle));
    cy.push(100 + ry * Math.sin(angle));
  }

  return { cx, cy };
};

/**
 * Generate keyframes for a Lissajous curve orbit (figure-8 patterns) inside a 200x200 viewBox.
 */
const generateLissajousKeyframes = (
  rx: number,
  ry: number,
  a: number,
  b: number,
  steps = 20,
  phase = 0
) => {
  const cx: number[] = [];
  const cy: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = ((i * 2 * Math.PI) / steps);
    cx.push(100 + rx * Math.sin(a * t + phase));
    cy.push(100 + ry * Math.sin(b * t));
  }

  return { cx, cy };
};

export default function Loader({
  size = "md",
  variant = "standalone",
  theme = "auto",
  label,
  contrast = false,
  fullPage = false,
  className = "",
}: LoaderProps) {
  const uniqueId = useId();
  const filterId = `liquid-goo-${uniqueId.replace(/:/g, "")}`;
  const [isDark, setIsDark] = useState(false);

  // Parse size to numeric pixel value
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 48;

  // Track theme transitions dynamically
  useEffect(() => {
    if (theme === "dark") {
      setIsDark(true);
    } else if (theme === "light") {
      setIsDark(false);
    } else {
      // Auto-detection
      const checkDark = () => {
        const hasDarkClass =
          document.documentElement.classList.contains("dark") ||
          document.body.classList.contains("dark");
        setIsDark(hasDarkClass);
      };

      checkDark();

      // Observe class list changes
      const observer = new MutationObserver(checkDark);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    }
  }, [theme]);

  // Precomputed organic orbits (viewBox coordinates: center 100, 100)
  // Droplet 1: Counter-clockwise slow ellipse
  const orbit1 = generateOrbitKeyframes(58, 42, 24, 0, false);
  // Droplet 2: Figure-8 Lissajous path (representing floaty chaotic zero-gravity path)
  const orbit2 = generateLissajousKeyframes(52, 48, 1, 2, 24, Math.PI / 4);
  // Droplet 3: Clockwise vertical-skewed ellipse
  const orbit3 = generateOrbitKeyframes(34, 58, 20, Math.PI / 3, true);
  // Droplet 4: Up & down vertical pulsing (merges and separates repeatedly)
  const orbit4 = {
    cx: Array(17).fill(100),
    cy: [100, 142, 100, 58, 100, 142, 100, 58, 100, 142, 100, 58, 100, 142, 100, 58, 100],
  };

  // Branding Colors & Styling Options
  const loaderColor = contrast ? "#FFFFFF" : "#38B1F7";
  
  // Custom shadow/glow configurations
  const glowStyle = contrast
    ? { filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))" }
    : isDark
    ? { filter: "drop-shadow(0 0 14px rgba(56, 177, 247, 0.6))" }
    : { filter: "drop-shadow(0 2px 6px rgba(56, 177, 247, 0.22))" };

  // Set up container styling based on layout variant
  let containerClasses = "";
  if (variant === "overlay") {
    containerClasses = fullPage
      ? "fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-300 " +
        (isDark ? "bg-slate-950/85 backdrop-blur-md" : "bg-white/80 backdrop-blur-md")
      : "absolute inset-0 z-10 flex flex-col items-center justify-center transition-colors duration-300 " +
        (isDark ? "bg-slate-950/80 backdrop-blur-md" : "bg-white/75 backdrop-blur-md");
  } else if (variant === "standalone") {
    containerClasses = "flex flex-col items-center justify-center text-center p-4";
  } else {
    // inline
    containerClasses = "inline-flex items-center gap-2";
  }

  // Label text styling
  const labelTextClass = contrast
    ? "text-white/95"
    : isDark
    ? "text-slate-300 font-medium"
    : "text-slate-600 font-semibold";

  const labelSizeClass =
    pixelSize < 40 ? "text-[11px]" : pixelSize < 80 ? "text-xs" : "text-sm";

  return (
    <div className={`${containerClasses} ${className}`} aria-label="Loading">
      {/* SVG Container */}
      <div
        style={{
          width: pixelSize,
          height: pixelSize,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          viewBox="0 0 200 200"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Liquid gooey metaball filter */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              {/* Blur the graphic items */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="blur" />
              {/* Increase contrast of the alpha channel to create sharp fluid boundary */}
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                result="goo"
              />
              {/* Merge original graphics back inside the gooey area for smoother sub-pixel rendering */}
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>

          {/* Liquid Orb Group */}
          <g filter={`url(#${filterId})`} style={glowStyle}>
            {/* Central Main breathing Orb */}
            <motion.circle
              cx={100}
              cy={100}
              fill={loaderColor}
              animate={{
                r: [35, 41, 35],
              }}
              transition={{
                duration: 2.2,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />

            {/* Orbiting Droplet 1 (Medium - Slow counter-clockwise ellipse) */}
            <motion.circle
              fill={loaderColor}
              animate={{
                cx: orbit1.cx,
                cy: orbit1.cy,
                r: [10, 13, 9, 11, 10],
              }}
              transition={{
                duration: 2.4,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Orbiting Droplet 2 (Small-Medium - Figure 8 Lissajous path) */}
            <motion.circle
              fill={loaderColor}
              animate={{
                cx: orbit2.cx,
                cy: orbit2.cy,
                r: [8, 11, 8, 10, 8],
              }}
              transition={{
                duration: 2.0,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Orbiting Droplet 3 (Small - Clockwise vertical ellipse) */}
            <motion.circle
              fill={loaderColor}
              animate={{
                cx: orbit3.cx,
                cy: orbit3.cy,
                r: [7, 9, 7, 8, 7],
              }}
              transition={{
                duration: 1.8,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Orbiting Droplet 4 (Very Small - Vertical Pulsing Core Droplet) */}
            <motion.circle
              fill={loaderColor}
              animate={{
                cx: orbit4.cx,
                cy: orbit4.cy,
                r: [6, 9, 6, 8, 6],
              }}
              transition={{
                duration: 2.3,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          </g>
        </svg>
      </div>

      {/* Optional Label */}
      {label && variant !== "inline" && (
        <span className={`mt-3 select-none ${labelTextClass} ${labelSizeClass} font-body tracking-wide animate-pulse`}>
          {label}
        </span>
      )}
      {label && variant === "inline" && (
        <span className={`select-none ${labelTextClass} ${labelSizeClass} font-body tracking-wide`}>
          {label}
        </span>
      )}
    </div>
  );
}
