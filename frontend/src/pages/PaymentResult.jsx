import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { Button } from "../components/ui/Button";

const PaymentResult = () => {
  const { status } = useParams(); // URL format: /ecommerce/:status
  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${isSuccess ? 'bg-emerald-500/10' : 'bg-red-500/10'} rounded-full blur-[120px]`}></div>
      </div>

      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="flex justify-center">
          <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'} border-2 ${isSuccess ? 'border-emerald-500/30' : 'border-red-500/30'} shadow-2xl`}>
            {isSuccess ? <CheckCircle className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-black tracking-tighter italic uppercase mb-2">
            {isSuccess ? 'Payment Successful' : 'Payment Failed'}
          </h1>
          <p className="text-slate-500 font-medium italic">
            {isSuccess 
              ? 'Your order has been confirmed and is being prepared for shipment.' 
              : 'Something went wrong with your transaction. Please try again or use a different method.'}
          </p>
        </div>

        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>Order Reference</span>
            <span className="text-white italic">#NS-{Date.now().toString().slice(-6)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>Transaction Status</span>
            <span className={isSuccess ? 'text-emerald-400' : 'text-red-500'}>{isSuccess ? 'COMPLETED' : 'DECLINED'}</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3 pt-4">
          <Link to="/ecommerce">
            <Button className="w-full py-6 text-base font-black italic tracking-tighter bg-indigo-600 hover:bg-indigo-700">
              {isSuccess ? 'CONTINUE SHOPPING' : 'TRY AGAIN'}
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full py-4 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest flex items-center justify-center">
              <ArrowLeft className="w-3 h-3 mr-2" /> Return to PaySim Dashboard
            </Button>
          </Link>
        </div>

        <div className="pt-8 flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-4">
            <Heart className="w-4 h-4 text-indigo-500 fill-indigo-500" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-700 italic">Thank you for choosing NexStore</span>
          </div>
          <div className="text-2xl font-black tracking-tighter italic text-white/10 select-none">NEXSTORE</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
