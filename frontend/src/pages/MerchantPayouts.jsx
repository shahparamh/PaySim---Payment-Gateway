import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Loader2, AlertCircle, Calendar, ArrowUpRight, History, CheckCircle2, Clock } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import api from '../services/api';

const MerchantPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');

  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payoutsRes, balanceRes, banksRes] = await Promise.all([
        api.get('/platform/payouts'),
        api.get('/platform/balance'),
        api.get('/instrument/bank-accounts')
      ]);
      setPayouts(payoutsRes.data || []);
      setBalance(balanceRes.data?.available_balance || 0);
      const bankList = banksRes.data || [];
      setBanks(bankList);
      if (bankList.length > 0 && !selectedBank) {
        setSelectedBank(bankList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch payouts data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (val > balance) {
      setError(`Insufficient balance. Maximum available is ₹${balance.toLocaleString('en-IN')}`);
      return;
    }

    try {
      setRequesting(true);
      await api.post('/platform/payouts', { 
        amount: val,
        bank_account_id: selectedBank
      });
      setAmount('');
      setSuccessMsg(`Payout request for ₹${val.toLocaleString('en-IN')} submitted successfully.`);
      await fetchData();
    } catch (err) {
      setError(err.error?.message || err.message || 'Failed to submit payout request.');
    } finally {
      setRequesting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0.5"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge variant="danger" className="bg-red-500/10 text-red-500 border-red-500/20 px-2 py-0.5">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Payouts</h1>
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Withdraw your earnings to your bank account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Request Form & Balance */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-[#0c0c0c] border border-white/5 shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <CardContent className="p-8 relative">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Available for Payout</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-black text-white tracking-tighter italic">₹{balance.toLocaleString('en-IN')}</span>
                  <span className="text-xs font-bold text-slate-600 uppercase">INR</span>
                </div>
                
                <form onSubmit={handleRequestPayout} className="mt-8 space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Withdraw Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-8 pr-4 text-white font-bold focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Destination Bank</label>
                    {banks.length > 0 ? (
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white font-bold focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all appearance-none"
                      >
                        {banks.map(b => (
                          <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                            {b.bank_name} (**** {b.account_last_four}) - ₹{parseFloat(b.balance).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-500 text-[10px] font-bold uppercase tracking-tight">
                        No bank accounts found. Please add one in "Banking" section first.
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-xs font-bold leading-relaxed">{error}</p>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-500">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <p className="text-xs font-bold leading-relaxed">{successMsg}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={requesting || loading || parseFloat(amount) <= 0}
                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {requesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
                    Request Payout
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                    <span className="text-indigo-400 font-black mr-1">NOTE:</span>
                    Payouts are processed within 2-3 business days to your registered bank account.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <History className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Payout History</h3>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 bg-[#0c0c0c] border border-white/5 rounded-3xl space-y-4">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Fetching settlements...</p>
              </div>
            ) : payouts.length === 0 ? (
              <div className="p-16 text-center bg-[#0c0c0c] border border-white/5 rounded-3xl flex flex-col items-center justify-center space-y-4 group">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <History className="w-8 h-8 text-slate-700" />
                </div>
                <div>
                  <p className="text-white font-bold opacity-40">No payouts found</p>
                  <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest font-black">Your settlement history will appear here</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {payouts.map((p) => (
                  <Card key={p.id} className="bg-[#0c0c0c] border border-white/5 group hover:border-indigo-500/30 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            <ArrowUpRight className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white text-lg tracking-tight italic uppercase">
                                ₹{parseFloat(p.total_amount).toLocaleString('en-IN')}
                              </p>
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">({p.currency})</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <code className="text-[10px] font-mono text-slate-600 bg-white/5 px-2 py-0.5 rounded uppercase">{p.settlement_id}</code>
                              <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Calendar className="w-3 h-3" />
                                <span className="text-[10px] font-mono">{new Date(p.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center md:flex-col md:items-end gap-3">
                          {getStatusBadge(p.status)}
                          <p className="text-[10px] text-slate-700 font-mono hidden md:block uppercase tracking-tighter">Processed: {p.status === 'completed' ? new Date(p.settlement_date).toLocaleDateString('en-IN') : 'Queue'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MerchantPayouts;
