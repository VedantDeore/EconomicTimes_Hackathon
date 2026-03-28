"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    gender: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(formData);
      router.push("/dashboard");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400
            flex items-center justify-center text-slate-900 font-black text-sm">
            ET
          </div>
          <span className="text-xl font-bold text-white">Finance Mentor</span>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-1 text-center">Create Account</h2>
          <p className="text-slate-500 mb-6 text-center text-sm">
            Start your journey to financial freedom
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
                <input type="text" required value={formData.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50
                    text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Phone</label>
                <input type="tel" value={formData.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50
                    text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  placeholder="+91 98765 43210" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Email</label>
              <input type="email" required value={formData.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50
                  text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Password</label>
              <input type="password" required minLength={8} value={formData.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50
                  text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                placeholder="Min 8 characters" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">City</label>
                <input type="text" value={formData.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50
                    text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Gender</label>
                <select value={formData.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50
                    text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500
                text-slate-900 font-semibold flex items-center justify-center gap-2
                hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-5 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
