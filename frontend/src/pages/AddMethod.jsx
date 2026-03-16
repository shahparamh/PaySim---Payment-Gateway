import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, Landmark, Globe, Plus, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { cn } from "../utils/cn";

const AddMethod = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSensitive, setShowSensitive] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Form States
  const [walletForm, setWalletForm] = useState({ initial_balance: '', currency: 'INR' });
  const [cardForm, setCardForm] = useState({
    card_number: '',
    cardholder_name: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    card_brand: 'Visa',
    credit_limit: ''
  });
  const [bankForm, setBankForm] = useState({
    account_number: '',
    account_holder_name: '',
    bank_name: '',
    ifsc_code: '',
    account_type: 'Savings',
    balance: ''
  });
  const [netBankingForm, setNetBankingForm] = useState({ bank_account_id: '' });

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardForm({ ...cardForm, card_number: formatted });
    }
  };

  useEffect(() => {
    if (activeTab === 'net_banking') {
      fetchBankAccounts();
    }
  }, [activeTab]);

  const fetchBankAccounts = async () => {
    try {
      const res = await api.get('/instrument/bank-accounts');
      setBankAccounts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch bank accounts', err);
    }
  };

  const handleTabSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let endpoint = '';
    let payload = {};

    try {
      if (activeTab === 'wallet') {
        endpoint = '/instrument/wallets';
        payload = { ...walletForm, initial_balance: parseFloat(walletForm.initial_balance) };
      } else if (activeTab === 'card') {
        endpoint = '/instrument/cards';
        payload = { 
          ...cardForm, 
          card_number: cardForm.card_number.replace(/\s/g, ''),
          credit_limit: parseFloat(cardForm.credit_limit)
        };
      } else if (activeTab === 'bank') {
        endpoint = '/instrument/bank-accounts';
        payload = { ...bankForm, balance: parseFloat(bankForm.balance) };
      } else if (activeTab === 'net_banking') {
        endpoint = '/instrument/net-banking';
        payload = netBankingForm;
      }

      await api.post(endpoint, payload);
      navigate('/banking');
    } catch (err) {
      setError(err.error?.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'wallet', label: 'Wallet', sub: 'Digital wallet', icon: Wallet },
    { id: 'card', label: 'Credit Card', sub: 'Visa, MasterCard, etc.', icon: CreditCard },
    { id: 'bank', label: 'Bank Account', sub: 'Savings or Current', icon: Landmark },
    { id: 'net_banking', label: 'Net Banking', sub: 'Link a bank account', icon: Globe },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight italic">Add Payment Method</h1>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "p-6 rounded-2xl border-2 transition-all duration-300 text-left flex flex-col items-center justify-center space-y-3",
                activeTab === tab.id 
                  ? "bg-primary/20 border-primary shadow-lg shadow-primary/10" 
                  : "bg-slate-900/40 border-border/50 hover:border-slate-700"
              )}
            >
              <tab.icon className={cn("w-6 h-6", activeTab === tab.id ? "text-primary" : "text-slate-500")} />
              <div className="text-center">
                <p className={cn("text-sm font-black uppercase tracking-tight", activeTab === tab.id ? "text-white" : "text-slate-400")}>{tab.label}</p>
                <p className="text-[10px] text-slate-500 font-medium">{tab.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Form Area */}
        <Card className="max-w-xl bg-slate-900/40 border-border/50 overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-lg font-black text-white italic capitalize">Add {activeTab.replace('_', ' ')}</h2>
          </div>
          <div className="p-8">
            <form onSubmit={handleTabSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  {error}
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initial Balance (₹)</label>
                    <input 
                      type="number" 
                      value={walletForm.initial_balance}
                      onChange={(e) => setWalletForm({ ...walletForm, initial_balance: e.target.value })}
                      className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Currency</label>
                    <input 
                      type="text" 
                      value={walletForm.currency}
                      readOnly
                      className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full py-6 rounded-xl font-black uppercase tracking-widest">
                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Wallet
                  </Button>
                </div>
              )}

              {activeTab === 'card' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Card Number</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardForm.card_number}
                        onChange={handleCardNumberChange}
                        className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 pr-12 text-sm font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-800"
                      />
                      <button type="button" onClick={() => setShowSensitive(!showSensitive)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                        {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cardholder Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. JOHN DOE"
                      value={cardForm.cardholder_name}
                      onChange={(e) => setCardForm({ ...cardForm, cardholder_name: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all uppercase"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Month</label>
                      <input 
                        type="text" 
                        placeholder="MM"
                        maxLength={2}
                        value={cardForm.expiry_month} 
                        onChange={(e) => setCardForm({ ...cardForm, expiry_month: e.target.value.replace(/\D/g, '') })}
                        className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Year</label>
                      <input 
                        type="text" 
                        placeholder="YYYY"
                        maxLength={4}
                        value={cardForm.expiry_year} 
                        onChange={(e) => setCardForm({ ...cardForm, expiry_year: e.target.value.replace(/\D/g, '') })}
                        className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CVV</label>
                      <div className="relative">
                        <input 
                          type={showSensitive ? "text" : "password"} 
                          placeholder="***"
                          maxLength={3}
                          value={cardForm.cvv} 
                          onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })}
                          className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brand</label>
                    <select 
                      value={cardForm.card_brand} 
                      onChange={(e) => setCardForm({ ...cardForm, card_brand: e.target.value })}
                      className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none"
                    >
                      <option value="Visa">Visa</option>
                      <option value="MasterCard">MasterCard</option>
                      <option value="American Express">American Express</option>
                      <option value="RuPay">RuPay</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credit Limit (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 100000"
                      value={cardForm.credit_limit} 
                      onChange={(e) => setCardForm({ ...cardForm, credit_limit: e.target.value })}
                      className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full py-6 rounded-xl font-black uppercase tracking-widest mt-4">
                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Credit Card
                  </Button>
                </div>
              )}

              {activeTab === 'bank' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1234567890"
                      value={bankForm.account_number} 
                      onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value.replace(/\D/g, '') })}
                      className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Holder Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. JOHN DOE"
                      value={bankForm.account_holder_name} 
                      onChange={(e) => setBankForm({ ...bankForm, account_holder_name: e.target.value })}
                      className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. HDFC Bank"
                        value={bankForm.bank_name} 
                        onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                        className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IFSC Code</label>
                      <input 
                        type="text" 
                        placeholder="HDFC0001234"
                        value={bankForm.ifsc_code} 
                        onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Type</label>
                      <select
                        value={bankForm.account_type}
                        onChange={(e) => setBankForm({ ...bankForm, account_type: e.target.value })}
                        className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none"
                      >
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance (₹)</label>
                      <input 
                        type="number" 
                        placeholder="50000"
                        value={bankForm.balance} 
                        onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })}
                        className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full py-6 rounded-xl font-black uppercase tracking-widest mt-4">
                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Bank Account
                  </Button>
                </div>
              )}

              {activeTab === 'net_banking' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Bank Account to Link</label>
                    <select
                      value={netBankingForm.bank_account_id}
                      onChange={(e) => setNetBankingForm({ bank_account_id: e.target.value })}
                      className="w-full bg-slate-950 border border-border/50 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none"
                    >
                      <option value="">Choose an account...</option>
                      {bankAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bank_name} - ****{acc.account_last_four} (₹{acc.balance})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" disabled={loading || !netBankingForm.bank_account_id} className="w-full py-6 rounded-xl font-black uppercase tracking-widest">
                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                    Link Net Banking
                  </Button>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center space-x-2 opacity-30 group hover:opacity-100 transition-opacity">
                <ShieldCheck className="w-3 h-3 text-success" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Secured by PaySim Vault Protocol</span>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AddMethod;
