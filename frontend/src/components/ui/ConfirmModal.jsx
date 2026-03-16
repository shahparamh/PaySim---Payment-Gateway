import React from 'react';
import { X, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', confirmText = 'Confirm' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <Card className="w-full max-w-sm relative z-10 p-8 border-white/5 shadow-2xl animate-in scale-in duration-200 rounded-[2rem]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${type === 'danger' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
            {type === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <h3 className="text-lg font-black text-white italic uppercase tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-slate-800 text-slate-500 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            variant={type === 'danger' ? 'danger' : 'primary'} 
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest shadow-xl ${type === 'danger' ? 'shadow-danger/20' : 'shadow-primary/20'}`}
          >
            {confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
};
