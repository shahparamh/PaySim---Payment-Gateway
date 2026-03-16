import React, { useState, useEffect } from 'react';
import { X, CreditCard, Wallet, Landmark, Loader2, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import api from '../../services/api';

export const PayBillModal = ({ isOpen, onClose, card, onPaymentSuccess, paymentMethods = [] }) => {
  const [amount, setAmount] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'success'

  // Filter sources to exclude the card itself and only show active ones
  const availableSources = paymentMethods.filter(m => 
    m.status === 'active' && 
    !(m.method_type === 'credit_card' && m.instrument_id === card?.id)
  );

  useEffect(() => {
    if (isOpen && card) {
      setAmount(card.used?.toString() || '');
      setPin('');
      setError('');
      setStep('input');
      // Auto-select default source if available
      const defaultSource = availableSources.find(s => s.is_default);
      if (defaultSource) setSelectedSourceId(defaultSource.id.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, card?.id]); // Only re-run when modal opens or card changes

  if (!isOpen) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedSourceId) {
      setError('Please select a payment source');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!pin || pin.length < 4) {
      setError('Please enter your 4-6 digit payment PIN');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post(`/instrument/cards/${card.id}/pay-bill`, {
        source_method_id: parseInt(selectedSourceId),
        amount: parseFloat(amount),
        pin: pin
      });
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedSource = availableSources.find(s => s.id.toString() === selectedSourceId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black italic tracking-tight">Pay Credit Card Bill</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Card ending in {card?.card_last_four || '••••'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'input' ? (
          <form onSubmit={handlePay} className="p-6 space-y-6">
            {/* Balance Info */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest mb-1">Outstanding Balance</p>
              <p className="text-3xl font-black italic text-primary">₹{parseFloat(card?.used || 0).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Payment Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-muted/50 border border-border rounded-xl py-2.5 pl-7 pr-3 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => setAmount(card?.used?.toString())}
                  className="text-[9px] font-bold text-primary hover:underline ml-1"
                >
                  Pay Full Amount
                </button>
              </div>

              {/* PIN Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Payment PIN</label>
                <input 
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full bg-muted/50 border border-border rounded-xl py-2.5 px-4 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all text-center tracking-[0.5em]"
                  required
                />
              </div>
            </div>

            {/* Source Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Select Payment Source</label>
              <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-1">
                {availableSources.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => setSelectedSourceId(source.id.toString())}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border transition-all text-left",
                      selectedSourceId === source.id.toString()
                        ? "bg-primary/10 border-primary ring-1 ring-primary"
                        : "bg-muted/30 border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      {source.method_type === 'wallet' && <Wallet className="w-4 h-4 text-primary" />}
                      {source.method_type === 'bank_account' && <Landmark className="w-4 h-4 text-primary" />}
                      {source.method_type === 'net_banking' && <Landmark className="w-4 h-4 text-primary" />}
                      <div>
                        <p className="text-[10px] font-bold uppercase truncate max-w-[120px]">
                          {source.method_type === 'wallet' ? 'Secure Wallet' : (source.details?.bank_name || 'Bank Account')}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {source.method_type === 'wallet' 
                            ? `Balance: ₹${parseFloat(source.details?.balance || 0).toLocaleString()}`
                            : `•••• ${source.details?.account_number?.slice(-4) || '9999'}`
                          }
                        </p>
                      </div>
                    </div>
                    {selectedSourceId === source.id.toString() && (
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-danger/10 border border-danger/20 rounded-xl flex items-center space-x-2 text-danger animate-shake">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <p className="text-[9px] font-bold uppercase tracking-tight">{error}</p>
              </div>
            )}

            <Button 
              type="submit"
              variant="primary"
              className="w-full py-5 rounded-2xl group relative overflow-hidden shadow-xl shadow-primary/20"
              disabled={loading || !selectedSourceId || !amount || !pin}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize & Pay</span>
                  </span>
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="p-12 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-2xl font-black italic italic tracking-tight">Payment Successful!</h3>
            <p className="text-xs opacity-60">Your credit card bill has been paid. Your limit will be refreshed shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
};
