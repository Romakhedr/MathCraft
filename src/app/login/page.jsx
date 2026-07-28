// src/app/login/page.jsx — MathCraft Custom Login Page
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      window.location.href = '/';
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b2b1d] px-4">
      <div className="bg-white text-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-[#134e32]/20">
        
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-[#134e32] font-bold">— Mathematics Education —</span>
          <h1 className="text-3xl font-extrabold text-[#0b2b1d] tracking-tight mt-2">MathCraft Tutor</h1>
          <p className="text-sm text-gray-500 mt-1">سجل الدخول للمتابعة إلى بوابتك التعليمية</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#0b2b1d] mb-2">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0b2b1d] focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0b2b1d] mb-2">كلمة المرور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0b2b1d] focus:border-transparent outline-none transition"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-[#0b2b1d] text-white font-bold rounded-xl hover:bg-[#134e32] shadow-lg shadow-[#0b2b1d]/20 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

      </div>
    </div>
  );
            }
