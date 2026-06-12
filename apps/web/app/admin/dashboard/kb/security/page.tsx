"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Shield, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { fetchWithAuth } from "../../../../../lib/api";

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  ipAddress: string;
  userAgent: string | null;
  requestPath: string | null;
  description: string | null;
  isResolved: boolean;
  createdAt: string;
}

export default function SecurityEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/kb/security/events");
      const resData = await response.json();
      if (response.ok) {
        setEvents(resData.data.events || []);
      }
    } catch (err) {
      console.error("Failed to load security logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/dashboard/kb")}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Shield className="text-red-500" size={20} /> Security Audits
            </h1>
            <p className="text-xs text-slate-400">Scans, SQL injection alerts, rate limits, and block activities</p>
          </div>
        </div>

        <button
          onClick={loadEvents}
          className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Events Log Table */}
      <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400 font-semibold mt-2">Loading security incidents...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 min-h-[300px] text-center">
            <CheckCircle size={40} className="text-green-500 mb-2" />
            <h3 className="text-sm font-bold">No Incidents Detected</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your security scanners are active and monitoring public traffic endpoints.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Time</th>
                  <th className="p-4">Incident type</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">IP Source</th>
                  <th className="p-4">Path / Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {new Date(ev.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="p-4 font-bold tracking-tight text-slate-900 dark:text-slate-100">{ev.eventType}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          ev.severity === "HIGH"
                            ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                            : ev.severity === "MEDIUM"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {ev.severity}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{ev.ipAddress}</td>
                    <td className="p-4">
                      <div className="max-w-xs truncate text-slate-600 dark:text-slate-400" title={ev.description || ""}>
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded mr-1">
                          {ev.requestPath || "/"}
                        </span>
                        {ev.description}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
