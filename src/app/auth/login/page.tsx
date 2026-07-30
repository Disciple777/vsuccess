"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* Gradient Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Back to Home */}
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 
                   border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300
                   text-xs text-white/50 hover:text-white/80 z-10"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 sm:p-10">
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                VSuccess
              </h1>
              <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase">
                Welcome back
              </p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Sign in
          </h2>
          <p className="text-sm text-white/40 text-center mb-8">
            Enter your credentials to continue
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/5 border border-red-500/10 mb-6 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-white/50 mb-1.5"
              >
                Email address
              </label>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] 
                              focus-within:border-white/[0.15] focus-within:bg-white/[0.05] transition-all duration-300">
                <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-white/50"
                >
                  Password
                </label>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] 
                              focus-within:border-white/[0.15] focus-within:bg-white/[0.05] transition-all duration-300">
                <Lock className="w-4 h-4 text-white/30 flex-shrink-0" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl 
                         bg-gradient-to-r from-blue-500 to-purple-600 
                         hover:from-blue-400 hover:to-purple-500 
                         disabled:from-blue-500/30 disabled:to-purple-600/30
                         disabled:cursor-not-allowed text-white font-medium text-sm 
                         transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#0a0a0f] text-white/30">
                or
              </span>
            </div>
          </div>

          {/* Signup link */}
          <p className="text-center text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
