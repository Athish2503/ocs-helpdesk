"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateTicketSchema } from '@ocs/shared';
import { api } from '../../lib/api';
import {
  LifeBuoy,
  ArrowLeft,
  ChevronRight,
  UploadCloud,
  FileIcon,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function NewTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [category, setCategory] = useState('technical');
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: number }[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    const file = files[0];
    if (!file) return;

    // 20MB limit (complying with FR-FILE-03)
    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20MB limit');
      return;
    }

    setUploadingFile(true);
    try {
      const result = await api.uploadFile(file);
      setAttachments((prev) => [...prev, { id: result.fileId, name: result.filename, size: result.size }]);
    } catch (err: any) {
      setError(err.message || 'File upload failed. Ensure server and MinIO are running.');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side schema validation
    const validation = CreateTicketSchema.safeParse({ title, description, priority, category });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Validation failed');
      return;
    }

    setSubmitLoading(true);
    try {
      const ticket = await api.createTicket({
        title,
        description,
        priority,
        category,
      });

      // If we have uploaded attachments, we bind them via the first message in the thread
      if (attachments.length > 0) {
        await api.addMessage(ticket.id, {
          body: `[Initial Ticket Attachments]`,
          attachments: attachments.map((a) => a.id),
        });
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col">
      {/* Navbar */}
      <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-zinc-800/80">
        <div className="flex items-center space-x-2.5">
          <Link href="/dashboard" className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-bold tracking-tight text-white text-lg">New Support Ticket</span>
        </div>
      </nav>

      {/* Form Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Open a Support Ticket</h1>
            <p className="text-zinc-400 text-sm mt-1">Provide clear details. We will auto-route this to the right specialist.</p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Ticket Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue (e.g. Cannot log in to dashboard)"
                className="block w-full px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm cursor-pointer"
                >
                  <option value="technical">Technical Support</option>
                  <option value="billing">Billing & Subscriptions</option>
                  <option value="account">Account Access</option>
                  <option value="other">General Query</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Urgency / Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm cursor-pointer"
                >
                  <option value="LOW">Low - General query</option>
                  <option value="MEDIUM">Medium - Normal issue</option>
                  <option value="HIGH">High - Critical workflow blocked</option>
                  <option value="URGENT">Urgent - Complete service outage</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Detailed Description
              </label>
              <textarea
                id="description"
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the issue in detail, including steps to reproduce, error codes, and what you have tried so far..."
                className="block w-full px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-y"
              />
            </div>

            {/* File Uploader */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Attachments (Optional - max 20MB)
              </label>
              
              <div className="relative border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploadingFile}
                />
                
                {uploadingFile ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-400" />
                    <span className="text-zinc-400 text-xs font-medium">Uploading attachment to object storage...</span>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 flex items-center justify-center text-zinc-500 transition-all">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Click or drag file to upload</p>
                      <p className="text-zinc-500 text-xs mt-0.5">Supports PNG, JPG, PDF, ZIP (Max 20MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Uploaded attachments list */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
                      <div className="flex items-center space-x-2 pr-4 min-w-0">
                        <FileIcon className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span className="text-white font-medium truncate">{item.name}</span>
                        <span className="text-zinc-500">({(item.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(item.id)}
                        className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded transition-all cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <Link
                href="/dashboard"
                className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 font-semibold text-sm hover:text-white hover:bg-zinc-900 transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitLoading || uploadingFile}
                className="glow-btn gradient-bg flex items-center py-2.5 px-6 rounded-xl text-white font-semibold text-sm hover:opacity-95 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  'Submit Ticket'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
