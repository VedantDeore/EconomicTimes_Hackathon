"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900
        flex-col items-center justify-center p-12">
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400
            flex items-center justify-center text-slate-900 font-black text-3xl mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
            ET
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Finance Mentor</h1>
          <p className="text-lg text-slate-400 max-w-md">
            AI-powered personal finance planning for every Indian.
            From confused saver to confident investor.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-emerald-400">
            <Sparkles size={18} />
            <span className="text-sm font-medium">Powered by AI</span>
          </div>
        </div>
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400
              flex items-center justify-center text-slate-900 font-black text-sm">
              ET
            </div>
            <span className="text-xl font-bold text-white">Finance Mentor</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-500 mb-8">Sign in to continue your financial journey</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50
                  text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50
                  focus:ring-1 focus:ring-emerald-500/20 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50
                    text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50
                    focus:ring-1 focus:ring-emerald-500/20 transition-all pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500
                text-slate-900 font-semibold flex items-center justify-center gap-2
                hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-6 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
