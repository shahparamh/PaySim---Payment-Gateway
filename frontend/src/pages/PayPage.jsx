import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, CreditCard, Landmark, Wallet, ArrowRight } from "lucide-react";
import axios from 'axios';

// ── Plain axios — NO auth interceptors, NO redirect to /login ────────────────
const publicApi = axios.create({ baseURL: '/api/v1', headers: { 'Content-Type': 'application/json' } });
publicApi.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data || { message: 'Network error. Please try again.' })
);

// Standalone public checkout — no login needed, no sidebar, no navbar
const PayPage = () => {
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState('details'); // 'details' | 'auth' | 'success'

  const [form, setForm] = useState({
    email: '', name: '', payMode: 'card',
    cardNumber: '', expiry: '', cvv: '', upiId: '',
  });

  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [authType, setAuthType] = useState('pin');
  const [paying, setPaying] = useState(false);
  const [txnResult, setTxnResult] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await publicApi.get(`/platform/payment/${sessionId}`);
        // API returns {status, data} — unwrap
        setSession(res.data || res);
      } catch (err) {
        setError(
          err.status === 404 || err.statusCode === 404
            ? 'This payment link is invalid or has expired.'
            : 'Failed to load payment details. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchSession();
    else { setError('Invalid payment link.'); setLoading(false); }
  }, [sessionId]);

  const buildPayload = (extraAuth = {}) => {
    const details = {};
    if (form.payMode === 'card') {
      details.card_number = form.cardNumber.replace(/\s/g, '');
      // Parse expiry MM/YY into month/year
      const [em, ey] = (form.expiry || '').split('/');
      details.expiry_month = em || '12';
      details.expiry_year  = ey ? `20${ey}` : '2030';
      details.cardholder_name = form.name || 'Guest';
      details.cvv = form.cvv;
      details.last4 = (form.cardNumber.replace(/\s/g, '')).slice(-4);
      details.brand = 'visa';
    } else if (form.payMode === 'upi') {
      details.upi_id = form.upiId;
    } else {
      details.bank = 'Guest Bank';
      details.account_holder_name = form.name || 'Guest';
    }
    return {
      session_id: sessionId,
      email: form.email,        // backend expects 'email', not 'guest_email'
      method_type: form.payMode, // backend expects 'method_type', not 'payment_method_type'
      details,                   // card/upi data must be nested in 'details'
      ...extraAuth,
    };
  };

  const submit = async (payload) => {
    setPaying(true);
    setError('');
    try {
      const res = await publicApi.post('/platform/process-payment', payload);
      // Backend returns { status:'success', data:{ requires_otp: true } } on first call
      if (res?.data?.requires_otp || res?.requires_otp) {
        setAuthType('otp');
        setStep('auth');
        return;
      }
      setTxnResult(res.data || res);
      setStep('success');
    } catch (err) {
      const msg = err.message || 'Payment failed. Please check your details.';
      const lower = msg.toLowerCase();
      if (lower.includes('otp')) { setAuthType('otp'); setStep('auth'); }
      else if (lower.includes('pin')) { setAuthType('pin'); setStep('auth'); }
      else { setError(msg); }
    } finally {
      setPaying(false);
    }
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!form.email) return setError('Email is required to process payment.');
    submit(buildPayload());
  };

  const handleAuth = (e) => {
    e.preventDefault();
    // Backend expects field name otp_code
    submit(buildPayload(authType === 'otp' ? { otp_code: otp } : { pin }));
  };

  // ── Helpers ──────────────────────────────────────────────────
  const sessionAmount = parseFloat(session?.amount || session?.session?.amount || 0);
  const sessionDesc   = session?.description || session?.session?.description || 'Payment Request';
  const sessionExp    = session?.expires_at   || session?.session?.expires_at;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Top rainbow bar */}
      <div className="fixed top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-500 to-emerald-500" />

      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Secure Payment via</p>
          <span className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent italic tracking-tighter">
            PaySim
          </span>
          <p className="text-[10px] text-slate-700 mt-1 uppercase tracking-widest font-black">256-bit SSL · PCI-DSS Compliant</p>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          {/* ── Loading ── */}
          {loading ? (
            <div className="p-20 flex flex-col items-center gap-4 text-indigo-400">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black">Loading payment details...</p>
            </div>

          /* ── Error (no session) ── */
          ) : error && !session ? (
            <div className="p-16 flex flex-col items-center gap-4 text-red-400">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-center">{error}</p>
            </div>

          /* ── Success ── */
          ) : step === 'success' ? (
            <div className="p-12 flex flex-col items-center gap-5">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-white italic tracking-tighter">Payment Done!</h2>
                <p className="text-slate-400 text-sm mt-1">{sessionDesc}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 text-center w-full">
                <p className="text-4xl font-black text-white">₹{sessionAmount.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-black">Amount Paid</p>
              </div>
              {txnResult?.txn_id && (
                <p className="text-[10px] text-slate-600 font-mono">Txn ID: {txnResult.txn_id}</p>
              )}
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                Receipt sent to {form.email}
              </div>
            </div>

          /* ── OTP / PIN Auth ── */
          ) : step === 'auth' ? (
            <form onSubmit={handleAuth} className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                  {authType === 'otp' ? 'Enter OTP' : 'Enter PIN'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {authType === 'otp'
                    ? 'A 6-digit code was sent to your registered email/phone.'
                    : 'Enter your 4-digit PaySim payment PIN to authorise.'}
                </p>
              </div>
              <div className="text-center">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={authType === 'otp' ? 6 : 4}
                  required
                  placeholder={authType === 'otp' ? '———  ———' : '— — — —'}
                  value={authType === 'otp' ? otp : pin}
                  onChange={e => authType === 'otp' ? setOtp(e.target.value) : setPin(e.target.value)}
                  className="w-full bg-black/50 border border-amber-500/20 rounded-2xl py-5 px-4 text-white text-2xl text-center tracking-[0.8em] font-black outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}
              <button
                type="submit"
                disabled={paying}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-600/20"
              >
                {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                Verify & Pay ₹{sessionAmount.toLocaleString('en-IN')}
              </button>
            </form>

          /* ── Main Payment Form ── */
          ) : (
            <form onSubmit={handlePay} className="divide-y divide-white/5">
              {/* Amount hero */}
              <div className="p-8 text-center bg-gradient-to-b from-indigo-600/10 to-transparent">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{sessionDesc}</p>
                <p className="text-5xl font-black text-white tracking-tighter">₹{sessionAmount.toLocaleString('en-IN')}</p>
                {sessionExp && (
                  <p className="text-[10px] text-slate-600 mt-2 font-mono">
                    Link valid until {new Date(sessionExp).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                  </p>
                )}
              </div>

              <div className="p-8 space-y-6">
                {/* Customer info */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Details</p>
                  <input
                    type="text" placeholder="Full Name" required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 transition-all"
                  />
                  <input
                    type="email" placeholder="Email address" required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 transition-all"
                  />
                </div>

                {/* Payment method tabs */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pay With</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'card', icon: CreditCard, label: 'Card' },
                      { key: 'bank', icon: Landmark, label: 'NetBanking' },
                      { key: 'upi', icon: Wallet, label: 'UPI' }
                    ].map(m => (
                      <button
                        key={m.key} type="button"
                        onClick={() => setForm({ ...form, payMode: m.key })}
                        className={`flex flex-col items-center gap-2 py-4 rounded-2xl border text-xs font-black uppercase tracking-tight transition-all ${
                          form.payMode === m.key
                            ? 'border-indigo-500/50 bg-indigo-600/15 text-indigo-400 shadow-lg shadow-indigo-600/10'
                            : 'border-white/5 bg-white/3 text-slate-500 hover:border-white/10 hover:text-slate-400'
                        }`}
                      >
                        <m.icon className="w-5 h-5" />
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {form.payMode === 'card' && (
                    <div className="space-y-2">
                      <input
                        type="text" placeholder="Card Number" maxLength={19}
                        value={form.cardNumber}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                          setForm({ ...form, cardNumber: v.replace(/(.{4})/g, '$1 ').trim() });
                        }}
                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-4 text-white text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text" placeholder="MM / YY" maxLength={5}
                          value={form.expiry}
                          onChange={e => {
                            let v = e.target.value.replace(/\D/g, '');
                            if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                            setForm({ ...form, expiry: v });
                          }}
                          className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-4 text-white text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                        <input
                          type="password" placeholder="CVV" maxLength={4}
                          value={form.cvv}
                          onChange={e => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-4 text-white text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                      </div>
                    </div>
                  )}

                  {form.payMode === 'upi' && (
                    <input
                      type="text" placeholder="yourname@upi" required
                      value={form.upiId}
                      onChange={e => setForm({ ...form, upiId: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  )}

                  {form.payMode === 'bank' && (
                    <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/15">
                      <p className="text-xs text-amber-400 font-bold">
                        You'll be redirected to your bank's secure page to authenticate and complete payment.
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <p className="text-red-400 text-xs font-bold text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={paying}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-2xl shadow-indigo-600/30"
                >
                  {paying ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    <><ArrowRight className="w-5 h-5" /> Pay ₹{sessionAmount.toLocaleString('en-IN')}</>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-700 font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> SSL Secured
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <p className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Powered by PaySim</p>
                  <div className="w-px h-3 bg-white/10" />
                  <p className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">PCI DSS</p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayPage;
