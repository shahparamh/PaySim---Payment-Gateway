import React, { useState, useEffect } from 'react';
import { Shield, Key, Loader2, X, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export const PaymentAuthModal = ({ isOpen, onClose, onVerify, type = 'pin', loading = false, error = '' }) => {
  const [val, setVal] = useState('');
  const [stage, setStage] = useState(type); // 'pin' or 'otp'

  useEffect(() => {
    if (isOpen) {
      setVal('');
      setStage(type);
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const maxLength = stage === 'pin' ? 4 : 6;
  const isComplete = val.length === maxLength;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isComplete) {
      onVerify(val, stage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <Card className="w-full max-w-sm relative z-10 p-8 border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
            {stage === 'pin' ? <Key className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
          </div>
          <h3 className="text-2xl font-black text-white italic tracking-tight mb-2">
            {stage === 'pin' ? 'Authorization Required' : 'Security Verification'}
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            {stage === 'pin' 
              ? 'Enter your 4-digit payment PIN to authorize this transaction.' 
              : 'Enter the 6-digit code sent to your registered email.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-start space-x-3 text-danger animate-in shake duration-500">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">{error}</p>
              {error.toLowerCase().includes('pin not set') && (
                <button 
                  type="button"
                  onClick={() => window.location.href = '/profile'}
                  className="text-[10px] font-black underline underline-offset-4 hover:text-white uppercase transition-colors"
                >
                  Go to Profile to set PIN →
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative">
            <input 
              type="password" 
              maxLength={maxLength}
              autoFocus
              className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl py-6 px-4 text-white text-center text-4xl font-black tracking-[0.5em] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              placeholder={'0'.repeat(maxLength)}
              value={val}
              onChange={(e) => setVal(e.target.value.replace(/\D/g, ''))}
            />
            {loading && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={!isComplete || loading}
            className="w-full py-6 text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            {loading ? 'Verifying...' : (
              <div className="flex items-center justify-center space-x-2">
                <span>Confirm Payment</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>

          <p className="text-[10px] text-center text-slate-600 font-black uppercase tracking-[0.2em] italic">
            Secure 256-bit Encrypted Transaction
          </p>
        </form>
      </Card>
    </div>
  );
};
