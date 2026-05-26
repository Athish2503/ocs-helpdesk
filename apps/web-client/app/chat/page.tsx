"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../lib/api';
import {
  LifeBuoy,
  ArrowLeft,
  Bot,
  Send,
  User,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  citations?: string[];
}

export default function AIChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your AI Support Assistant. Ask me anything about OCS Helpdesk. I can search our knowledge base to resolve your issue instantly before you open a ticket!",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState(0);
  const [resolved, setResolved] = useState<boolean | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading || resolved !== null) return;

    const userMessageText = inputText.trim();
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: userMessageText },
    ]);
    setInputText('');
    setLoading(true);
    setTurns((prev) => prev + 1);

    // Simulate AI deflection call
    setTimeout(() => {
      let replyText = '';
      let citations: string[] = [];

      const query = userMessageText.toLowerCase();
      if (query.includes('password') || query.includes('reset') || query.includes('login')) {
        replyText = "To reset your password, click on 'Forgot Password' on the login screen. You will receive an OTP email. Enter the OTP, choose a new password (min 8 characters), and submit. Note that for security, accounts are locked for 15 minutes after 5 failed login attempts.";
        citations = ['Resetting Your Account Credentials', 'Account Security and Locking Policy'];
      } else if (query.includes('upload') || query.includes('file') || query.includes('attachment')) {
        replyText = "You can attach files (images, PDFs, spreadsheets, ZIPs) to tickets and messages. The maximum size per file is 20MB. File formats supported include PNG, JPG, GIF, PDF, DOC, DOCX, XLS, XLSX, and ZIP. All uploads are stored securely on our object storage.";
        citations = ['Supported File Formats and Upload Limits'];
      } else if (query.includes('api') || query.includes('token') || query.includes('jwt')) {
        replyText = "All API requests require a valid JWT bearer token. When you login, the API returns a 15-minute expiry Access Token and a 7-day expiry Refresh Token. Our client SDK automatically uses the Refresh Token to fetch new access tokens without logging you out.";
        citations = ['API Authentication and Token Lifecycles'];
      } else {
        replyText = "I found some articles related to your question. You can configure system parameters using environment variables in your .env file, assign tickets to agents via our workload auto-assigner, and review all actions in our immutable Audit Logs dashboard. Let me know if this helps!";
        citations = ['General Helpdesk Overview', 'Auto-assignment Routing Logic'];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          citations,
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  const handleResolve = (isResolved: boolean) => {
    setResolved(isResolved);
    if (isResolved) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'resolve-success',
          sender: 'ai',
          text: "Excellent! I'm glad I could help. This session is now closed. Have a great day!",
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: 'resolve-fail',
          sender: 'ai',
          text: "I'm sorry I couldn't resolve your issue. Let me help you escalate this to a human support agent.",
        },
      ]);
    }
  };

  const handleEscalate = () => {
    // Get last user query to pre-fill the ticket description
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    const prefilledDesc = lastUserMsg ? lastUserMsg.text : '';
    router.push(`/tickets/new?desc=${encodeURIComponent(prefilledDesc)}`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col h-screen overflow-hidden">
      {/* Navbar */}
      <nav className="glass-panel px-6 py-4 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center space-x-2.5">
          <Link href="/dashboard" className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-bold tracking-tight text-white text-base flex items-center">
            <Bot className="h-5 w-5 mr-2 text-indigo-400" /> AI Support Chat
          </span>
        </div>

        <Link
          href="/dashboard"
          className="text-xs font-semibold border border-zinc-800 hover:bg-zinc-900 px-3.5 py-1.5 rounded-lg text-zinc-400 hover:text-white transition-all"
        >
          Customer Dashboard
        </Link>
      </nav>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
        <div className="max-w-3xl w-full mx-auto space-y-6 flex-1">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3.5 ${isAi ? '' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div className={`glass-card p-4 rounded-2xl max-w-xl space-y-3 ${
                  isAi ? 'border-indigo-500/10' : 'bg-indigo-500/5 border-indigo-500/15'
                }`}>
                  <div className="flex items-center space-x-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    {isAi ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        <span>AI Assistant</span>
                      </>
                    ) : (
                      <span>You</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-zinc-200 leading-relaxed">{msg.text}</p>

                  {/* Citations / Sources */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2.5 border-t border-zinc-800/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-zinc-500 font-semibold uppercase tracking-wider mr-1">Sources:</span>
                      {msg.citations.map((cite, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                          {cite}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {!isAi && (
                  <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start space-x-3.5">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <div className="glass-card p-4 rounded-2xl flex items-center space-x-2 border-indigo-500/10">
                <Loader2 className="animate-spin h-4 w-4 text-indigo-400" />
                <span className="text-zinc-400 text-xs font-medium">AI is searching knowledge articles...</span>
              </div>
            </div>
          )}

          {/* Feedback buttons for resolution */}
          {!loading && resolved === null && messages.length > 1 && (
            <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 max-w-xl mx-auto space-y-4 text-center">
              <span className="text-sm font-semibold text-white">Did this response resolve your issue?</span>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => handleResolve(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  <ThumbsUp className="h-4 w-4" /> <span>Yes, all good!</span>
                </button>
                <button
                  onClick={() => handleResolve(false)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  <ThumbsDown className="h-4 w-4" /> <span>No, not helpful</span>
                </button>
              </div>
            </div>
          )}

          {/* Escalation alert */}
          {resolved === false && (
            <div className="glass-panel p-5 rounded-2xl border border-red-500/20 max-w-xl mx-auto flex items-start space-x-3.5">
              <AlertCircle className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-white text-sm">Escalate to Support Agent</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">You can submit this chat context as a helpdesk ticket. A human agent will pick it up and resolve it.</p>
                </div>
                <button
                  onClick={handleEscalate}
                  className="glow-btn gradient-bg flex items-center py-2 px-4 rounded-xl text-white text-xs font-bold hover:opacity-95 transition-all cursor-pointer"
                >
                  Create Helpdesk Ticket <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
        <div ref={chatEndRef} />
      </div>

      {/* Message Input Form */}
      {resolved === null && (
        <div className="p-4 glass-panel border-t border-zinc-800/80 shrink-0">
          <form onSubmit={handleSendMessage} className="max-w-3xl w-full mx-auto flex items-center space-x-2.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm h-11"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="glow-btn gradient-bg h-11 w-11 rounded-xl flex items-center justify-center text-white font-semibold hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer shrink-0"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
