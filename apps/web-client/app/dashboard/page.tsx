"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../lib/api';
import {
  LifeBuoy,
  Plus,
  MessageSquareCode,
  LogOut,
  FolderOpen,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader2,
  TicketIcon,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const me = await api.getMe();
        setUser(me);
        const data = await api.getTickets();
        setTickets(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
        // If unauthorized, api client redirects to /login automatically
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleLogout = async () => {
    await api.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-400" />
      </div>
    );
  }

  const activeTickets = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col">
      {/* Navbar */}
      <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-zinc-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-white text-lg">OCS Support Hub</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-zinc-400 hidden sm:inline">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-sm text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Support Dashboard</h1>
            <p className="text-zinc-400 text-sm mt-1">Submit support requests, track resolutions, and chat with AI</p>
          </div>

          <div className="flex space-x-3">
            <Link
              href="/chat"
              className="glow-btn glass-panel flex items-center px-4 py-2.5 rounded-xl text-indigo-400 font-semibold text-sm border border-indigo-500/20 hover:bg-indigo-500/10 transition-all"
            >
              <MessageSquareCode className="mr-2 h-4 w-4" /> AI Support Assistant
            </Link>
            <Link
              href="/tickets/new"
              className="glow-btn gradient-bg flex items-center px-4 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-95 transition-all"
            >
              <Plus className="mr-1.5 h-5 w-5" /> Create Ticket
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="glass-card p-5 rounded-xl flex items-center space-x-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">Total Tickets</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{tickets.length}</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl flex items-center space-x-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">Active Tickets</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{activeTickets.length}</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl flex items-center space-x-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">Resolved</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{resolvedTickets.length}</span>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="glass-panel rounded-xl shadow-xl overflow-hidden border border-zinc-800/80">
          <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between">
            <h2 className="font-bold text-white">Your Tickets</h2>
            <span className="text-xs font-semibold bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full">
              {tickets.length} total
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="px-6 py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <TicketIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white font-medium">No tickets found</p>
                <p className="text-zinc-500 text-sm mt-1">If you need help, feel free to open a ticket or start an AI chat session.</p>
              </div>
              <Link
                href="/tickets/new"
                className="gradient-bg flex items-center px-4 py-2 rounded-lg text-white font-semibold text-xs hover:opacity-95 transition-all mt-2"
              >
                Create your first ticket
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-zinc-900/30 transition-all cursor-pointer"
                >
                  <div className="space-y-1.5 pr-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm sm:text-base leading-snug">{ticket.title}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        ticket.status === 'OPEN' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        ticket.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        ticket.priority === 'LOW' ? 'bg-zinc-800 text-zinc-400' :
                        ticket.priority === 'MEDIUM' ? 'bg-blue-500/10 text-blue-400' :
                        ticket.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-zinc-400">
                      <span>Category: <strong className="text-zinc-300 font-semibold">{ticket.category}</strong></span>
                      <span>•</span>
                      <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.agent && (
                        <>
                          <span>•</span>
                          <span>Assigned Agent: <strong className="text-zinc-300 font-semibold">{ticket.agent.email}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-zinc-500">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
