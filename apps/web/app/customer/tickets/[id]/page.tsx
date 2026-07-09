"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function TicketRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  useEffect(() => {
    if (id) {
      router.replace(`/customer/dashboard?ticketId=${id}`);
    } else {
      router.replace("/customer/dashboard");
    }
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#38b1f7] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-400">Loading your ticket...</p>
      </div>
    </div>
  );
}
