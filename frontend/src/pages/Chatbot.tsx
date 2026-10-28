import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Upload, FileText, Send, AlertCircle, Sparkles, BookOpen, CheckCircle, Info } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  sources?: { filename: string; page: number; score?: number }[];
  passages?: string[];
  ai_generated?: boolean;
  note?: string;
}

interface DocStoreInfo {
  total_chunks: number;
  documents: string[];
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hello! I am your Academic Advisor AI. You can upload academic documents (syllabus PDFs, notes, curriculum guidelines) and ask questions about them. What would you like to explore today?',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Document upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [docStore, setDocStore] = useState<DocStoreInfo>({ total_chunks: 0, documents: [] });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchDocStatus = () => {
    api.get('/documents/status')
      .then(res => setDocStore(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchDocStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadMsg({ type: 'error', text: 'Please select a valid PDF file.' });
      return;
    }

    setUploading(true);
    setUploadMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then(res => {
        const doc = res.data.document;
        setUploadMsg({
          type: 'success',
          text: `Uploaded "${doc.filename}" (${doc.total_pages} pages, ${doc.chunks_created} chunks indexed).`,
        });
        setFile(null);
        fetchDocStatus();
      })
      .catch(err => {
        setUploadMsg({
          type: 'error',
          text: err.response?.data?.detail || err.message,
        });
      })
      .finally(() => setUploading(false));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    api.post('/chat', { question: userText })
      .then(res => {
        const data = res.data;
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: data.answer,
            sources: data.sources,
            passages: data.passages,
            ai_generated: data.ai_generated,
            note: data.note,
          },
        ]);
      })
      .catch(err => {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `Error processing your inquiry: ${err.response?.data?.detail || err.message}`,
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Academic AI Chatbot (RAG)</h2>
        <p className="text-sm text-gray-500 mt-1">
          Retrieval-Augmented Generation for answering questions from syllabus, curriculum guidelines, and academic notes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Document Upload & Index Status (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Upload Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900 text-base">Upload Document</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Add course syllabus, academic policy, or subject notes in PDF format.
            </p>

            {uploadMsg && (
              <div className={`p-3 rounded-lg text-xs mb-3 flex items-start gap-1.5 ${
                uploadMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {uploadMsg.type === 'success' ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{uploadMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-3">
              <input
                type="file"
                accept=".pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {uploading ? 'Extracting & Indexing Text...' : 'Upload & Process PDF'}
              </button>
            </form>
          </div>

          {/* Active Documents Store */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm">Indexed Knowledge Base</h4>
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                {docStore.total_chunks} chunks
              </span>
            </div>

            {docStore.documents && docStore.documents.length > 0 ? (
              <ul className="space-y-2">
                {docStore.documents.map((name, idx) => (
                  <li key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span className="truncate font-medium text-gray-800">{name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 italic py-2">
                No documents uploaded yet. Upload a syllabus or curriculum PDF above to start querying.
              </p>
            )}
          </div>

          {/* LLM Status Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-gray-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-gray-800">
              <Info className="h-4 w-4 text-indigo-600" />
              <span>Offline & API Hybrid Operation</span>
            </div>
            <p className="leading-relaxed">
              If an <code>LLM_API_KEY</code> is set in <code>.env</code>, questions are answered via Google Gemini.
              Without an API key, the system extracts and displays the top matching text passages directly with source citations.
            </p>
          </div>
        </div>

        {/* Right Column: Chat Interface (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-gray-800 text-sm">Advisor Knowledge Assistant</span>
            </div>
            <span className="text-xs text-gray-500">Document Retrieval Engine</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 text-gray-900 rounded-bl-none border border-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Passages fallback */}
                  {m.passages && m.passages.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2">
                      <p className="text-xs font-semibold text-gray-700">Relevant Document Excerpts:</p>
                      {m.passages.map((p, pIdx) => (
                        <blockquote
                          key={pIdx}
                          className="bg-white/80 p-2.5 rounded border border-gray-200 text-xs italic text-gray-700"
                        >
                          "{p}"
                        </blockquote>
                      ))}
                    </div>
                  )}

                  {/* Sources Citations */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] font-semibold text-gray-500">Citations:</span>
                      {m.sources.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 text-[11px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono"
                        >
                          <BookOpen className="h-3 w-3 text-indigo-500" />
                          {s.filename} (p. {s.page})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Optional note */}
                  {m.note && (
                    <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded">
                      {m.note}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-gray-500 text-xs py-2">
                <div className="animate-spin h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                <span>Searching knowledge base and formulating answer...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white rounded-b-xl flex gap-2">
            <input
              type="text"
              placeholder={docStore.total_chunks > 0 ? "Ask a question about the uploaded document..." : "Upload a PDF document first, or ask general academic guidance..."}
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
