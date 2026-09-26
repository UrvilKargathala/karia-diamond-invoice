"use client";

import { useState } from "react";
import { useAuth } from "./auth";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(email, pass)) setError(true);
  };

  return (
    <div className="fixed inset-0 flex z-50">
      {/* Left branding panel */}
      <div className="hidden md:flex w-1/2 bg-[color:var(--color-primary)] text-white flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[10%] left-[15%] w-64 h-64 border border-white/30 rotate-45" />
          <div className="absolute bottom-[15%] right-[10%] w-48 h-48 border border-white/20 rotate-12" />
          <div className="absolute top-[40%] right-[25%] w-32 h-32 border border-white/25 -rotate-12" />
        </div>

        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden border border-white/10">
            <img src="/logo.jpg" alt="Karia Diamond LLP" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold tracking-wide mb-3">KARIA DIAMOND LLP</h1>
          <p className="text-white/50 text-sm mb-8">Invoice Generator</p>
          <div className="w-16 h-px bg-white/20 mx-auto mb-8" />
          <p className="text-white/40 text-sm max-w-xs leading-relaxed">
            Generate professional domestic &amp; export invoices with ease. Track, manage, and download PDFs instantly.
          </p>
        </div>

        <div className="absolute bottom-8 text-white/20 text-xs">
          Karia India LLP
        </div>
      </div>

      {/* Right login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm">
          {/* Mobile-only branding */}
          <div className="md:hidden text-center mb-8">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden border border-gray-200">
              <img src="/logo.jpg" alt="Karia Diamond LLP" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold">Karia Diamond LLP</h1>
            <p className="text-sm text-gray-500 mt-1">Invoice Generator</p>
          </div>

          <div className="hidden md:block mb-8">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(false); }}
                placeholder="Enter your email"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError(false); }}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">Invalid email or password.</p>
            )}
            <button type="submit" className="btn btn-primary w-full justify-center py-2.5">
              Sign In
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6 md:hidden">Karia India LLP</p>
        </div>
      </div>
    </div>
  );
}
