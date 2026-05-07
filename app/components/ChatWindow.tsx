"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import BookingModal from "./BookingModal";
import { supabase } from "../../lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
  followUps?: string[];
}

const SUGGESTIONS = [
  { text: "Magkano ang minimum wage sa NCR?", color: "#dbeafe", accent: "#1d4ed8" },
  { text: "May karapatan ba akong sa 13th month pay kahit kontraktwal?", color: "#dcfce7", accent: "#16a34a" },
  { text: "Ano ang karapatan ng kasambahay?", color: "#fce7f3", accent: "#db2777" },
  { text: "Pwede ba akong i-dismiss nang walang abiso?", color: "#fef3c7", accent: "#d97706" },
];

const QUICK_STATS = [
  { label: "Min. Wage NCR", value: "₱695/day", sub: "Wage Order NCR-26" },
  { label: "SSS Rate", value: "15%", sub: "EE 5% · ER 10%" },
  { label: "PhilHealth", value: "5%", sub: "Income-based" },
  { label: "Pag-IBIG", value: "2%+2%", sub: "Min ₱200/mo" },
];

const TOPICS = [
  {
    category: "Sahod at Benepisyo",
    color: "#dbeafe", border: "#93c5fd", text: "#1e40af",
    questions: [
      "Magkano ang minimum wage sa NCR?",
      "Kailan dapat ibayad ang 13th month pay?",
      "Paano kalkulahin ang overtime pay?",
      "Ano ang night shift differential?",
    ],
  },
  {
    category: "Leaves at Pahinga",
    color: "#dcfce7", border: "#86efac", text: "#166534",
    questions: [
      "Ilan araw ang service incentive leave?",
      "Ano ang maternity leave benefits?",
      "May paternity leave ba ang lalaki?",
      "Ano ang holiday pay rules?",
    ],
  },
  {
    category: "Dismissal at Kontrata",
    color: "#fef3c7", border: "#fcd34d", text: "#92400e",
    questions: [
      "Pwede ba akong tanggalin nang walang abiso?",
      "Ano ang separation pay?",
      "Ano ang probationary employment?",
      "Illegal dismissal — ano ang dapat gawin?",
    ],
  },
  {
    category: "Kontribusyon",
    color: "#f3e8ff", border: "#c084fc", text: "#6b21a8",
    questions: [
      "Magkano ang SSS contribution ngayon?",
      "Ano ang PhilHealth contribution rate?",
      "Paano mag-compute ng Pag-IBIG?",
      "May karapatan ba sa SSS kahit kontraktwal?",
    ],
  },
  {
    category: "Kasambahay",
    color: "#fce7f3", border: "#f9a8d4", text: "#9d174d",
    questions: [
      "Ano ang karapatan ng kasambahay?",
      "Ano ang Batas Kasambahay (RA 10361)?",
      "May minimum wage ba ang kasambahay?",
      "May SSS ba ang kasambahay?",
    ],
  },
];

type Tab = "home" | "chat" | "topics" | "calculate";

function getSessionId(): string {
  let id = sessionStorage.getItem("chat_session_id");
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("chat_session_id", id); }
  return id;
}

function parseFollowUps(content: string): { clean: string; followUps: string[] } {
  const match = content.match(/FOLLOW_UP:\s*(.+)$/m);
  const followUps = match ? match[1].split("|").map((s) => s.trim()).filter(Boolean) : [];
  const clean = content.replace(/\nFOLLOW_UP:.+$/m, "").trim();
  return { clean, followUps };
}

// ── Icons ────────────────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function ThumbUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
function ThumbDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" /><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ── Pay Calculator ────────────────────────────────────────────────────────────

function Calculator() {
  const [activeCalc, setActiveCalc] = useState<"overtime" | "13thmonth" | "nsd">("overtime");
  const [result, setResult] = useState<{ label: string; amount: number; breakdown: string } | null>(null);

  // Overtime state
  const [dailyRate, setDailyRate] = useState("");
  const [otHours, setOtHours] = useState("");
  const [dayType, setDayType] = useState<"regular" | "restday">("regular");

  // 13th month state
  const [monthlySalary, setMonthlySalary] = useState("");
  const [monthsWorked, setMonthsWorked] = useState("");

  // NSD state
  const [hourlyRate, setHourlyRate] = useState("");
  const [nsdHours, setNsdHours] = useState("");

  function computeOvertime() {
    const dr = parseFloat(dailyRate);
    const ot = parseFloat(otHours);
    if (!dr || !ot || dr <= 0 || ot <= 0) return;
    const hourly = dr / 8;
    const multiplier = dayType === "regular" ? 1.25 : 1.30;
    const otPay = hourly * multiplier * ot;
    setResult({
      label: "Overtime Pay",
      amount: otPay,
      breakdown: `Hourly rate: ₱${hourly.toFixed(2)} × ${multiplier} × ${ot}h`,
    });
  }

  function compute13th() {
    const ms = parseFloat(monthlySalary);
    const mw = parseFloat(monthsWorked);
    if (!ms || !mw || ms <= 0 || mw <= 0 || mw > 12) return;
    const pay = (ms * mw) / 12;
    setResult({
      label: "13th Month Pay",
      amount: pay,
      breakdown: `(₱${ms.toFixed(2)} × ${mw} months) ÷ 12`,
    });
  }

  function computeNSD() {
    const hr = parseFloat(hourlyRate);
    const nh = parseFloat(nsdHours);
    if (!hr || !nh || hr <= 0 || nh <= 0) return;
    const nsdPay = hr * 0.10 * nh;
    setResult({
      label: "Night Shift Differential",
      amount: nsdPay,
      breakdown: `₱${hr.toFixed(2)} × 10% × ${nh}h`,
    });
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  const calcTabs = [
    { id: "overtime" as const, label: "Overtime" },
    { id: "13thmonth" as const, label: "13th Month" },
    { id: "nsd" as const, label: "Night Shift" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "#f8fafc" }}>
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pay Calculator</p>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Calc type selector */}
      <div className="grid grid-cols-3 gap-2">
        {calcTabs.map((c) => (
          <button
            key={c.id}
            onClick={() => { setActiveCalc(c.id); setResult(null); }}
            className={`flex items-center justify-center py-3 rounded-xl border text-xs font-semibold transition-all ${
              activeCalc === c.id
                ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Overtime Calculator */}
      {activeCalc === "overtime" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div>
            <p className="text-xs font-bold text-blue-800 mb-0.5">Overtime Pay</p>
            <p className="text-[11px] text-gray-400">Labor Code Art. 87 — Regular: +25% · Rest/Holiday: +30%</p>
          </div>
          <div>
            <label className={labelCls}>Daily Rate (₱)</label>
            <input type="number" min="0" placeholder="e.g. 695" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Overtime Hours</label>
            <input type="number" min="0" max="24" placeholder="e.g. 2" value={otHours} onChange={(e) => setOtHours(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Day Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "regular" as const, label: "Regular Day (+25%)" },
                { val: "restday" as const, label: "Rest/Holiday (+30%)" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDayType(opt.val)}
                  className={`text-xs py-2.5 px-3 rounded-xl border font-medium transition-all ${
                    dayType === opt.val ? "bg-blue-700 text-white border-blue-700" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={computeOvertime} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition" style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}>
            Compute
          </button>
        </div>
      )}

      {/* 13th Month Calculator */}
      {activeCalc === "13thmonth" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div>
            <p className="text-xs font-bold text-blue-800 mb-0.5">13th Month Pay</p>
            <p className="text-[11px] text-gray-400">PD 851 — (Monthly Salary × Months Worked) ÷ 12</p>
          </div>
          <div>
            <label className={labelCls}>Monthly Basic Salary (₱)</label>
            <input type="number" min="0" placeholder="e.g. 15000" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Months Worked (1–12)</label>
            <input type="number" min="1" max="12" placeholder="e.g. 12" value={monthsWorked} onChange={(e) => setMonthsWorked(e.target.value)} className={inputCls} />
          </div>
          <button onClick={compute13th} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition" style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}>
            Compute
          </button>
        </div>
      )}

      {/* NSD Calculator */}
      {activeCalc === "nsd" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div>
            <p className="text-xs font-bold text-blue-800 mb-0.5">Night Shift Differential</p>
            <p className="text-[11px] text-gray-400">Art. 86 — 10% premium for work from 10PM to 6AM</p>
          </div>
          <div>
            <label className={labelCls}>Hourly Rate (₱)</label>
            <input type="number" min="0" placeholder="e.g. 86.88" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>NSD Hours (10PM–6AM)</label>
            <input type="number" min="0" max="8" placeholder="e.g. 4" value={nsdHours} onChange={(e) => setNsdHours(e.target.value)} className={inputCls} />
          </div>
          <button onClick={computeNSD} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition" style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}>
            Compute
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-blue-700 rounded-2xl p-4 text-white shadow-md">
          <p className="text-xs font-semibold text-blue-200 mb-1">{result.label}</p>
          <p className="text-3xl font-bold tracking-tight">₱{result.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-blue-200 mt-1">{result.breakdown}</p>
          <p className="text-[10px] text-blue-300 mt-3 border-t border-blue-600 pt-2">
            For information only. Actual pay may vary. Consult PESO QC for specifics.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "up" | "down">>({});
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadHistory() {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        const parsed = (data as { role: string; content: string }[]).map((m) => {
          if (m.role === "assistant") {
            const { clean, followUps } = parseFollowUps(m.content);
            return { role: "assistant" as const, content: clean, followUps };
          }
          return { role: "user" as const, content: m.content };
        });
        setMessages(parsed);
        setActiveTab("chat");
      }
      setSessionLoaded(true);
    }
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function saveMessages(msgs: { role: string; content: string }[]) {
    const sessionId = getSessionId();
    await supabase.from("chat_sessions").insert(
      msgs.map((m) => ({ session_id: sessionId, role: m.role, content: m.content }))
    );
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setActiveTab("chat");

    const userMessage: Message = { role: "user", content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const apiMessages = updated.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (data.message != null) {
        const { clean, followUps } = parseFollowUps(data.message);
        const assistantMessage: Message = {
          role: "assistant",
          content: clean || "(walang sagot mula sa AI)",
          followUps,
        };
        setMessages([...updated, assistantMessage]);
        saveMessages([
          { role: "user", content: text },
          { role: "assistant", content: data.message },
        ]).catch(() => {});
      } else {
        throw new Error(data.error || "Empty response");
      }
    } catch {
      setMessages([...updated, {
        role: "assistant",
        content: "Paumanhin, may nangyaring error. Subukan muli o makipag-ugnayan sa PESO QC office.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  async function copyMessage(content: string, index: number) {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function clearChat() {
    const sessionId = getSessionId();
    supabase.from("chat_sessions").delete().eq("session_id", sessionId).then(() => {});
    sessionStorage.removeItem("chat_session_id");
    setMessages([]);
    setFeedback({});
    setActiveTab("home");
    setShowClearConfirm(false);
  }

  function exportChat() {
    const header = `PESO Quezon City — Labor Rights AI Conversation\n${"=".repeat(50)}\nDate: ${new Date().toLocaleDateString("fil-PH", { year: "numeric", month: "long", day: "numeric" })}\n\n`;
    const body = messages
      .map((m) => `[${m.role === "user" ? "IKAW" : "PESO QC AI"}]\n${m.content}`)
      .join("\n\n---\n\n");
    const footer = `\n\n${"=".repeat(50)}\nPara sa legal advice, makipag-ugnayan sa PESO QC office.\nHindi ito legal advice.`;
    const blob = new Blob([header + body + footer], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peso-qc-chat-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleTabSwitch(tab: Tab) {
    setActiveTab(tab);
    if (tab === "chat") setTimeout(() => inputRef.current?.focus(), 100);
  }

  if (!sessionLoaded) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading conversation...</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "chat", label: "Chat" },
    { id: "topics", label: "Topics" },
    { id: "calculate", label: "Calculate" },
  ];

  const userCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 py-2 bg-gray-50 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabSwitch(tab.id)}
            className={`relative flex items-center gap-1 flex-1 justify-center py-2 px-2 text-xs font-medium rounded-xl transition-all duration-150 ${
              activeTab === tab.id
                ? "bg-white text-blue-700 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
            }`}
          >
            <span>{tab.label}</span>
            {tab.id === "chat" && userCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none ring-2 ring-gray-50">
                {userCount > 9 ? "9+" : userCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* HOME TAB */}
      {activeTab === "home" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "#f8fafc" }}>
          <div className="rounded-2xl overflow-hidden shadow-sm border border-blue-100">
            <div style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }} className="px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white">PESO</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-white font-bold text-sm">PESO QC Labor Rights Assistant</p>
                    <span className="text-[10px] font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full px-2 py-0.5 shrink-0">AI</span>
                  </div>
                  <p className="text-blue-200 text-xs">Libre · Available 24/7 · Tagalog, English, Taglish</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed mt-3">
                Magtanong tungkol sa inyong <span className="text-white font-semibold">mga karapatan sa trabaho</span> — minimum wage, benepisyo, kontrata, at higit pa.
              </p>
            </div>
            <div className="bg-white px-3 py-3 grid grid-cols-4 gap-2 border-t border-blue-50">
              {QUICK_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-blue-800 font-bold text-xs leading-tight">{stat.value}</p>
                  <p className="text-gray-400 text-[10px] leading-tight mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mga madalas na tanong</p>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                onClick={() => sendMessage(s.text)}
                className="w-full flex items-center gap-3 text-left text-sm bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-md transition-all text-gray-700 group"
                style={{ borderLeftWidth: 3, borderLeftColor: s.accent }}
              >
                <span className="flex-1 group-hover:text-blue-700 transition-colors font-medium">{s.text}</span>
                <span className="text-gray-300 group-hover:text-blue-400 shrink-0">›</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleTabSwitch("topics")} className="flex items-center justify-center gap-2 text-sm text-blue-700 border border-blue-200 bg-blue-50 rounded-xl py-3 hover:bg-blue-100 transition font-semibold">
              All Topics
            </button>
            <button onClick={() => handleTabSwitch("calculate")} className="flex items-center justify-center gap-2 text-sm text-purple-700 border border-purple-200 bg-purple-50 rounded-xl py-3 hover:bg-purple-100 transition font-semibold">
              Calculator
            </button>
          </div>

          <p className="text-center text-[11px] text-gray-400 pb-2">Para sa legal advice, makipag-ugnayan sa PESO QC office.</p>
        </div>
      )}

      {/* CHAT TAB */}
      {activeTab === "chat" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "#f8fafc" }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #dbeafe, #eff6ff)" }}></div>
              <div>
                <p className="text-gray-600 font-semibold text-sm">Wala pang mensahe</p>
                <p className="text-gray-400 text-xs mt-1">I-type ang inyong tanong sa ibaba o pumili mula sa mga mungkahi.</p>
              </div>
              <button onClick={() => handleTabSwitch("home")} className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 hover:bg-blue-100 transition font-medium">
                Tingnan ang mga mungkahi
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center font-bold text-[11px] text-white shadow-sm mb-6" style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}>
                    AI
                  </div>
                )}
                <div className="flex flex-col max-w-[80%]">
                  {msg.role === "assistant" && <p className="text-[10px] text-gray-400 font-medium mb-1 ml-1">PESO QC Assistant</p>}
                  {msg.role === "user" && <p className="text-[10px] text-gray-400 font-medium mb-1 text-right mr-1">Ikaw</p>}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "text-white rounded-br-sm shadow-md" : "bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm prose prose-sm max-w-none"}`}
                    style={msg.role === "user" ? { background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" } : {}}
                  >
                    {msg.role === "assistant" ? <ReactMarkdown>{msg.content}</ReactMarkdown> : <span className="leading-relaxed">{msg.content}</span>}
                  </div>

                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 mt-1.5 ml-1">
                      <button
                        onClick={() => copyMessage(msg.content, i)}
                        className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all ${copiedIndex === i ? "text-emerald-600 bg-emerald-50 font-medium" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                      >
                        <CopyIcon /><span>{copiedIndex === i ? "Copied!" : "Copy"}</span>
                      </button>
                      <span className="w-px h-3 bg-gray-200" />
                      <button onClick={() => setFeedback((f) => ({ ...f, [i]: "up" }))} title="Helpful"
                        className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all ${feedback[i] === "up" ? "text-emerald-600 bg-emerald-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}>
                        <ThumbUpIcon />
                      </button>
                      <button onClick={() => setFeedback((f) => ({ ...f, [i]: "down" }))} title="Not helpful"
                        className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all ${feedback[i] === "down" ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}>
                        <ThumbDownIcon />
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 shrink-0 flex items-center justify-center text-[11px] font-bold text-gray-600 mb-6 shadow-sm">U</div>
                )}
              </div>

              {/* Follow-up chips */}
              {msg.role === "assistant" && msg.followUps && msg.followUps.length > 0 && i === messages.length - 1 && (
                <div className="ml-9 mt-2 flex flex-wrap gap-1.5">
                  {msg.followUps.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={loading}
                      className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 hover:bg-blue-100 transition font-medium disabled:opacity-50 text-left leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center font-bold text-[11px] text-white shadow-sm" style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}>AI</div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1 ml-1">PESO QC Assistant</p>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-9 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-amber-700 font-medium">Sandali lang — inaayos ng AI ang sagot. Huwag mag-refresh.</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* TOPICS TAB */}
      {activeTab === "topics" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#f8fafc" }}>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pumili ng paksa</p>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          {TOPICS.map((topic) => (
            <div key={topic.category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3" style={{ background: topic.color, borderBottom: `1px solid ${topic.border}` }}>
                <p className="font-bold text-sm" style={{ color: topic.text }}>{topic.category}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {topic.questions.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="w-full text-left text-sm text-gray-700 px-4 py-3 hover:bg-gray-50 hover:text-blue-700 transition-colors flex items-center justify-between gap-2 group">
                    <span className="leading-snug">{q}</span>
                    <span className="text-gray-300 group-hover:text-blue-400 shrink-0 text-base">›</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-center text-[11px] text-gray-400 pb-2">Hindi makita ang inyong tanong? I-type ito sa chat.</p>
        </div>
      )}

      {/* CALCULATE TAB */}
      {activeTab === "calculate" && <Calculator />}

      {/* Bottom action bar */}
      <div className="bg-white border-t border-gray-100 px-4 pt-2 pb-2">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setShowBooking(true)}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl py-2.5 px-4 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)", color: "#fff" }}
          >
            <CalendarIcon />
            <span>Mag-book ng Appointment</span>
          </button>

          {messages.length > 0 && (
            <>
              <button
                onClick={exportChat}
                title="Export chat"
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-xl px-3 py-2 transition-all hover:bg-blue-50"
              >
                <DownloadIcon />
              </button>
              {showClearConfirm ? (
                <div className="flex gap-1">
                  <button onClick={clearChat} className="text-xs text-red-600 border border-red-200 bg-red-50 rounded-xl px-3 py-2 transition-all hover:bg-red-100 font-semibold whitespace-nowrap">
                    Confirm
                  </button>
                  <button onClick={() => setShowClearConfirm(false)} className="text-xs text-gray-500 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowClearConfirm(true)} title="Clear chat"
                  className="flex items-center text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-xl px-3 py-2 transition-all hover:bg-red-50">
                  <TrashIcon />
                </button>
              )}
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Magtanong tungkol sa inyong karapatan..."
              disabled={loading}
              maxLength={500}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 bg-gray-50 transition-all leading-snug"
            />
            {input.length > 400 && (
              <span className="absolute right-3 bottom-3 text-[10px] text-gray-400">{500 - input.length}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="text-white p-3 rounded-2xl disabled:opacity-40 transition-all hover:opacity-90 flex items-center justify-center shadow-sm shrink-0"
            style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}
          >
            <SendIcon />
          </button>
        </form>
      </div>

      {showBooking && <BookingModal onClose={() => setShowBooking(false)} />}
    </div>
  );
}
