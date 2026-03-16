import React, { useState } from 'react';
import { X, ArrowRight, Wallet, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export const TopUpModal = ({ isOpen, onClose, onTopUp, loading = false, error = '' }) => {
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      onTopUp(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <Card className="w-full max-w-md relative z-10 p-8 border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-300 rounded-[2.5rem]">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary shadow-inner">
            <Wallet className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white italic tracking-tight mb-2 uppercase">
            Top Up Wallet
          </h3>
          <p className="text-sm text-slate-500 font-medium italic">
            Add funds to your PaySim digital wallet for instant settlements.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-start space-x-3 text-danger animate-in shake duration-500">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">Amount to Add (INR)</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-600 italic">₹</span>
              <input 
                type="number" 
                autoFocus
                className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl py-6 pl-14 pr-6 text-white text-3xl font-black tracking-tighter focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             {[500, 1000, 5000].map(val => (
               <button
                 key={val}
                 type="button"
                 onClick={() => setAmount(val.toString())}
                 className="py-3 px-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
               >
                 +₹{val.toLocaleString()}
               </button>
             ))}
          </div>

          <Button 
            type="submit" 
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full py-8 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 rounded-2xl relative overflow-hidden group"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              <div className="flex items-center justify-center space-x-3 transition-transform group-hover:scale-105">
                <span>Authorize Top Up</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </Button>

          <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-[0.3em] italic opacity-60">
            Funds will be deducted from your primary bank
          </p>
        </form>
      </Card>
    </div>
  );
};
