"use client";

import { useEffect, useRef } from "react";

export default function useReadTracking(articleId: string) {
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);
  const articleIdRef = useRef<string>(articleId);

  useEffect(() => {
    articleIdRef.current = articleId;
  }, [articleId]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    maxScrollRef.current = 0;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const percentage = Math.round((scrollTop / scrollHeight) * 100);
        if (percentage > maxScrollRef.current) {
          maxScrollRef.current = Math.min(percentage, 100);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const sendTelemetry = () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000); // seconds
      const maxScroll = maxScrollRef.current;
      const currentId = articleIdRef.current;

      if (!currentId || duration < 1) return; // Ignore single-second view bounces

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const url = `${API_URL}/kb/public/articles/${currentId}/read`;
      const payload = JSON.stringify({
        readDuration: duration,
        scrollDepth: maxScroll,
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch((err) => console.error("Telemetry send failed:", err));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendTelemetry();
      }
    };

    const handleBeforeUnload = () => {
      sendTelemetry();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      sendTelemetry();
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [articleId]);
}
