"use client";

import React from "react";

interface OcsLogoProps {
  className?: string;
  color?: string; // Default blue color: #38b1f7
  style?: React.CSSProperties;
  alt?: string;
}

export default function OcsLogo({
  className = "h-7 w-auto",
  color = "#38b1f7",
  style = {},
  alt = "OCS Logo",
}: OcsLogoProps) {
  return (
    <div
      className={`inline-block shrink-0 ${className}`}
      style={{
        backgroundColor: color,
        maskImage: "url(/logo.png)",
        WebkitMaskImage: "url(/logo.png)",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        aspectRatio: "121 / 50",
        ...style,
      }}
      role="img"
      aria-label={alt}
    />
  );
}
