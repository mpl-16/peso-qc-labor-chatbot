"use client";

import { useState } from "react";

interface BookingModalProps {
  onClose: () => void;
}

const PH_PHONE_REGEX = /^(09|\+639)\d{9}$/;

function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false;
  const day = new Date(dateStr + "T00:00:00").getDay();
  return day === 0 || day === 6;
}

export default function BookingModal({ onClose }: BookingModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ name: "", contact: "", concern: "", date: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (form.name.trim().length < 2) {
      next.name = "Pakisulat ang inyong buong pangalan.";
    }
    if (!PH_PHONE_REGEX.test(form.contact.trim())) {
      next.contact = "Format: 09XXXXXXXXX o +639XXXXXXXXX";
    }
    if (!form.date) {
      next.date = "Pumili ng petsa.";
    } else if (isWeekend(form.date)) {
      next.date = "Sarado ang PESO QC tuwing Sabado at Linggo. Pumili ng weekday.";
    }
    if (form.concern.trim().length < 10) {
      next.concern = "Pakipaliwanag nang mas detalyado (minimum 10 characters).";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          contact: form.contact.trim(),
          preferredDate: form.date,
          concern: form.concern.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        if (data.field && data.field !== "general") {
          setErrors({ [data.field]: data.error });
        } else {
          setErrors({ general: data.error || "May nangyaring error. Subukan muli." });
        }
      }
    } catch {
      setErrors({ general: "Hindi makakonekta sa server. Subukan muli." });
    } finally {
      setLoading(false);
    }
  }

  function fieldClass(field: string) {
    return `w-full border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 transition-all ${
      errors[field]
        ? "border-red-300 focus:ring-red-400"
        : "border-gray-200 focus:ring-blue-500"
    }`;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-bold text-white text-base leading-tight">Book an Appointment</h2>
              <p className="text-blue-200 text-xs">PESO Quezon City Office · Mon–Fri only</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Request Submitted!</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Salamat, <span className="font-semibold text-blue-800">{form.name}</span>!<br />
              Tatawagan ka ng PESO QC staff sa loob ng <strong>1–2 araw ng trabaho</strong>.
            </p>
            <button
              onClick={onClose}
              className="text-white px-8 py-2.5 rounded-xl font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                required
                type="text"
                placeholder="Juan dela Cruz"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => {
                  if (form.name.trim().length > 0 && form.name.trim().length < 2)
                    setErrors((p) => ({ ...p, name: "Pakisulat ang inyong buong pangalan." }));
                  else setErrors((p) => { const n = { ...p }; delete n.name; return n; });
                }}
                className={fieldClass("name")}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Contact */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact Number</label>
              <input
                required
                type="tel"
                placeholder="09XXXXXXXXX"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                onBlur={() => {
                  if (form.contact.trim() && !PH_PHONE_REGEX.test(form.contact.trim()))
                    setErrors((p) => ({ ...p, contact: "Format: 09XXXXXXXXX o +639XXXXXXXXX" }));
                  else setErrors((p) => { const n = { ...p }; delete n.contact; return n; });
                }}
                className={fieldClass("contact")}
              />
              {errors.contact && <p className="text-xs text-red-600 mt-1">{errors.contact}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Preferred Date</label>
              <input
                required
                type="date"
                min={today}
                value={form.date}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, date: val });
                  if (val && isWeekend(val))
                    setErrors((p) => ({ ...p, date: "Sarado ang PESO QC tuwing Sabado at Linggo. Pumili ng weekday." }));
                  else
                    setErrors((p) => { const n = { ...p }; delete n.date; return n; });
                }}
                className={fieldClass("date")}
              />
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
            </div>

            {/* Concern */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Concern / Paksa</label>
              <textarea
                required
                rows={3}
                placeholder="Ilarawan ang inyong alalahanin sa trabaho..."
                value={form.concern}
                onChange={(e) => setForm({ ...form, concern: e.target.value })}
                className={`${fieldClass("concern")} resize-none`}
              />
              {errors.concern && <p className="text-xs text-red-600 mt-1">{errors.concern}</p>}
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-xs flex items-center gap-2">
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-all hover:opacity-90 shadow-sm"
              style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 100%)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Submit Appointment Request"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
