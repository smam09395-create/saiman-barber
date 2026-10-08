import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { api, authStorage } from '../../api/client.ts';
import { AdminUser } from '../../types/index.ts';
import { useToast } from '../Toast.tsx';

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onCancel,
}) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await api.adminLogin({ email: email.trim(), password });
      authStorage.setToken(res.token);
      showToast(`Welcome back, ${res.admin.name}`);
      onLoginSuccess(res.admin);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07080a]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#11131a] border border-[#232634] rounded-2xl max-w-md w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center mx-auto mb-4 text-[#c5a059]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#c5a059] block mb-1">
            Private Admin Portal
          </span>
          <h2 className="text-2xl font-display font-bold text-[#f4f2ed]">
            Administrator Sign In
          </h2>
          <p className="text-xs text-[#8c8980] mt-1.5">
            Authorized management access only. Enter your administrator email and password.
          </p>
        </div>

        {error && (
          <div className="p-3.5 mb-5 rounded-lg bg-red-950/60 border border-red-900/80 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c8980] mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email..."
                autoComplete="email"
                className="w-full bg-[#161822] border border-[#262939] text-white text-sm rounded-lg pl-10 pr-3.5 py-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c8980] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoComplete="current-password"
                className="w-full bg-[#161822] border border-[#262939] text-white text-sm rounded-lg pl-10 pr-3.5 py-2.5 focus:border-[#c5a059] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] transition-colors rounded-lg font-mono disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-[#8c8980] hover:text-white py-1.5 transition-colors"
            >
              Return to Website
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
