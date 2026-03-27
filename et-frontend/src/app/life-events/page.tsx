"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { LIFE_EVENTS } from "@/lib/constants";
import { Calendar, Sparkles, Check, Clock } from "lucide-react";

interface InvestmentRec { instrument: string; amount: number; reason: string; urgency: string }
interface ChecklistItem { item: string; completed: boolean; deadline?: string }
interface EventAdvice {
  summary: string;
  tax_implications: string;
  investment_recommendations: InvestmentRec[];
  action_checklist: ChecklistItem[];
}

export default function LifeEventsPage() {
  useAuth();
  const [selectedEvent, setSelectedEvent] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [advice, setAdvice] = useState<EventAdvice | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedEvent) return;
    setLoading(true);
    try {
      const createRes = await api.post("/events", {
        event_type: selectedEvent,
        event_date: eventDate || new Date().toISOString().split("T")[0],
        amount,
        description,
      });
      const eventId = createRes.data.id;
      const adviceRes = await api.post(`/events/${eventId}/advise`);
      setAdvice(adviceRes.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
          <Calendar size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Life Event Advisor</h1>
          <p className="text-sm text-slate-500">Get AI-powered advice for major financial decisions</p>
        </div>
      </div>

      {/* Event Selector */}
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-5">
        <h3 className="text-lg font-semibold text-white">What happened?</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {LIFE_EVENTS.map((evt) => (
            <button key={evt.value} onClick={() => setSelectedEvent(evt.value)}
              className={`p-4 rounded-xl border text-center transition-all
                ${selectedEvent === evt.value
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                  : "border-slate-700/50 bg-slate-900/40 text-slate-400 hover:border-slate-600/50 hover:text-white"}`}>
              <span className="text-2xl block mb-1">{evt.icon}</span>
              <span className="text-xs font-medium">{evt.label.replace(/^[^\s]+\s/, "")}</span>
            </button>
          ))}
        </div>

        {selectedEvent && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Event Date</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Amount (if any)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-blue-500/50"
                placeholder="₹0" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-blue-500/50"
                placeholder="Brief details..." />
            </div>
          </div>
        )}

        {selectedEvent && (
          <button onClick={handleSubmit} disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold
              flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={18} />}
            {loading ? "Getting Advice..." : "Get AI Advice"}
          </button>
        )}
      </div>

      {/* Advice Results */}
      {advice && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-blue-400" />
              <span className="text-sm font-medium text-blue-400">AI Financial Advice</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{advice.summary}</p>
          </div>

          {advice.tax_implications && (
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-white mb-2">💰 Tax Implications</h4>
              <p className="text-sm text-slate-400">{advice.tax_implications}</p>
            </div>
          )}

          {advice.investment_recommendations?.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-white mb-4">📊 Investment Recommendations</h4>
              <div className="space-y-3">
                {advice.investment_recommendations.map((rec, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{rec.instrument} — {formatCurrency(rec.amount)}</p>
                      <p className="text-xs text-slate-500 mt-1">{rec.reason}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1
                      ${rec.urgency === "immediate" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                      <Clock size={12} /> {rec.urgency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {advice.action_checklist?.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-white mb-4">✅ Action Checklist</h4>
              <div className="space-y-2">
                {advice.action_checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40">
                    <div className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center">
                      <Check size={12} className="text-slate-600" />
                    </div>
                    <span className="text-sm text-slate-300 flex-1">{item.item}</span>
                    {item.deadline && <span className="text-xs text-slate-500">{item.deadline}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
