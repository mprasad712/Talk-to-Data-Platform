import React, { useState } from 'react';
import bainLogo from '../assets/bain-company-seeklogo.svg';
import BainIcon from '../assets/Bain_icom.svg';
import { registerUser, loginUser } from '../api/client';

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('landing'); // 'landing' | 'login' | 'register'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'register') {
        result = await registerUser(email, name, password);
      } else {
        result = await loginUser(email, password);
      }
      localStorage.setItem('bcn_token', result.token);
      localStorage.setItem('bcn_user', JSON.stringify(result.user));
      onAuth(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Landing page
  if (mode === 'landing') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        {/* Background grid */}
        <div className="bg-grid absolute inset-0 opacity-30" />

        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb" style={{ width: 300, height: 300, top: '10%', left: '10%', background: 'rgba(220,38,38,0.06)' }} />
          <div className="orb" style={{ width: 200, height: 200, bottom: '15%', right: '15%', background: 'rgba(220,38,38,0.04)', animationDelay: '3s' }} />
          <div className="orb" style={{ width: 150, height: 150, top: '50%', right: '30%', background: 'rgba(168,85,247,0.04)', animationDelay: '5s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center px-6">
          {/* Logo section */}
          <div className="slide-up mb-12 flex flex-col items-center">
            {/* Animated icon */}
            <div className="relative mb-8">
              <div className="absolute -inset-6 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, var(--red) 0%, transparent 70%)' }} />
              <div className="breathe relative flex h-24 w-24 items-center justify-center rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: '0 0 40px rgba(220,38,38,0.15)' }}>
                <img src={BainIcon} alt="Coro" className="h-16 w-16" />
              </div>
            </div>

            {/* Brand */}
            <h1 className="text-[48px] font-extrabold tracking-tight" style={{ color: 'var(--red)' }}>
              Coro<span className="text-[28px] align-super">®</span>
            </h1>
            <img src={bainLogo} alt="Bain & Company" className="mt-2 h-[18px]" style={{ filter: 'var(--logo-filter)' }} />

            <p className="mt-6 max-w-sm text-center text-[15px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              AI-powered multi-agent data analytics platform for business intelligence
            </p>
          </div>

          {/* Feature highlights */}
          <div className="slide-up mb-10 flex flex-wrap justify-center gap-3" style={{ animationDelay: '150ms' }}>
            {['Multi-Agent AI', 'Smart Data Cleaning', 'Python Sandbox', 'Data Lineage'].map((f) => (
              <span
                key={f}
                className="rounded-full px-4 py-1.5 text-[12px] font-medium"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
              >
                {f}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="slide-up flex flex-col items-center gap-3" style={{ animationDelay: '300ms' }}>
            <button
              onClick={() => setMode('register')}
              className="group flex items-center gap-2 rounded-xl px-8 py-3 text-[15px] font-bold text-white transition-all duration-300 hover:scale-105"
              style={{ background: 'var(--red)', boxShadow: '0 0 30px rgba(220,38,38,0.4)' }}
            >
              Get Started
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <button
              onClick={() => setMode('login')}
              className="rounded-xl px-8 py-2.5 text-[14px] font-semibold transition-all duration-200 hover:scale-105"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
            >
              Already have an account? Sign in
            </button>
          </div>

          {/* Footer */}
          <p className="mt-16 text-[11px]" style={{ color: 'var(--text-ghost)' }}>
            Confidential &mdash; Bain & Company
          </p>
        </div>
      </div>
    );
  }

  // Login / Register form
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="bg-grid absolute inset-0 opacity-30" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div
          className="slide-up rounded-2xl p-8"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
        >
          {/* Header */}
          <div className="mb-8 flex flex-col items-center">
            <div className="breathe mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)' }}>
              <img src={BainIcon} alt="Coro" className="h-9 w-9" />
            </div>
            <h2 className="text-[22px] font-extrabold" style={{ color: 'var(--red)' }}>
              Coro<span className="text-[13px] align-super">®</span>
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 rounded-lg px-4 py-2.5 text-[13px] font-medium"
              style={{ background: 'var(--red-tint)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.2)' }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Manas Prasad"
                  required
                  className="w-full rounded-lg px-4 py-2.5 text-[14px] transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', focusRingColor: 'var(--red)' }}
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manasprasad@gmail.com"
                required
                className="w-full rounded-lg px-4 py-2.5 text-[14px] transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter password'}
                required
                minLength={mode === 'register' ? 6 : undefined}
                className="w-full rounded-lg px-4 py-2.5 text-[14px] transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-bold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
              style={{ background: 'var(--red)', boxShadow: '0 0 25px rgba(220,38,38,0.3)' }}
            >
              {loading ? (
                <div className="flex gap-1">
                  <span className="pulse-dot h-2 w-2 rounded-full bg-white" />
                  <span className="pulse-dot h-2 w-2 rounded-full bg-white" style={{ animationDelay: '200ms' }} />
                  <span className="pulse-dot h-2 w-2 rounded-full bg-white" style={{ animationDelay: '400ms' }} />
                </div>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-[13px] font-medium transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
            >
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span style={{ color: 'var(--red)' }}>{mode === 'login' ? 'Sign up' : 'Sign in'}</span>
            </button>
          </div>

          {/* Back to landing */}
          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode('landing'); setError(''); }}
              className="text-[12px] font-medium transition-colors"
              style={{ color: 'var(--text-faint)' }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
