import React from 'react';
import { Shield, Crown } from "lucide-react";
import { Card } from "../ui/Card";

export const MembershipCard = ({ type = "Standard", since = "2024" }) => (
  <Card className="bg-gradient-to-br from-indigo-950 to-slate-900 border-primary/20 relative overflow-hidden flex flex-col justify-between">
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="p-2 bg-primary/20 rounded-lg"><Crown className="w-5 h-5 text-primary" /></div><Shield className="w-5 h-5 text-slate-700" />
      </div>
      <div><p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Status</p><h4 className="text-xl font-black text-white italic tracking-tight">{type}</h4></div>
    </div>
    <div className="relative z-10 mt-6"><p className="text-xs text-slate-500">Member since</p><p className="text-sm font-bold text-slate-300 uppercase tracking-widest">{since}</p></div>
    <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
  </Card>
);
