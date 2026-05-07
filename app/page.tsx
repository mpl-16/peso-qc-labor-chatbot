import ChatWindow from "./components/ChatWindow";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0f4f8" }}>
      <header style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }} className="text-white shadow-xl">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center gap-3">
          {/* Logo avatar */}
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <span className="text-xs font-black text-white">PESO</span>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-sm leading-tight tracking-wide">PESO Quezon City</h1>
              <span className="text-[10px] font-semibold bg-white/15 border border-white/25 rounded-full px-2 py-0.5 text-blue-100 shrink-0">
                Labor Rights AI
              </span>
            </div>
            <p className="text-blue-300 text-[11px] font-medium tracking-wide mt-0.5">
              Public Employment Service Office
            </p>
          </div>

          {/* Online status */}
          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/30 rounded-full px-3 py-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span className="text-[11px] text-emerald-300 font-semibold">Online</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto" style={{ height: "calc(100vh - 108px)" }}>
        <div className="flex-1 flex flex-col bg-white shadow-xl rounded-b-2xl overflow-hidden border border-gray-200 border-t-0">
          <ChatWindow />
        </div>
      </main>

      <footer className="text-center text-[11px] text-gray-400 py-2.5 tracking-wide">
        PESO Quezon City &middot; For general information only &mdash; not legal advice &middot; 2026
      </footer>
    </div>
  );
}
