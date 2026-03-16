import React from 'react';
import { Wallet, Landmark, CreditCard, Plus, ArrowUpRight, Eye } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';

export const VisualCard = ({ type, data, actions, variant = "default", onClick, active, onTopUp, interactive = true }) => {
  const safeData = data || {};
  const [showFullNumber, setShowFullNumber] = React.useState(false);
  const [fullNumber, setFullNumber] = React.useState('');
// ... (rest of VisualCard remains the same until the wallet button)
  const [fetchingNumber, setFetchingNumber] = React.useState(false);

  if (type === 'card' || type === 'credit_card') {
    const network = safeData.card_network?.toLowerCase() || 'visa';
    const bgColors = {
      visa: "bg-primary border-primary/20",
      mastercard: "bg-slate-800 border-slate-700",
      amex: "bg-slate-900 border-primary/20",
      rupay: "bg-slate-700 border-slate-600",
      default: "bg-slate-800 border-slate-700"
    };

    const formatCardNumber = (num) => {
      const lastFour = safeData.card_last_four || num?.slice(-4) || '0000';
      if (!showFullNumber && !fullNumber) return `•••• •••• •••• ${lastFour}`;
      const targetNum = fullNumber || num;
      if (!targetNum) return `•••• •••• •••• ${lastFour}`;
      return targetNum.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
    };

    const handleToggleNumber = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!showFullNumber && !fullNumber && safeData.id) {
        setFetchingNumber(true);
        try {
          const { default: api } = await import('../../services/api');
          const res = await api.get(`/instrument/cards/${safeData.id}/details`);
          setFullNumber(res.data.card_number);
          setShowFullNumber(true);
        } catch (err) {
          console.error('Failed to fetch card details:', err);
          alert('Unable to reveal card number at this time.');
        } finally {
          setFetchingNumber(false);
        }
      } else {
        setShowFullNumber(!showFullNumber);
      }
    };

    return (
      <div 
        onClick={onClick}
        className={cn(
          "relative w-full min-h-[220px] rounded-2xl p-6 overflow-hidden border shadow-2xl transition-all duration-500 group flex flex-col justify-between",
          bgColors[network] || bgColors.default,
          onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
          active ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]" : "hover:border-primary/20"
        )}
      >
        <div>
        {/* Chips and Holograms */}
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="w-10 h-8 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
              {[...Array(9)].map((_, i) => <div key={i} className="border-[0.5px] border-black" />)}
            </div>
          </div>
          {interactive && (
            <button 
              type="button"
              onClick={handleToggleNumber}
              disabled={fetchingNumber}
              className={cn(
                "p-2 bg-black/10 rounded-lg text-white/80 hover:text-white hover:bg-black/20 transition-all cursor-pointer z-50",
                fetchingNumber && "animate-pulse opacity-50"
              )}
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Card Number */}
        <div className="text-lg md:text-xl font-mono text-white tracking-widest md:tracking-[0.2em] mb-8 drop-shadow-md cursor-default whitespace-nowrap overflow-hidden text-ellipsis">
          {formatCardNumber(safeData.card_number)}
        </div>

        {/* Info & Meta */}
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">Cardholder</p>
            <p className="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[120px]">{safeData.cardholder_name || 'Sandesara'}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">Expires</p>
            <p className="text-xs font-bold text-white tracking-tight">{safeData.expiry_date || '12/2026'}</p>
          </div>
        </div>

        {/* Limits (Optional) */}
        {(safeData.limit !== undefined && safeData.limit !== null) && (
           <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[7px] font-black text-white/60 uppercase tracking-widest">Limit</p>
                <p className="text-[10px] font-bold text-white italic">₹{parseFloat(safeData.limit).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[7px] font-black text-white/60 uppercase tracking-widest">Used</p>
                <p className="text-[10px] font-bold text-white italic">₹{parseFloat(safeData.used || 0).toLocaleString()}</p>
              </div>
           </div>
        )}
        </div>

        {/* Icon Overlay for hover actions: Now a bottom slider */}
        {actions && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center space-x-4 z-20">
            {actions}
          </div>
        )}
      </div>
    );
  }

  if (type === 'wallet') {
    return (
      <div className="relative w-full rounded-2xl p-6 overflow-hidden bg-primary border shadow-2xl group transition-all duration-500 h-full flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-[80px] rounded-full" />
        
        <div className="mb-4 relative z-10">
          <div className="p-3 bg-black/10 rounded-xl w-fit">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="space-y-0.5 mb-6 relative z-10">
           <p className="text-2xl font-black text-white italic tracking-tighter">
             ₹{parseFloat(safeData.balance || 0).toLocaleString()}
           </p>
           <p className="text-[8px] font-black uppercase text-white/50 tracking-[0.2em]">INR WALLET</p>
        </div>

        <div className="flex justify-between items-center relative z-10">
          <div className="text-[8px] font-mono text-white/40 uppercase tracking-[0.1em] truncate max-w-[120px]">
             {safeData.wallet_id || 'ce3bd37a...'}
          </div>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTopUp && onTopUp(); }}
            className="flex items-center space-x-1.5 text-[10px] font-black text-white uppercase tracking-widest hover:text-white/80 transition-colors cursor-pointer z-50"
          >
            <Plus className="w-3 h-3" />
            <span>Top Up</span>
          </button>
        </div>
      </div>
    );
  }

  if (type === 'bank' || type === 'bank_account') {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "relative w-full rounded-2xl p-6 border transition-all duration-300 group",
          active 
            ? "bg-card border-primary ring-1 ring-primary" 
            : "bg-surface border-border hover:border-primary/50 cursor-pointer"
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "p-3 rounded-xl transition-colors",
              active ? "bg-primary/20 text-primary" : "bg-primary/5 text-primary group-hover:bg-primary/10"
            )}>
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold uppercase tracking-tight italic">{safeData.bank_name || 'STATE BANK OF INDIA'}</h4>
                <Badge variant="success" className="text-[8px] px-1.5 py-0">active</Badge>
              </div>
              <p className="text-[10px] opacity-60 uppercase tracking-widest font-black italic">
                •••• {safeData.account_last_four || 'XXXX'} · {safeData.account_type || 'SAVINGS'}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-black tracking-widest italic">
            ₹{parseFloat(safeData.balance || 0).toLocaleString()}
          </p>
          <p className="text-[8px] font-black opacity-50 uppercase tracking-[0.3em]">IFSC: {safeData.ifsc_code || 'N/A'}</p>
        </div>
      </div>
    );
  }

  return null;
};
