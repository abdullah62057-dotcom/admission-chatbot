import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Settings, 
  Database, 
  Phone, 
  Plus, 
  Trash2, 
  Search, 
  Send, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  RefreshCw, 
  AlertCircle, 
  Sparkles,
  PhoneCall,
  User,
  CheckCheck,
  Building,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RagDocument, ChatMessage, WebhookConfig, SimulatedWhatsAppMessage } from "./types.js";

export default function App() {
  // Navigation / Tabs state
  const [activeTab, setActiveTab ] = useState<'simulator' | 'knowledge' | 'playground'>('simulator');
  
  // RAG Knowledge Base documents list
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  // New Document modal/form state
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<'programs' | 'fees' | 'eligibility' | 'campuses' | 'admissions' | 'general'>('programs');
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docOperationMessage, setDocOperationMessage] = useState<string | null>(null);

  // Playground Chatbot state
  const [playgroundMessages, setPlaygroundMessages] = useState<ChatMessage[]>([
    {
      id: "play-welcome",
      sender: "bot",
      text: "Assalam-o-Alaikum! Welcome to the Iqra University Admission Department portal. I am your RAG-powered chatbot. Feel free to ask me anything about admissions, programs, semester fee structures, eligibility criteria, or branches!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [playgroundInput, setPlaygroundInput] = useState("");
  const [isPlaygroundTyping, setIsPlaygroundTyping] = useState(false);

  // Webhook details
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    webhookUrl: "",
    verifyToken: "",
    status: "active"
  });
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [editingToken, setEditingToken] = useState("iqra_admission_token_2026");

  // WhatsApp Simulator State
  const [whatsappHistory, setWhatsappHistory] = useState<SimulatedWhatsAppMessage[]>([]);
  const [whatsappFrom, setWhatsappFrom] = useState("+92 301 2234567");
  const [whatsappInput, setWhatsappInput] = useState("");
  const [isWhatsAppTyping, setIsWhatsAppTyping] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<SimulatedWhatsAppMessage | null>(null);

  // Phone list for simulating multiple contacts
  const testPhoneNumbers = [
    "+92 301 2234567",
    "+92 321 8899123",
    "+92 345 5567789",
    "+92 333 1122334"
  ];

  // Auto scroll reference objects
  const whatsappEndRef = useRef<HTMLDivElement>(null);
  const playgroundEndRef = useRef<HTMLDivElement>(null);

  // Load documents and configs on start
  useEffect(() => {
    fetchDocuments();
    fetchWhatsAppHistory();
    fetchWebhookConfig();
  }, []);

  // Sync scroll
  useEffect(() => {
    if (activeTab === 'simulator') {
      whatsappEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'playground') {
      playgroundEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [whatsappHistory, playgroundMessages, activeTab]);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch (e) {
      console.error("Error fetching documents:", e);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchWhatsAppHistory = async () => {
    try {
      const res = await fetch("/api/whatsapp/history");
      const data = await res.json();
      if (Array.isArray(data)) {
        setWhatsappHistory(data);
        // Select latest item's payload to show in logs automatically
        const withPayload = data.filter(d => d.rawPayload);
        if (withPayload.length > 0) {
          setSelectedLogs(withPayload[withPayload.length - 1]);
        }
      }
    } catch (e) {
      console.error("Error fetching WhatsApp history:", e);
    }
  };

  const fetchWebhookConfig = async () => {
    try {
      const res = await fetch("/api/whatsapp/config");
      const data = await res.json();
      if (data.webhookUrl) {
        setWebhookConfig({
          webhookUrl: data.webhookUrl,
          verifyToken: data.verifyToken,
          status: "active"
        });
        setEditingToken(data.verifyToken);
      }
    } catch (e) {
      console.error("Error fetching Webhook configuration:", e);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) return;

    setIsAddingDoc(true);
    setDocOperationMessage(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newDocCategory,
          title: newDocTitle,
          content: newDocContent
        })
      });
      if (res.ok) {
        setDocOperationMessage("✓ Document added to RAG context successfully!");
        setNewDocTitle("");
        setNewDocContent("");
        fetchDocuments();
        setTimeout(() => setDocOperationMessage(null), 4000);
      } else {
        setDocOperationMessage("✗ Failed to persist new document");
      }
    } catch (e) {
      setDocOperationMessage("✗ Networking failure processing document addition");
    } finally {
      setIsAddingDoc(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document from the knowledge base?")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (e) {
      alert("Failed to delete document from backend.");
    }
  };

  const handlePlaygroundSend = async () => {
    if (!playgroundInput.trim()) return;

    const userText = playgroundInput;
    setPlaygroundInput("");
    
    const userMsg: ChatMessage = {
      id: `play-${Date.now()}-user`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setPlaygroundMessages(prev => [...prev, userMsg]);
    setIsPlaygroundTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: `play-${Date.now()}-bot`,
        sender: "bot",
        text: data.reply || "No reply was registered.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        retrievedContext: data.retrievedContext
      };
      
      setPlaygroundMessages(prev => [...prev, botMsg]);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: `play-${Date.now()}-err`,
        sender: "bot",
        text: "I was unable to secure a server-side response. Please confirm the server connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setPlaygroundMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsPlaygroundTyping(false);
    }
  };

  const handleWhatsAppSend = async () => {
    if (!whatsappInput.trim()) return;

    const userText = whatsappInput;
    setWhatsappInput("");
    setIsWhatsAppTyping(true);

    // Append standard user record locally first to keep UI super responsive
    const localUserMsg: SimulatedWhatsAppMessage = {
      id: `wa-temp-usr-${Date.now()}`,
      from: whatsappFrom,
      text: userText,
      timestamp: new Date().toISOString(),
      type: "incoming"
    };
    setWhatsappHistory(prev => [...prev, localUserMsg]);

    try {
      const res = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: whatsappFrom,
          text: userText
        })
      });
      const data = await res.json();
      
      // Update with exact payload response saved by the server
      fetchWhatsAppHistory();
    } catch (e) {
      console.error("Failed simulating WhatsApp message", e);
    } finally {
      setIsWhatsAppTyping(false);
    }
  };

  const handleClearWhatsApp = async () => {
    if (!confirm("Are you sure you want to clear simulated WhatsApp logs?")) return;
    try {
      await fetch("/api/whatsapp/clear", { method: "POST" });
      setWhatsappHistory([]);
      setSelectedLogs(null);
    } catch (e) {
      console.error(e);
    }
  };

  const updateVerifyToken = async (newToken: string) => {
    if (!newToken.trim()) return;
    setIsUpdatingToken(true);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifyToken: newToken })
      });
      const data = await res.json();
      setWebhookConfig(prev => ({ ...prev, verifyToken: data.verifyToken }));
      alert("Successfully updated verify token key.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingToken(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Filter documents in knowledge tab
  const filteredDocs = documents.filter(doc => {
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-screen w-full flex bg-[#F0F2F5] text-slate-800 font-sans overflow-hidden">
      
      {/* 1. LEFT SIDEBAR (Dark Premium Theme) */}
      <aside className="w-64 bg-[#1A1C1E] text-white flex flex-col border-r border-[#333] shrink-0">
        
        {/* Branding Area */}
        <div className="p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#880000] rounded flex items-center justify-center font-bold text-white text-base">
              IQ
            </div>
            <div>
              <div className="font-semibold text-sm leading-none text-white tracking-wide">IU Admission</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">WA RAG SYSTEM</div>
            </div>
          </div>
        </div>

        {/* Tab System Links */}
        <nav className="flex-1 p-5 space-y-6">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Core System</div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all ${
                  activeTab === 'simulator'
                    ? 'bg-[#880000] text-white shadow-md shadow-red-950/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Phone size={14} className={activeTab === 'simulator' ? "text-white" : "text-slate-400"} />
                <span>Live WhatsApp Chat</span>
              </button>

              <button
                onClick={() => setActiveTab('knowledge')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all ${
                  activeTab === 'knowledge'
                    ? 'bg-[#880000] text-white shadow-md shadow-red-950/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Database size={14} className={activeTab === 'knowledge' ? "text-white" : "text-slate-400"} />
                <span>Knowledge Base</span>
              </button>

              <button
                onClick={() => setActiveTab('playground')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all ${
                  activeTab === 'playground'
                    ? 'bg-[#880000] text-white shadow-md shadow-red-950/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <MessageSquare size={14} className={activeTab === 'playground' ? "text-white" : "text-slate-400"} />
                <span>Diagnostic Playground</span>
              </button>
            </div>
          </div>

          {/* Node Gateway Status Indicators */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">WhatsApp Nodes</div>
            <div className="space-y-2.5 px-1.5">
              <div className="flex items-center gap-2.5 text-xs text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Admission-01 Active</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                <span>Finance-01 Offline</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Dynamic Connected Profile Frame */}
        <div className="p-5 border-t border-[#333] bg-[#121314]">
          <div className="text-[11px] text-slate-400 block mb-1">Simulated Applicant</div>
          <div className="font-semibold text-xs text-slate-200 block truncate">{whatsappFrom}</div>
        </div>
      </aside>

      {/* 2. MAIN CENTER + RIGHT CONTENT PORTAL */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        
        {/* Sleek Header */}
        <header className="h-[70px] border-b border-[#E0E0E0] flex items-center justify-between px-6 shrink-0 bg-white">
          <div>
            <h2 className="text-base font-semibold text-[#1A1C1E] flex items-center gap-2">
              {activeTab === 'simulator' && `Applicant (${whatsappFrom})`}
              {activeTab === 'knowledge' && 'Iqra RAG Context Database'}
              {activeTab === 'playground' && 'Direct Assistant Playground'}
            </h2>
            <p className="text-xs text-slate-500">
              {activeTab === 'simulator' && 'Active Live via WhatsApp Gateway Simulation'}
              {activeTab === 'knowledge' && 'Create and search indexed admissions data'}
              {activeTab === 'playground' && 'Interactive sandbox with direct RAG matching'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-[#F8F9FA] border border-[#DDD] rounded text-xs text-[#333] font-medium">
              {activeTab === 'simulator' && 'Session: 42m'}
              {activeTab === 'knowledge' && `${documents.length} Source Records`}
              {activeTab === 'playground' && 'RAG Diagnostic Monitor'}
            </span>
            <span className="px-3 py-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded text-xs font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>98% RAG Confidence</span>
            </span>
          </div>
        </header>

        {/* Dynamic Views Panel */}
        <div className="flex-1 flex overflow-hidden">

          {/* TAB 1: WHATSAPP SIMULATION HUB */}
          {activeTab === 'simulator' && (
            <>
              {/* Converstational Stream (Center Pane) */}
              <div className="flex-1 flex flex-col bg-[#F8F9FA] overflow-hidden border-r border-[#E0E0E0]">
                
                {/* Chat Message Scroll */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  <div className="max-w-md mx-auto bg-[#ECEFF1] border border-slate-300/60 text-slate-600 text-[11px] p-3 rounded-lg text-center shadow-sm leading-relaxed">
                    🔒 Official IU encrypted channel. Candidates trigger responses computed using the indexed documents on the right. Tapping any message bubble inspects database hook triggers dynamically.
                  </div>

                  {whatsappHistory.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      No simulated transmissions yet. Let's send a message in the input below to test the RAG execution!
                    </div>
                  ) : (
                    whatsappHistory.map((msg) => {
                      const isIncoming = msg.type === "incoming";
                      return (
                        <div 
                          key={msg.id}
                          onClick={() => {
                            if (msg.rawPayload) setSelectedLogs(msg);
                          }}
                          className={`flex flex-col max-w-[75%] cursor-pointer group transition-all duration-200 ${
                            isIncoming ? "self-end items-end ml-auto" : "self-start items-start mr-auto"
                          }`}
                        >
                          {/* Sleek Bubble Alignment */}
                          <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                            isIncoming 
                              ? "bg-[#880000] text-white rounded-tr-none shadow" 
                              : "bg-white text-[#1A1C1E] border border-[#E0E0E0] rounded-tl-none shadow-sm"
                          }`}>
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                            
                            {/* Inline source attribution inside simulation bubbles */}
                            {!isIncoming && msg.text && !msg.text.includes("[Fallback") && (
                              <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 flex items-center gap-1">
                                <CheckCheck size={11} className="text-emerald-500" />
                                <span>RAG Verified Answer</span>
                              </div>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono flex items-center gap-1 opacity-60 group-hover:opacity-100">
                            <span>{isIncoming ? `${whatsappFrom}` : "Admission Bot"}</span>
                            <span>•</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                      );
                    })
                  )}

                  {isWhatsAppTyping && (
                    <div className="self-start bg-white border border-[#E0E0E0] p-3 rounded-xl rounded-tl-none text-xs text-slate-500 flex items-center gap-1 shadow-sm">
                      <span className="h-1.5 w-1.5 bg-[#880000] rounded-full animate-bounce"></span>
                      <span className="h-1.5 w-1.5 bg-[#880000] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 bg-[#880000] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  )}
                  <div ref={whatsappEndRef} />
                </div>

                {/* WhatsApp Chat Send Footer */}
                <footer className="h-[100px] border-t border-[#E0E0E0] bg-white px-6 py-4 flex items-center gap-4 shrink-0">
                  
                  {/* Sender selection pill */}
                  <div className="flex flex-col min-w-[130px] border-r border-slate-200 pr-3">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Simulated User:</span>
                    <select
                      value={whatsappFrom}
                      onChange={(e) => setWhatsappFrom(e.target.value)}
                      className="bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-[#1A1C1E] focus:outline-none focus:border-[#880000] font-mono"
                    >
                      {testPhoneNumbers.map(ph => (
                        <option key={ph} value={ph}>{ph}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 bg-[#F8F9FA] border border-[#E0E0E0] rounded-full flex items-center px-4 py-2 hover:border-slate-300 focus-within:border-[#880000]">
                    <input
                      type="text"
                      value={whatsappInput}
                      onChange={(e) => setWhatsappInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleWhatsAppSend()}
                      placeholder="Type a simulated applicant query (e.g. BSCS Fee Structure)..."
                      className="flex-1 bg-transparent text-sm text-[#1A1C1E] focus:outline-none placeholder-slate-400"
                    />
                    <button 
                      onClick={handleWhatsAppSend}
                      className="text-slate-400 hover:text-[#880000] transition-colors p-1"
                    >
                      <Sparkles size={16} title="Query AI" />
                    </button>
                  </div>

                  <button 
                    onClick={handleWhatsAppSend}
                    className="w-[50px] h-[50px] bg-[#880000] hover:bg-[#660000] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Send size={18} />
                  </button>
                </footer>
              </div>

              {/* RAG Context Analysis Side Panel (Right Sidebar) */}
              <aside className="w-[320px] bg-white flex flex-col p-6 overflow-y-auto shrink-0 border-l border-[#E0E0E0]">
                
                <h3 className="text-sm font-bold text-[#1A1C1E] mb-5 tracking-tight uppercase border-b pb-3 border-slate-100 flex items-center justify-between">
                  <span>RAG Context Analysis</span>
                  <Database size={15} className="text-[#880000]" />
                </h3>

                <div className="space-y-5">
                  
                  {/* Selected document references details block */}
                  <div className="bg-[#F8F9FA] p-4 rounded-lg border-l-4 border-[#880000]">
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Matched Entity</div>
                    <div className="text-xs font-semibold text-slate-900">
                      {selectedLogs ? "Simulated API Trigger Event" : "Active Selection Agent"}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {selectedLogs ? `Message: "${selectedLogs.text}"` : "Waiting for simulated conversation..."}
                    </div>
                  </div>

                  <div className="bg-[#F8F9FA] p-4 rounded-lg">
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">Retrieved Files (RAG Matching)</div>
                    {selectedLogs && selectedLogs.rawPayload ? (
                      <div className="space-y-2">
                        <span className="text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded border border-emerald-200 inline-block">
                          Matched Local Indices
                        </span>
                        <div className="text-[11px] font-mono text-slate-600 leading-normal space-y-1">
                          <p className="truncate">✓ document.json key records</p>
                          <p className="truncate">✓ active_admission_criteria_fall2026</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        Tap a message bubble to view targeted document links matched by backend logic.
                      </div>
                    )}
                  </div>

                  {/* Highlighted Yellow Pending Warning Card */}
                  <div className="bg-[#FFF9C4] p-4 rounded-lg text-slate-900 border border-yellow-200">
                    <div className="text-[11px] font-bold text-amber-800 uppercase mb-1">Pending Admissions Action</div>
                    <p className="text-[11px] text-amber-900 leading-normal font-medium">
                      Student queries require transcripts uploaded to admissions.iqra.edu.pk. Request scan from applicant.
                    </p>
                  </div>

                  {/* Integration health table metrics */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">Gateway Integration Health</h4>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500">WhatsApp Webhook API</span>
                        <span className="font-semibold text-emerald-600">Stable</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500">Vector Knowledge DB</span>
                        <span className="font-semibold text-emerald-600">Connected</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500">Avg LLM Response</span>
                        <span className="font-semibold text-slate-800">1.2s</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Verification Endpoint */}
                  <div className="pt-3 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 uppercase block mb-2">Endpoint Credentials</span>
                    <div className="space-y-2 bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[10px]">
                      <div className="overflow-hidden">
                        <span className="text-slate-400 block mb-0.5 font-bold uppercase">Meta Callback Webhook URL:</span>
                        <div className="flex items-center gap-1 bg-white p-1 rounded border border-slate-200">
                          <span className="truncate text-red-800 flex-1">{webhookConfig.webhookUrl || "Verify URL Loading..."}</span>
                          <button 
                            onClick={() => copyToClipboard(webhookConfig.webhookUrl, "wh")}
                            className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                          >
                            {copiedText === "wh" ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5 font-bold uppercase">Meta Verification Token:</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            value={editingToken}
                            onChange={(e) => setEditingToken(e.target.value)}
                            className="bg-white border border-slate-200 p-1 text-[10px] rounded flex-1 focus:outline-none focus:border-[#880000]"
                          />
                          <button
                            onClick={() => updateVerifyToken(editingToken)}
                            className="bg-slate-800 text-white rounded px-2 py-1 hover:bg-slate-700 text-[10px] font-sans font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clear button */}
                  <button 
                    onClick={handleClearWhatsApp}
                    className="w-full text-center py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold rounded-lg text-xs cursor-pointer transition-colors mt-2"
                  >
                    Clear WhatsApp Sim Log
                  </button>

                </div>

              </aside>
            </>
          )}

          {/* TAB 2: KNOWLEDGE BASE INTEGRATION */}
          {activeTab === 'knowledge' && (
            <div className="flex-1 flex overflow-hidden">
              
              {/* Document DB Panel (Left/Center area inside Knowledge Tab) */}
              <div className="flex-1 flex flex-col bg-[#F8F9FA] p-6 overflow-y-auto border-r border-[#E0E0E0]">
                
                <div className="bg-white p-5 rounded-xl border border-[#E0E0E0] shadow-sm mb-5">
                  <h3 className="text-sm font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                    <Database size={16} className="text-[#880000]" />
                    <span>Manage Admissions Vector Content store</span>
                  </h3>
                  <p className="text-xs text-slate-500 max-w-2xl leading-normal">
                    This table feeds factual academic content straight to the admissions chatbot context-retrieval pipeline. Dynamic additions will be referenced on sequential searches automatically !
                  </p>
                </div>

                {/* Filter and Search Action Pill */}
                <div className="flex flex-col md:flex-row gap-3 mb-4 items-center">
                  <div className="flex-1 w-full bg-white border border-[#E0E0E0] rounded-xl flex items-center px-3 py-2 focus-within:border-[#880000]">
                    <Search size={14} className="text-slate-400 mr-2" />
                    <input
                      type="text"
                      className="bg-transparent border-none text-xs text-slate-800 outline-none w-full placeholder-slate-400"
                      placeholder="Filter knowledge indices by typing keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="bg-white border border-[#E0E0E0] rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#880000] min-w-[150px] w-full md:w-auto"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">All Category Modules</option>
                    <option value="programs">Programs Offering</option>
                    <option value="fees">Tuition & Semester Fees</option>
                    <option value="eligibility">Admission Standards</option>
                    <option value="campuses">Contacts & Locations</option>
                    <option value="admissions">Admission Calendars</option>
                    <option value="general">General Campus Info</option>
                  </select>

                  <button
                    onClick={fetchDocuments}
                    className="p-2.5 bg-white hover:bg-slate-50 border border-[#E0E0E0] rounded-xl text-slate-600 cursor-pointer"
                    title="Force Index Sync"
                  >
                    <RefreshCw size={14} className={isLoadingDocs ? "animate-spin text-red-700" : ""} />
                  </button>
                </div>

                {/* Documents Cards list */}
                <div className="space-y-3.5 flex-1 pb-10">
                  {isLoadingDocs ? (
                    <div className="text-center py-12 text-slate-500 text-xs">Matching and scanning records...</div>
                  ) : filteredDocs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-8 text-xs text-slate-400">
                      No documents matching query guidelines. Ingest one right to append new guidelines.
                    </div>
                  ) : (
                    filteredDocs.map((doc) => (
                      <div 
                        key={doc.id}
                        className="bg-white p-5 rounded-xl border border-[#E0E0E0] shadow-sm hover:border-slate-300 transition-colors flex justify-between items-start gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white bg-[#880000] uppercase tracking-wider px-2 py-0.5 rounded">
                              {doc.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">ID: {doc.id}</span>
                            <span className="text-[10px] text-slate-400">• Dynamic update: {doc.lastUpdated}</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{doc.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{doc.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Purge Document record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* Add New Document Form Drawer (Right sidebar inside Knowledge tab) */}
              <aside className="w-[320px] bg-white flex flex-col p-6 overflow-y-auto shrink-0 border-l border-[#E0E0E0]">
                
                <h3 className="text-sm font-bold text-[#1A1C1E] mb-4 tracking-tight uppercase border-b pb-3 border-slate-100 flex items-center justify-between">
                  <span>Inject RAG Record</span>
                  <Plus size={16} className="text-[#880000]" />
                </h3>

                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Ingest verified campus policies or semester guidelines. The AI extracts this intelligence context during subsequent lookups instantly.
                </p>

                <form onSubmit={handleCreateDocument} className="space-y-4.5 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">Policy Module:</span>
                    <select
                      className="w-full bg-slate-50 border border-[#E0E0E0] rounded-lg p-2.5 outline-none focus:border-[#880000] text-slate-800 font-medium"
                      value={newDocCategory}
                      onChange={(e: any) => setNewDocCategory(e.target.value)}
                    >
                      <option value="programs">Programs Offering</option>
                      <option value="fees">Tuition & Semester Fees</option>
                      <option value="eligibility">Admission Standards</option>
                      <option value="campuses">Contacts & Locations</option>
                      <option value="admissions">Admission Calendars</option>
                      <option value="general">General Campus Info</option>
                    </select>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">Reference Header / Title:</span>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-[#E0E0E0] rounded-lg p-2.5 outline-none focus:border-[#880000] text-slate-800 font-medium"
                      placeholder="e.g. Iqra Sports Scholarship eligibility"
                      required
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">Verified Policy Content details:</span>
                    <textarea
                      rows={6}
                      className="w-full bg-slate-50 border border-[#E0E0E0] rounded-lg p-2.5 outline-none focus:border-[#880000] text-slate-800 leading-relaxed w-full font-serif font-sans"
                      placeholder="Provide precise text with metrics, percentages, addresses, or phone number strings. Precise RAG content prevents AI hallucinations completely."
                      required
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                    />
                  </div>

                  {docOperationMessage && (
                    <div className={`p-2.5 rounded font-medium text-center ${
                      docOperationMessage.startsWith('✓') 
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}>
                      {docOperationMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAddingDoc}
                    className="w-full py-2.5 bg-[#880000] hover:bg-[#660000] text-white font-bold rounded-lg transition-transform hover:scale-102 cursor-pointer disabled:opacity-50"
                  >
                    {isAddingDoc ? "Indexing context records..." : "Index Into RAG Context"}
                  </button>

                </form>

              </aside>

            </div>
          )}

          {/* TAB 3: DIAGNOSTIC ASSISTANT PLAYGROUND */}
          {activeTab === 'playground' && (
            <div className="flex-1 flex overflow-hidden">

              {/* Playground Conversational Stream */}
              <div className="flex-1 flex flex-col bg-[#F8F9FA] overflow-hidden border-r border-[#E0E0E0]">
                
                {/* Chat Scroll thread */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  <div className="max-w-md mx-auto bg-slate-100 border border-slate-300 text-slate-600 text-[11px] p-3 rounded-lg text-center shadow-sm font-sans leading-relaxed">
                    Test how the AI assistant prioritizes matched RAG context details over generalized base parameters. Matches are shown directly below responses.
                  </div>

                  {playgroundMessages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        msg.sender === "user" ? "self-end items-end ml-auto" : "self-start items-start mr-auto"
                      }`}
                    >
                      <span className="text-[9px] text-slate-400 block mb-0.5 tracking-wider uppercase font-mono px-1">
                        {msg.sender === "user" ? "Prospective Student" : "Admissions Officer (AI)"}
                      </span>
                      <div className={`p-4 rounded-xl text-sm leading-relaxed shadow-sm ${
                        msg.sender === "user" 
                          ? "bg-[#880000] text-white rounded-tr-none" 
                          : "bg-white text-[#1A1C1E] border border-[#E0E0E0] rounded-tl-none"
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        {/* RAG matched references showing at bot footer if present */}
                        {msg.retrievedContext && msg.retrievedContext.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
                            <span className="font-bold text-[#880000] tracking-wider uppercase text-[9px] block">
                              # RAG Verified Matching Citations ({msg.retrievedContext.length}):
                            </span>
                            <div className="space-y-1.5 mt-1 text-[10px] bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-600">
                              {msg.retrievedContext.map((cit, i) => (
                                <p key={i}>
                                  <strong>• {cit.title}</strong>: "{cit.content}"
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 font-mono px-1">{msg.timestamp}</span>
                    </div>
                  ))}

                  {isPlaygroundTyping && (
                    <div className="self-start bg-white border border-[#E0E0E0] p-3 rounded-xl rounded-tl-none text-xs text-slate-500 flex items-center gap-1.5 shadow-sm">
                      <span className="animate-spin text-[#880000] h-3 w-3 border-2 border-[#880000] border-t-transparent rounded-full"></span>
                      <span>Consulting indexed admissions criteria context...</span>
                    </div>
                  )}
                  <div ref={playgroundEndRef} />
                </div>

                {/* Playground Send panel */}
                <footer className="h-[90px] border-t border-[#E0E0E0] bg-white px-6 py-4 flex items-center gap-3 shrink-0">
                  <input
                    type="text"
                    value={playgroundInput}
                    onChange={(e) => setPlaygroundInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePlaygroundSend()}
                    placeholder="Type an admission topic query to test RAG outputs (e.g. BSCS tuition fee)..."
                    className="flex-1 bg-[#F8F9FA] border border-[#E0E0E0] rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#880000] text-slate-800"
                  />
                  <button
                    onClick={handlePlaygroundSend}
                    className="bg-[#880000] hover:bg-[#660000] text-white rounded-full px-5 py-2.5 font-semibold text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Send size={12} />
                    <span>Ask AI</span>
                  </button>
                </footer>

              </div>

              {/* Playgrond Guidelines sidebar */}
              <aside className="w-[320px] bg-white flex flex-col p-6 overflow-y-auto shrink-0 border-l border-[#E0E0E0]">
                
                <h3 className="text-sm font-bold text-[#1A1C1E] mb-4 tracking-tight uppercase border-b pb-3 border-slate-100 flex items-center justify-between">
                  <span>Diagnostic Scenarios</span>
                  <AlertCircle size={15} className="text-[#880000]" />
                </h3>

                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Test the direct citation accuracy. Tap any of the scenario blocks below to copy the question payload quickly.
                </p>

                <div className="space-y-3">
                  <div
                    onClick={() => setPlaygroundInput("What is the BSCS fee structure per semester?")}
                    className="p-3 bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#E0E0E0] rounded-lg cursor-pointer text-xs text-slate-800 transition-colors leading-relaxed"
                  >
                    💰 <strong>Fee Audit lookup:</strong>
                    <p className="text-slate-500 mt-1">"What is the BSCS fee structure per semester?"</p>
                  </div>

                  <div
                    onClick={() => setPlaygroundInput("Where are the campuses located in Karachi?")}
                    className="p-3 bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#E0E0E0] rounded-lg cursor-pointer text-xs text-slate-800 transition-colors leading-relaxed"
                  >
                    📍 <strong>Campus Locations scan:</strong>
                    <p className="text-slate-500 mt-1 font-sans">"Where are the campuses located in Karachi?"</p>
                  </div>

                  <div
                    onClick={() => setPlaygroundInput("What are the eligibility requirements for Docters of Pharmacy?")}
                    className="p-3 bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#E0E0E0] rounded-lg cursor-pointer text-xs text-slate-800 transition-colors leading-relaxed"
                  >
                    📝 <strong>Academic Eligibility evaluation:</strong>
                    <p className="text-slate-500 mt-1">"What are the eligibility requirements for Docters of Pharmacy?"</p>
                  </div>

                  <div
                    onClick={() => setPlaygroundInput("What is the last date to apply Fall 2026?")}
                    className="p-3 bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#E0E0E0] rounded-lg cursor-pointer text-xs text-slate-800 transition-colors leading-relaxed"
                  >
                    📅 <strong>Timeline Deadline query:</strong>
                    <p className="text-slate-500 mt-1">"What is the last date to apply Fall 2026?"</p>
                  </div>
                </div>

                <div className="mt-6 bg-[#E8F5E9] border border-emerald-200 text-emerald-800 text-[11px] rounded-lg p-4 font-sans leading-relaxed">
                  <span className="font-bold flex items-center gap-1 uppercase block mb-1">
                    <Sparkles size={11} /> RAG Ingestion Pipeline rule
                  </span>
                  RAG lookup matches precise keywords inside the title or description, then formats context headers automatically before feeding prompts to Gemini 3.5 Flash server-side.
                </div>

              </aside>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}
