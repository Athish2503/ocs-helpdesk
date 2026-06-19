"use client";

import React, { useEffect, useState } from "react";
import Loader from "../components/Loader";

export default function RootLoading() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const hasDarkClass =
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark");
    setIsDark(hasDarkClass);
  }, []);

  return (
    <div
      className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#020617]" : "bg-slate-50"
      }`}
    >
      <Loader
        size="xl"
        theme={isDark ? "dark" : "light"}
        label="Loading OCS Helpdesk..."
      />
    </div>
  );
}
