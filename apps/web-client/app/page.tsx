import Link from 'next/link';
import { LifeBuoy, ArrowRight, Bot, ShieldCheck, Cpu, HelpCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col relative overflow-hidden">
      {/* Background radial gradients for premium depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[130px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[130px]" />
      </div>

      {/* Header */}
      <header className="glass-panel w-full px-6 py-4 flex items-center justify-between border-b border-zinc-800/80 z-10">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-white text-lg">OCS Support Hub</span>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-semibold text-zinc-300 hover:text-white transition-all">
            Sign In
          </Link>
          <Link
            href="/register"
            className="glow-btn gradient-bg px-4 py-2 rounded-xl text-white font-semibold text-xs hover:opacity-95 transition-all"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto z-10 space-y-10">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mx-auto">
            <Bot className="h-4 w-4" /> <span>Next-Gen Helpdesk Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            AI-First Support. <br />
            <span className="gradient-text">Instant Resolutions.</span>
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Get instant answers to your support queries using our AI Assistant, or open and track tickets with our support specialist team.
          </p>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
          <Link
            href="/chat"
            className="glow-btn gradient-bg w-full flex items-center justify-center py-3.5 px-6 rounded-xl text-white font-bold text-sm hover:opacity-95 transition-all"
          >
            Ask AI Assistant <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="w-full flex items-center justify-center py-3.5 px-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-sm transition-all"
          >
            Submit Helpdesk Ticket
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-zinc-800/40 w-full">
          <div className="glass-card p-5 rounded-xl text-left space-y-2 border border-zinc-800/40">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Cpu className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-bold text-white text-sm">AI Deflection</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">Our AI agent searches articles and resolves support issues instantly before a ticket is created.</p>
          </div>

          <div className="glass-card p-5 rounded-xl text-left space-y-2 border border-zinc-800/40">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-bold text-white text-sm">Secure Authentication</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">OTP email verifications, passwords hashed via bcrypt, and RBAC authorization tokens.</p>
          </div>

          <div className="glass-card p-5 rounded-xl text-left space-y-2 border border-zinc-800/40">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <HelpCircle className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-bold text-white text-sm">Real-time Dashboard</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">Track ticket updates, upload attachments, and chat directly with assigned support agents.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-zinc-900 bg-zinc-950/20 text-center text-xs text-zinc-500 z-10 shrink-0">
        © 2026 OCS Helpdesk SaaS Platform. All rights reserved.
      </footer>
    </div>
  );
}
