"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { AddMessageSchema } from '@ocs/shared';
import {
  LifeBuoy,
  ArrowLeft,
  Paperclip,
  Send,
  Loader2,
  FileIcon,
  X,
  User,
  ShieldCheck,
  Upload,
} from 'lucide-react';

function TicketDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: number }[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async (scrollToBottom = false) => {
    try {
      const data = await api.getTicket(ticketId);
      setTicket(data);
      // Filter out internal messages for customers just in case,
      // and sort messages by creation time
      const customerVisibleMessages = (data.messages || []).filter(
        (m: any) => !m.isInternal
      );
      setMessages(customerVisibleMessages);

      if (scrollToBottom) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details');
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const me = await api.getMe();
        setUser(me);
        await fetchTicket(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [ticketId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    const file = files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20MB limit');
      return;
    }

    setUploadingFile(true);
    try {
      const result = await api.uploadFile(file);
      setAttachments((prev) => [...prev, { id: result.fileId, name: result.filename, size: result.size }]);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && attachments.length === 0) return;

    setError('');
    const messageBody = replyText.trim() || `[Sent ${attachments.length} attachment(s)]`;

    const validation = AddMessageSchema.safeParse({
      body: messageBody,
      isInternal: false,
      attachments: attachments.map((a) => a.id),
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Validation failed');
      return;
    }

    setSendingMessage(true);
    try {
      await api.addMessage(ticketId, {
        body: messageBody,
        isInternal: false,
        attachments: attachments.map((a) => a.id),
      });

      setReplyText('');
      setAttachments([]);
      await fetchTicket(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-400" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-center">
        <div className="glass-panel p-8 rounded-xl max-w-sm space-y-4">
          <p className="text-white font-semibold">Ticket not found</p>
          <Link href="/dashboard" className="gradient-bg px-4 py-2 rounded-lg text-white text-xs font-semibold hover:opacity-95 transition-all inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col h-screen overflow-hidden">
      {/* Navbar */}
      <nav className="glass-panel px-6 py-4 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center space-x-2.5">
          <Link href="/dashboard" className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white text-base">Ticket Details</span>
              <span className="text-xs text-zinc-500 font-mono">#{ticket.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            ticket.status === 'OPEN' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
            ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
            ticket.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            'bg-zinc-800 text-zinc-500'
          }`}>
            {ticket.status}
          </span>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Conversation Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/20">
          {/* Message Thread Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Initial ticket message */}
            <div className="flex items-start space-x-3.5 max-w-3xl">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="glass-card p-4 rounded-2xl space-y-2 border-indigo-500/10">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-bold text-zinc-200">You (Customer)</span>
                  <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
                <h3 className="font-bold text-white text-base leading-snug">{ticket.title}</h3>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                
                {/* Root Ticket Attachments */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800/60 mt-3 space-y-2">
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Attachments:</span>
                    {ticket.attachments.map((file: any) => (
                      <a
                        key={file.id}
                        href={`http://localhost:3000/files/${file.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-indigo-400 hover:text-indigo-300 hover:border-zinc-700 transition-all w-fit"
                      >
                        <FileIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate max-w-[200px]">{file.filename}</span>
                        <span className="text-zinc-500 text-[10px]">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Messages */}
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const senderName = isMe ? 'You' : msg.sender.role === 'AGENT' || msg.sender.role === 'SUPERVISOR' ? 'Agent Support' : msg.sender.email;

              // Filter out system message helper for attachment attachments
              if (msg.body === '[Initial Ticket Attachments]') return null;

              return (
                <div key={msg.id} className={`flex items-start space-x-3.5 max-w-3xl ${isMe ? 'ml-auto justify-end' : ''}`}>
                  {!isMe && (
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  )}

                  <div className={`glass-card p-4 rounded-2xl space-y-1.5 ${isMe ? 'bg-indigo-500/5 border-indigo-500/15' : ''}`}>
                    <div className="flex items-center justify-between gap-6 text-xs text-zinc-400">
                      <span className={`font-bold ${isMe ? 'text-indigo-400' : 'text-emerald-400'}`}>{senderName}</span>
                      <span>{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{msg.body}</p>

                    {/* Message Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="pt-2.5 border-t border-zinc-800/60 mt-2.5 space-y-1.5">
                        {msg.attachments.map((file: any) => (
                          <a
                            key={file.id}
                            href={`http://localhost:3000/files/${file.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center space-x-2 p-1.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-indigo-400 hover:text-indigo-300 transition-all w-fit"
                          >
                            <FileIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[180px]">{file.filename}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Error notice */}
          {error && (
            <div className="px-6 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Reply Form Footer */}
          <div className="p-4 glass-panel border-t border-zinc-800/80 shrink-0">
            <form onSubmit={handleSendMessage} className="space-y-3">
              {/* Attachment Preview Bar */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {attachments.map((file) => (
                    <div key={file.id} className="flex items-center space-x-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
                      <FileIcon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span className="text-white truncate max-w-[120px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        className="text-zinc-500 hover:text-white p-0.5 rounded cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2.5">
                <div className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploadingFile || sendingMessage}
                  />
                  {uploadingFile ? (
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </div>

                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={uploadingFile ? 'Uploading file...' : 'Type your reply here...'}
                  disabled={sendingMessage || uploadingFile}
                  className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm h-11"
                />

                <button
                  type="submit"
                  disabled={sendingMessage || uploadingFile || (!replyText.trim() && attachments.length === 0)}
                  className="glow-btn gradient-bg h-11 w-11 rounded-xl flex items-center justify-center text-white font-semibold hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                >
                  {sendingMessage ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Ticket Sidebar info */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800/80 p-6 space-y-6 shrink-0 bg-zinc-950/40 overflow-y-auto">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Ticket Information</h3>

          <div className="space-y-4 text-sm divide-y divide-zinc-800/60">
            <div className="pt-3 first:pt-0">
              <span className="text-zinc-500 text-xs block">Category</span>
              <strong className="text-white mt-0.5 block capitalize">{ticket.category}</strong>
            </div>

            <div className="pt-3">
              <span className="text-zinc-500 text-xs block">Priority / Urgency</span>
              <strong className="text-white mt-0.5 block capitalize">{ticket.priority.toLowerCase()}</strong>
            </div>

            <div className="pt-3">
              <span className="text-zinc-500 text-xs block">Assigned Agent</span>
              <strong className="text-white mt-0.5 block">
                {ticket.agent ? ticket.agent.email : 'Unassigned (Waiting)'}
              </strong>
            </div>

            <div className="pt-3">
              <span className="text-zinc-500 text-xs block">Creation Date</span>
              <strong className="text-white mt-0.5 block">
                {new Date(ticket.createdAt).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-400" />
      </div>
    }>
      <TicketDetailsContent />
    </Suspense>
  );
}
