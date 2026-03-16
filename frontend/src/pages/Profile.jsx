import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Mail, Phone, Lock, Loader2, Check } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, login } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  const [pinForm, setPinForm] = useState({
    old_pin: '',
    new_pin: '',
    confirm_pin: ''
  });

  useEffect(() => {
    if (user) {
      setPersonalInfo({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.patch('/user/profile', {
        phone: personalInfo.phone
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Optionally update local auth context if needed
    } catch (err) {
      setMessage({ type: 'error', text: err.error?.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (pinForm.new_pin !== pinForm.confirm_pin) {
      return setMessage({ type: 'error', text: 'New PINs do not match' });
    }
    setPinLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.patch('/user/profile/pin', {
        old_pin: pinForm.old_pin,
        new_pin: pinForm.new_pin
      });
      setMessage({ type: 'success', text: 'Payment PIN updated successfully!' });
      setPinForm({ old_pin: '', new_pin: '', confirm_pin: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.error?.message || 'Failed to update PIN' });
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
        <h1 className="text-4xl font-black text-white tracking-tight italic">My Profile</h1>

        {message.text && (
          <div className={cn(
            "p-4 rounded-2xl flex items-center space-x-3 text-xs font-black uppercase tracking-widest animate-slide-up",
            message.type === 'success' ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"
          )}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card className="bg-slate-900/40 border-border/50 p-8 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg"><User className="w-5 h-5 text-primary" /></div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Personal Information</h3>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">First Name</label>
                  <input 
                    type="text"
                    value={personalInfo.first_name}
                    readOnly
                    className="w-full bg-slate-950/50 border border-border/20 rounded-xl py-3 px-4 text-sm font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Name</label>
                  <input 
                    type="text"
                    value={personalInfo.last_name}
                    readOnly
                    className="w-full bg-slate-950/50 border border-border/20 rounded-xl py-3 px-4 text-sm font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="email"
                    value={personalInfo.email}
                    readOnly
                    className="w-full bg-slate-950/50 border border-border/20 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[9px] text-slate-600 font-medium italic">Email cannot be changed for security reasons.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="text"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>

              <Button type="submit" disabled={profileLoading} className="px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs">
                {profileLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Save Changes'}
              </Button>
            </form>
          </Card>

          {/* Security - Payment PIN */}
          <Card className="bg-slate-900/40 border-border/50 p-8 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-warning/10 rounded-lg"><ShieldCheck className="w-5 h-5 text-warning" /></div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Security - Payment PIN</h3>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">The 4-digit PIN used to authorize transactions.</p>
            
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current PIN</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.old_pin}
                    onChange={(e) => setPinForm({ ...pinForm, old_pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 pl-12 pr-4 text-sm font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 tracking-[0.5em]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New PIN</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.new_pin}
                    onChange={(e) => setPinForm({ ...pinForm, new_pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 pl-12 pr-4 text-sm font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 tracking-[0.5em]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm New PIN</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.confirm_pin}
                    onChange={(e) => setPinForm({ ...pinForm, confirm_pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 pl-12 pr-4 text-sm font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 tracking-[0.5em]"
                  />
                </div>
              </div>

              <Button type="submit" disabled={pinLoading} variant="outline" className="w-full py-3 rounded-xl border-primary/50 text-primary font-black uppercase tracking-widest text-xs hover:bg-primary/10">
                {pinLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Update PIN'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
