import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, ShieldCheck, CreditCard, Landmark, CheckCircle2, Loader2, ChevronRight, Wallet, ShoppingBag } from "lucide-react";
import api from '../services/api';
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { VisualCard } from '../components/banking/VisualCard';
import { PaymentAuthModal } from '../components/banking/PaymentAuthModal';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';
import { Badge } from "../components/ui/Badge";

const Checkout = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session');

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [instruments, setInstruments] = useState([]);
    const [receivers, setReceivers] = useState([]);
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [sessionData, setSessionData] = useState(null);
    const [formData, setFormData] = useState({ 
        receiverId: '', 
        amount: '',
        email: '',
        cardNumber: '',
        cvv: '',
        expiry: '',
        bankName: '',
        accountNumber: ''
    });
    const [guestType, setGuestType] = useState('card');
    const [error, setError] = useState('');

    // Auth Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authType, setAuthType] = useState('pin');
    const [authError, setAuthError] = useState('');
    const [stagedPin, setStagedPin] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const promises = [api.get('/simulator/receivers')];
                if (user) promises.push(api.get('/instrument'));
                
                const results = await Promise.all(promises);
                setReceivers(results[0].data || []);
                
                if (user) {
                    setInstruments(results[1].data);
                    if (results[1].data.length > 0) setSelectedInstrument(results[1].data[0]);
                }

                if (sessionId) {
                    const sessionRes = await api.get(`/platform/payment/${sessionId}`);
                    setSessionData(sessionRes.data);
                    setFormData(prev => ({ ...prev, amount: sessionRes.data.amount }));
                }
            } catch (err) {
                console.error('Failed to fetch checkout data:', err);
                if (err.response?.status !== 401) {
                    setError('Failed to load payment details. Please try again.');
                }
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [sessionId, user]);

    const handlePaymentInitiate = (e) => {
        e.preventDefault();
        if (!user) {
            if (!formData.email) return setError('Email is required for guest checkout');
            if (guestType === 'card' && (!formData.cardNumber || !formData.cvv)) return setError('Card details required');
            if (guestType === 'bank' && (!formData.bankName || !formData.accountNumber)) return setError('Bank details required');
        } else {
            if (!selectedInstrument) return setError('Please select a payment method');
        }

        if (!sessionId && !formData.receiverId) return setError('Please select a receiver');
        if (!formData.amount || parseFloat(formData.amount) <= 0) return setError('Please enter a valid amount');
        
        setError('');
        
        // For guest, we might skip PIN if backend allows, but let's see.
        // Actually, backend processPayment uses `pin: pin || 'SECRET_BYPASS'` for guest.
        // So we can skip the modal or just show OTP if required.
        if (!user) {
            handleAuthVerify('GUEST_BYPASS', 'pin'); 
        } else {
            setAuthType('pin');
            setAuthError('');
            setIsAuthModalOpen(true);
        }
    };

    const handleAuthVerify = async (code, stage) => {
        setLoading(true);
        setAuthError('');
        try {
            if (stage === 'pin') setStagedPin(code);

            let result;
            const payload = {
                pin: stage === 'pin' ? code : stagedPin,
                otp_code: stage === 'otp' ? code : undefined
            };

            if (sessionId) {
                // Platform Mode Payment
                const platformPayload = {
                    ...payload,
                    session_id: sessionId,
                    payment_method_id: user ? selectedInstrument.id : undefined,
                    guest_email: !user ? formData.email : undefined,
                    guest_instrument: !user ? {
                        type: guestType,
                        number: guestType === 'card' ? formData.cardNumber : formData.accountNumber,
                        provider: guestType === 'card' ? 'Visa' : formData.bankName, // Placeholder
                        cvv: formData.cvv,
                        expiry: formData.expiry
                    } : undefined
                };
                result = await api.post('/platform/process-payment', platformPayload);
            } else {
                // Simulator Mode Transfer
                result = await api.post('/simulator/pay', {
                    ...payload,
                    payment_method_id: selectedInstrument.id,
                    amount: parseFloat(formData.amount),
                    receiver_id: formData.receiverId.split(':')[0],
                    receiver_type: formData.receiverId.split(':')[1],
                });
            }

            if (result.data?.status === 'requires_otp') {
                setAuthType('otp');
                setAuthError('');
                setIsAuthModalOpen(true); // Open modal if it was closed (guest bypass)
            } else {
                setSuccess(true);
                setIsAuthModalOpen(false);
                if (sessionId && result.data?.redirect_url) {
                    setTimeout(() => {
                        window.location.href = result.data.redirect_url;
                    }, 2000);
                }
            }
        } catch (err) {
            const msg = err.error?.message || err.message || 'Verification failed';
            if (isAuthModalOpen) setAuthError(msg);
            else setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        // ... (existing success UI stays same)
    return (
      <AppLayout>
        <div className="max-w-md mx-auto py-20 text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-success/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="w-24 h-24 bg-success/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-2 border-success/30 shadow-2xl relative z-10">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2 uppercase">Payment Success!</h2>
            <p className="text-slate-500 font-medium italic">
              {sessionId ? 'Redirecting you back to merchant...' : 'Your transaction has been settled instantly.'}
            </p>
          </div>
          <Button onClick={() => sessionId ? navigate('/dashboard') : setSuccess(false)} variant="outline" className="w-full py-6 font-black uppercase tracking-widest">
            {sessionId ? 'BACK TO DASHBOARD' : 'MAKE ANOTHER PAYMENT'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
        <div className="flex items-center space-x-6">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-2xl shadow-primary/5">
            {sessionId ? <ShoppingBag className="w-8 h-8" /> : <Send className="w-8 h-8" />}
          </div>
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase underline decoration-primary/30 underline-offset-8">
              {sessionId ? 'Secure Checkout' : 'Make Payment'}
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic">
              {sessionId ? `Authorized Payment for ${sessionData?.app_name || 'Merchant'}` : 'Instant Peer-to-Peer Settlement'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left Column: Method Selection */}
          <div className="lg:col-span-3 space-y-6">
            {!user ? (
              <div className="space-y-8 animate-in slide-in-from-left duration-500">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Guest Payment Details</h4>
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase">Secure Guest Flow</Badge>
                </div>

                <Card className="bg-slate-900 overflow-hidden border-white/5 rounded-[2.5rem]">
                  <CardContent className="p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">Contact Email</label>
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <div className="flex space-x-2 p-1.5 bg-black/40 rounded-2xl mb-6">
                        <button 
                          onClick={() => setGuestType('card')}
                          className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", guestType === 'card' ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-white")}
                        >
                          Credit / Debit Card
                        </button>
                        <button 
                          onClick={() => setGuestType('bank')}
                          className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", guestType === 'bank' ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-white")}
                        >
                          Bank Account
                        </button>
                      </div>

                      {guestType === 'card' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">Card Number</label>
                            <input 
                              type="text"
                              value={formData.cardNumber}
                              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                              className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all"
                              placeholder="0000 0000 0000 0000"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">Expiry</label>
                              <input 
                                type="text"
                                value={formData.expiry}
                                onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                                className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all"
                                placeholder="MM/YY"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">CVV</label>
                              <input 
                                type="password"
                                value={formData.cvv}
                                onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                                className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all"
                                placeholder="***"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">Bank Name</label>
                            <input 
                              type="text"
                              value={formData.bankName}
                              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                              className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all"
                              placeholder="e.g. HDFC Bank"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">Account Number</label>
                            <input 
                              type="text"
                              value={formData.accountNumber}
                              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                              className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-primary/50 outline-none transition-all"
                              placeholder="000000000000"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <div className="p-6 bg-primary/5 border border-primary/10 rounded-[2rem] flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary"><ShieldCheck className="w-6 h-6" /></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed italic">
                    You are paying as a guest. To save these methods and track history, consider <button onClick={() => navigate('/login')} className="text-primary hover:underline underline-offset-4">creating an account</button>.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Choose funding source</h4>
                  <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400">{instruments.length} Methods Available</Badge>
                </div>
                {fetching ? (
                  <div className="p-24 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Securely loading your vault...</p>
                  </div>
                ) : instruments.length > 0 ? (
                  <div className="grid gap-4">
                    {instruments.map(inst => (
                      <div 
                        key={inst.id}
                        onClick={() => setSelectedInstrument(inst)}
                        className={cn(
                          "group flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden relative",
                          selectedInstrument?.id === inst.id 
                            ? "bg-primary/5 border-primary shadow-2xl shadow-primary/10" 
                            : "bg-slate-900/40 border-white/5 hover:border-white/10"
                        )}
                      >
                        {selectedInstrument?.id === inst.id && (
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        )}
                        <div className="flex items-center space-x-5 relative z-10">
                          <div className={cn(
                            "p-4 rounded-2xl transition-all duration-500 group-hover:scale-110",
                            selectedInstrument?.id === inst.id 
                              ? "bg-primary text-white shadow-lg shadow-primary/20" 
                              : "bg-slate-800 text-slate-500"
                          )}>
                            {inst.method_type === 'credit_card' ? <CreditCard className="w-6 h-6" /> : inst.method_type === 'wallet' ? <Wallet className="w-6 h-6" /> : <Landmark className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight italic">
                              {inst.method_type === 'credit_card' ? `${inst.details?.card_brand} •••• ${inst.details?.card_last_four}` : inst.method_type === 'wallet' ? 'PaySim Digital Wallet' : inst.details?.bank_name}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic leading-none mt-1.5 opacity-60">
                              {inst.method_type === 'credit_card' ? 'CREDIT CARD' : inst.method_type === 'wallet' ? `Balance: ₹${parseFloat(inst.details?.balance || 0).toLocaleString()}` : `AC: •••• ${inst.details?.account_last_four} · ${inst.details?.account_type}`}
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                          selectedInstrument?.id === inst.id ? "bg-primary text-white scale-100" : "bg-slate-800 text-slate-600 scale-75 opacity-0 group-hover:opacity-100"
                        )}>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed border-white/10 bg-transparent text-center p-20 rounded-[3rem]">
                    <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-700">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400 italic mb-2">Vault is Empty</h3>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-8">No payment methods linked to your account.</p>
                    <Button onClick={() => navigate('/banking/add')} variant="outline" className="px-8 border-slate-800 text-slate-400 hover:text-white rounded-2xl">Setup First Method</Button>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Right Column: Summary & Authorization */}
          <div className="lg:col-span-2 space-y-8">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-1">Transaction Details</h4>
            
            <Card className="border-white/5 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
              
              <CardContent className="p-8 space-y-8 relative z-10">
                {!sessionId && (
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">Target Receiver</label>
                    <div className="relative group">
                      <select 
                        value={formData.receiverId}
                        onChange={(e) => setFormData({ ...formData, receiverId: e.target.value })}
                        className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl py-4 px-5 text-white text-xs font-bold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none appearance-none transition-all"
                      >
                        <option value="">Select individual or merchant...</option>
                        {receivers.merchants?.map(m => (
                          <option key={m.id} value={`${m.id}:merchant`}>{m.name} (Merchant)</option>
                        ))}
                        {receivers.customers?.map(c => (
                          <option key={c.id} value={`${c.id}:customer`}>{c.name} (Customer)</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 rotate-90 pointer-events-none" />
                    </div>
                  </div>
                )}

                {sessionId && (
                  <div className="p-4 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">Paying to Merchant</p>
                    <p className="text-xl font-black text-white italic tracking-tighter">{sessionData?.merchant || 'NexStore'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{sessionData?.description}</p>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3 pl-1">Amount to Pay</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-600 italic">₹</span>
                    <input 
                      type="number"
                      readOnly={!!sessionId}
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={cn(
                        "w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl py-5 pl-12 pr-6 text-white text-3xl font-black tracking-tighter focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all",
                        sessionId && "opacity-80"
                      )}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {selectedInstrument && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block pl-1">Voucher Preview</label>
                    <div className="w-full flex justify-center">
                      <div className="origin-top flex justify-center w-full">
                        <VisualCard 
                          type={selectedInstrument.method_type === 'credit_card' ? 'card' : selectedInstrument.method_type === 'bank_account' ? 'bank' : 'wallet'} 
                          data={selectedInstrument.details} 
                          interactive={false}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handlePaymentInitiate} 
                  disabled={loading || !selectedInstrument || (sessionId && !sessionData)} 
                  className="w-full py-8 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 rounded-2xl group overflow-hidden"
                >
                  <div className="flex items-center justify-center space-x-3 relative z-10 transition-transform group-hover:scale-110">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Authorize Settlement</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Button>
              </CardContent>
            </Card>

            <div className="flex flex-col items-center space-y-4 opacity-40 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>PCI-DSS Level 1 Encryption Active</span>
              </div>
              <p className="text-[8px] text-slate-700 max-w-xs text-center font-bold tracking-widest uppercase italic">
                By authorizing this payment you agree to PaySim terms and realize that funds are moved via real-time gross settlement systems.
              </p>
            </div>
          </div>
        </div>
      </div>

      <PaymentAuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onVerify={handleAuthVerify}
        type={authType}
        loading={loading}
        error={authError}
      />
    </AppLayout>
  );
};

export default Checkout;

