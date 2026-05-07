"use client";

import { useState } from "react";

interface Booking {
  id: string;
  name: string;
  contact: string;
  preferred_date: string;
  concern: string;
  status: "pending" | "confirmed" | "done";
  created_at: string;
}

type Filter = "all" | "pending" | "confirmed" | "done";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
  confirmed: { bg: "bg-blue-100",   text: "text-blue-800",   label: "Confirmed" },
  done:      { bg: "bg-green-100",  text: "text-green-800",  label: "Done" },
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/bookings", {
        headers: { Authorization: `Bearer ${password}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(data.bookings ?? []);
        setAuthed(true);
      } else {
        setAuthError(data.error ?? "Mali ang password.");
      }
    } catch {
      setAuthError("Hindi makakonekta sa server.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: status as Booking["status"] } : b))
        );
      } else {
        const data = await res.json();
        setUpdateError(data.error ?? "Hindi ma-update ang status.");
      }
    } catch {
      setUpdateError("Hindi makakonekta sa server.");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    done: bookings.filter((b) => b.status === "done").length,
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm overflow-hidden">
          <div
            className="px-6 py-5"
            style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}
          >
            <p className="text-white font-bold text-base">PESO QC Admin</p>
            <p className="text-blue-200 text-xs mt-0.5">Bookings Dashboard</p>
          </div>
          <form onSubmit={login} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
            {authError && (
              <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {authError}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}
            >
              {loading ? "Checking..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }} className="px-6 py-4 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-base">PESO QC Admin</p>
            <p className="text-blue-200 text-xs">Bookings Dashboard — {bookings.length} total</p>
          </div>
          <button
            onClick={() => { setAuthed(false); setPassword(""); setBookings([]); }}
            className="text-xs text-blue-200 hover:text-white border border-white/20 rounded-lg px-3 py-1.5 transition hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {updateError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center justify-between gap-2">
            <span>{updateError}</span>
            <button onClick={() => setUpdateError(null)} className="text-red-400 hover:text-red-600 font-bold">×</button>
          </div>
        )}
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "confirmed", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filter === f
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              <span className="capitalize">{f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}</span>
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  filter === f ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
            Walang booking sa kategoryang ito.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Concern</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((b) => {
                    const s = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending;
                    return (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{b.name}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.contact}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.preferred_date}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                          <span className="line-clamp-2" title={b.concern}>{b.concern}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                              {s.label}
                            </span>
                            {updating === b.id ? (
                              <span className="text-xs text-gray-400">Saving...</span>
                            ) : (
                              <select
                                value={b.status}
                                onChange={(e) => updateStatus(b.id, e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="done">Done</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(b.created_at).toLocaleDateString("fil-PH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
