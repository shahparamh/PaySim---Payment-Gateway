import React, { useState } from 'react';
import { CreditCard, Shield, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const Login = () => {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState('credentials'); // 'credentials' | 'otp' | 'reset'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', type: 'customer' });
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);

  React.useEffect(() => {
    if ((stage === 'otp' || stage === 'reset') && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [stage, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(formData);
      if (res.success && res.data.requires_otp) {
        setStage('otp');
        setTimeLeft(120);
        setCanResend(false);
      }
    } catch (err) {
      setError(err.error?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (timeLeft === 0) {
      setError('OTP has expired. Please resend a new code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp({ 
        email: formData.email, 
        code: otp, 
        type: formData.type 
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.error?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!formData.email) return setError('Please enter your email first');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: formData.email, type: formData.type });
      setStage('reset');
      setTimeLeft(120);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (stage === 'otp') {
      await handleCredentialsSubmit({ preventDefault: () => {} });
    } else if (stage === 'reset') {
      await handleForgotRequest({ preventDefault: () => {} });
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (timeLeft === 0) {
      setError('Code has expired. Please resend a new code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { 
        email: formData.email, 
        code: otp, 
        new_password: newPassword,
        type: formData.type 
      });
      setStage('credentials');
      setError('Password reset successful. Please sign in.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Reset failed. Check OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 bg-slate-900/50 rounded-2xl flex items-center justify-center p-2 mb-6 border border-white/5 shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-500">
            <img src="/logo.png" alt="PaySim" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">PaySim</h1>
          <p className="text-slate-500 font-medium">The future of secure payments is here.</p>
        </div>

        <Card className="p-8 border-primary/20 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-medium">
              {error}
            </div>
          )}

          {stage === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-900/50 border border-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
                >
                  <option value="customer">Customer</option>
                  <option value="merchant">Merchant</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900/50 border border-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <button type="button" onClick={handleForgotRequest} className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">Forgot?</button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-900/50 border border-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none pr-12" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full py-6 text-base font-bold tracking-tight shadow-xl shadow-primary/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <>Sign In<ArrowRight className="w-5 h-5 ml-2" /></>}
              </Button>
            </form>
          ) : stage === 'otp' ? (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white mb-2">Verify it's you</h3>
                <p className="text-sm text-slate-500">We've sent a 6-digit code to <span className="text-slate-300 font-bold">{formData.email}</span></p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">One-Time Password</label>
                <input 
                  type="text" 
                  maxLength={6}
                  required
                  placeholder="000000" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900/50 border border-border rounded-xl py-4 px-4 text-white text-center text-3xl font-black tracking-[0.5em] focus:ring-2 focus:ring-primary/50 outline-none" 
                />
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="text-xs font-bold uppercase tracking-widest flex items-center space-x-2">
                  <span className={`${timeLeft < 30 ? 'text-red-400' : 'text-slate-500'}`}>Code expires in:</span>
                  <span className={`font-black ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-primary'}`}>
                    {timeLeft > 0 ? formatTime(timeLeft) : "EXPIRED"}
                  </span>
                </div>
                {canResend ? (
                  <button 
                    type="button" 
                    onClick={handleResend}
                    className="text-primary font-bold hover:underline underline-offset-4 text-xs tracking-widest uppercase animate-bounce"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest font-mono">Resend available in {timeLeft}s</p>
                )}
              </div>
              <Button type="submit" disabled={loading || otp.length < 6 || timeLeft === 0} className="w-full py-6 text-base font-bold tracking-tight shadow-xl shadow-primary/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <>Verify & Access<Shield className="w-5 h-5 ml-2" /></>}
              </Button>
              <button 
                type="button" 
                onClick={() => setStage('credentials')}
                className="w-full text-center text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white mb-2 italic">Reset Password</h3>
                <p className="text-sm text-slate-500">Enter the code sent to <span className="text-slate-300 font-bold">{formData.email}</span></p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Reset Code</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    required
                    placeholder="000000" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900/50 border border-border rounded-xl py-3 px-4 text-white text-center text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-primary/50 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-border rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none pr-12" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="text-xs font-bold uppercase tracking-widest flex items-center space-x-2">
                  <span className={`${timeLeft < 30 ? 'text-red-400' : 'text-slate-500'}`}>Code expires in:</span>
                  <span className={`font-black ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-primary'}`}>
                    {timeLeft > 0 ? formatTime(timeLeft) : "EXPIRED"}
                  </span>
                </div>
                {canResend ? (
                  <button 
                    type="button" 
                    onClick={handleResend}
                    className="text-primary font-bold hover:underline underline-offset-4 text-xs tracking-widest uppercase animate-bounce"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest font-mono">Resend available in {timeLeft}s</p>
                )}
              </div>
              <Button type="submit" disabled={loading || otp.length < 6 || !newPassword || timeLeft === 0} className="w-full py-6 text-base font-bold tracking-tight shadow-xl shadow-primary/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <>Update Password<ArrowRight className="w-5 h-5 ml-2" /></>}
              </Button>
              <button 
                type="button" 
                onClick={() => setStage('credentials')}
                className="w-full text-center text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center">
            <p className="text-sm text-slate-500 mb-4">Don't have an account? <button onClick={() => navigate('/register')} className="text-primary font-bold hover:underline">Create one</button></p>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
              <Shield className="w-3 h-3" />
              <span>Bank-level security</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
