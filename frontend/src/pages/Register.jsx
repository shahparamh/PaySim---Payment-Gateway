import React, { useState } from 'react';
import { Shield, ArrowRight, Loader2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const Register = () => {
  const { verifyRegistration } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState('info'); // 'info' | 'otp' | 'pin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    type: 'customer',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    business_name: '',
    business_email: '',
    business_type: ''
  });
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);

  React.useEffect(() => {
    if (stage === 'otp' && timeLeft > 0) {
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

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prepare payload based on type
    const payload = { 
      type: formData.type, 
      password: formData.password,
      phone: formData.phone 
    };

    if (formData.type === 'customer') {
      payload.first_name = formData.first_name;
      payload.last_name = formData.last_name;
      payload.email = formData.email;
    } else if (formData.type === 'merchant') {
      payload.business_name = formData.business_name;
      payload.business_email = formData.business_email || formData.email; // Fallback if same
      payload.business_type = formData.business_type;
    }

    try {
      const res = await api.post('/auth/register', payload);
      if (res.success && res.data.requires_otp) {
        setPendingRegistration(res.data.pending_data);
        setStage('otp');
        setTimeLeft(120);
        setCanResend(false);
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please check the form.';
      const details = err.response?.data?.error?.details;
      setError(details ? `${msg}: ${details.map(d => d.message).join(', ')}` : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await handleInfoSubmit({ preventDefault: () => {} });
      setSuccessMsg('A new code has been sent.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to resend code.');
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
      const payload = {
        email: formData.type === 'merchant' ? (formData.business_email || formData.email) : formData.email,
        code: otp,
        type: formData.type,
        pending_data: pendingRegistration
      };
      await verifyRegistration(payload);
      
      if (formData.type === 'customer') {
        setSuccessMsg('Email verified! Now let\'s set up your secure PIN.');
        setStage('pin');
      } else {
        setSuccessMsg('Account verified! Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) return setError('PIN must be 4 digits');
    if (pin !== confirmPin) return setError('PINs do not match');

    setLoading(true);
    setError('');
    try {
      await api.patch('/user/profile/pin', { new_pin: pin });
      setSuccessMsg('PIN set successfully! Welcome to PaySim.');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to set PIN. You can do this later in profile.');
      setTimeout(() => navigate('/dashboard'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      
      <div className="w-full max-w-xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-slate-900/50 rounded-xl flex items-center justify-center p-2 mb-4 border border-white/5 shadow-xl hover:scale-105 transition-transform">
            <img src="/logo.png" alt="PaySim" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-1 italic">Join PaySim</h1>
          <p className="text-slate-500 font-medium text-sm">Start your journey with the world's secure payment platform.</p>
        </div>

        <Card className="p-8 border-primary/20 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              {successMsg}
            </div>
          )}

          {stage === 'info' ? (
            <form onSubmit={handleInfoSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">I want to join as a</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'customer' })}
                      className={`py-2 px-4 rounded-lg text-xs font-bold transition-all border ${formData.type === 'customer' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-white/10'}`}
                    >
                      Customer
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'merchant' })}
                      className={`py-2 px-4 rounded-lg text-xs font-bold transition-all border ${formData.type === 'merchant' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-white/10'}`}
                    >
                      Merchant
                    </button>
                  </div>
                </div>

                {formData.type === 'customer' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input 
                          type="text" required placeholder="John" 
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input 
                          type="text" required placeholder="Doe" 
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all" 
                        />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input 
                          type="email" required placeholder="john@example.com" 
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all" 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Business Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input 
                          type="text" required placeholder="Acme Corp" 
                          value={formData.business_name}
                          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                          className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all" 
                        />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Business Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input 
                          type="email" required placeholder="billing@acme.com" 
                          value={formData.business_email}
                          onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                          className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all" 
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password (Min 8 characters)</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      type={showPassword ? "text" : "password"} required placeholder="••••••••" 
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-12 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all" 
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

              <Button type="submit" disabled={loading} className="w-full py-6 text-sm font-bold tracking-tight shadow-xl shadow-primary/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <>Continue to Verification<ArrowRight className="w-5 h-5 ml-2" /></>}
              </Button>
            </form>
          ) : stage === 'otp' ? (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white mb-2">Verify Email</h3>
                <p className="text-sm text-slate-500 italic">Enter the 6-digit code sent to your email.</p>
              </div>
              <div className="space-y-2">
                <input 
                  type="text" maxLength={6} required placeholder="000000" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-4 px-4 text-white text-center text-3xl font-black tracking-[0.5em] focus:border-primary/50 outline-none" 
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
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Resend available after timer</p>
                )}
              </div>
              <Button type="submit" disabled={loading || otp.length < 6 || timeLeft === 0} className="w-full py-6 text-sm font-bold tracking-tight">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <>Complete Verification<Shield className="w-5 h-5 ml-2" /></>}
              </Button>
              <button type="button" onClick={() => setStage('info')} className="w-full text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-400">Edit Details</button>
            </form>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white mb-2 italic">Set Security PIN</h3>
                <p className="text-sm text-slate-500 italic text-center">Set a 4-digit PIN for quick & secure transactions.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2 text-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enter new PIN</label>
                  <input 
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-4 px-4 text-white text-center text-3xl font-black tracking-[0.5em] focus:border-primary/50 outline-none"
                  />
                </div>

                <div className="space-y-2 text-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm your PIN</label>
                  <input 
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-4 px-4 text-white text-center text-3xl font-black tracking-[0.5em] focus:border-primary/50 outline-none"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading || pin.length !== 4 || pin !== confirmPin} className="w-full py-6 text-sm font-bold tracking-tight shadow-xl shadow-primary/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <>Secure Account<Plus className="w-5 h-5 ml-2" /></>}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center">
            <p className="text-xs text-slate-500 font-medium mb-4">Already have an account? <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline ml-1">Sign In</button></p>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
              <Shield className="w-3 h-3" />
              <span>Identity Verified Platform</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
