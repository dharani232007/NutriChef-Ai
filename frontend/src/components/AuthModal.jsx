import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowLeft, Sparkles, AlertTriangle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp_verify'
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  // Handle standard registration & login submissions
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (isLogin) {
      // Direct Login flow
      const finalUser = (username.trim() || email.split('@')[0] || 'chef_user').toLowerCase();
      localStorage.setItem('NutriChef_username', finalUser);
      localStorage.setItem('rasoi_username', finalUser);
      setLoading(false);
      onAuthSuccess(finalUser, true);
      onClose();
    } else {
      // Sign Up Flow: Send OTP to real email via Backend
      const cleanUser = (username.trim() || email.split('@')[0] || 'chef_user').toLowerCase();
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUser,
            email: email.trim().toLowerCase(),
            password: password,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(data.message || 'Verification code sent to your email.');
          setStep('otp_verify');
        } else {
          setError(data.detail || data.message || 'Registration failed. Please check inputs.');
        }
      } catch (err) {
        setError('Cannot connect to authentication server. Make sure your backend is running.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Verify the 6-Digit OTP received in user's email
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const verifiedUser = data.username || (username.trim() || email.split('@')[0]).toLowerCase();
        localStorage.setItem('NutriChef_username', verifiedUser);
        localStorage.setItem('rasoi_username', verifiedUser);
        onAuthSuccess(verifiedUser, false);
        onClose();
      } else {
        setError(data.detail || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setError('Cannot connect to verification server. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth verification
  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const googleUser = data.username.toLowerCase();
        localStorage.setItem('NutriChef_username', googleUser);
        localStorage.setItem('rasoi_username', googleUser);
        onAuthSuccess(googleUser, true);
        onClose();
      } else {
        setError(data.detail || 'Google sign-in validation failed on server.');
      }
    } catch (err) {
      setError('Cannot connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#fcfaf5] rounded-3xl p-8 w-full max-w-md border border-[#4d6b53]/20 shadow-2xl relative text-stone-800">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#4d6b53] flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#4d6b53]/20">
            {step === 'otp_verify' ? (
              <ShieldCheck className="w-6 h-6 text-white" />
            ) : (
              <Lock className="w-5 h-5 text-white" />
            )}
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#2a3c2e]">
            {step === 'otp_verify' 
              ? 'Verify Your Email' 
              : (isLogin ? 'Welcome Back' : 'Create an Account')}
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            {step === 'otp_verify'
              ? `Enter the 6-digit code sent to ${email}`
              : (isLogin 
                  ? 'Sign in to access your NutriChef diet and safe recipes' 
                  : 'Join NutriChef for personalized recipes & nutrition')}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'credentials' ? (
          <>
            {/* Toggle Login / Signup */}
            <div className="flex rounded-xl bg-stone-200/60 p-1 mb-6">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isLogin ? 'bg-white text-[#2a3c2e] shadow-sm font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !isLogin ? 'bg-white text-[#2a3c2e] shadow-sm font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Your Name / Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#4d6b53]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#4d6b53]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#4d6b53]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white font-semibold text-sm shadow-md shadow-[#4d6b53]/20 transition-all cursor-pointer disabled:opacity-60"
              >
                {loading 
                  ? 'Processing...' 
                  : (isLogin ? 'Sign In to NutriChef' : 'Send Verification Code')}
              </button>

              <div className="flex flex-col items-center my-4">
                <div className="w-full flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-stone-300"></div>
                  <span className="text-xs text-stone-500 font-medium">OR</span>
                  <div className="flex-1 h-px bg-stone-300"></div>
                </div>

                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in was cancelled or failed.')}
                    shape="pill"
                    theme="outline"
                  />
                </div>
              </div>
            </form>
          </>
        ) : (
          /* Step 2: 6-Digit OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength="6"
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-white border-2 border-[#4d6b53] rounded-2xl py-3 text-center text-2xl font-bold tracking-widest text-[#2a3c2e] focus:outline-none"
              />
              <p className="text-[11px] text-stone-400 text-center mt-1">Code valid for 10 minutes</p>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white font-semibold text-sm shadow-md shadow-[#4d6b53]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Activate Account'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(null); }}
              className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Edit Email</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}