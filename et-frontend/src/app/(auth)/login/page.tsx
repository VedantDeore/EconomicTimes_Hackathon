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
    <div className="min-h-screen bg-white flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#00D09C] flex-col items-center justify-center p-12">
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-[#00D09C] font-black text-3xl mx-auto mb-6 shadow-2xl shadow-black/10">
            ET
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Finance Mentor</h1>
          <p className="text-lg text-white/80 max-w-md">
            AI-powered personal finance planning for every Indian.
            From confused saver to confident investor.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-white/90">
            <Sparkles size={18} />
            <span className="text-sm font-medium">Powered by Dhanguru</span>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#00D09C] flex items-center justify-center text-white font-black text-sm">
              ET
            </div>
            <span className="text-xl font-bold text-gray-900">Finance Mentor</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to continue your financial journey</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-500 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300
                  text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#00D09C]
                  focus:ring-1 focus:ring-[#00D09C]/20 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300
                    text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#00D09C]
                    focus:ring-1 focus:ring-[#00D09C]/20 transition-all pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00D09C] hover:bg-[#00B386]
                text-white font-semibold flex items-center justify-center gap-2
                transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#00D09C] hover:text-[#00B386] font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
