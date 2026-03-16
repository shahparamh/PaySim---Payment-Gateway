import React from 'react';
import { Home, CreditCard, PieChart, User, LogOut, Plus, Send, ShoppingBag, Clock, ShieldCheck, Wallet } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from "../../utils/cn";

const NavItem = ({ icon: Icon, label, path }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === path;

  return (
    <button
      onClick={() => navigate(path)}
      className={cn(
        "flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
        active ? "bg-primary text-white shadow-lg shadow-primary/25" : "opacity-70 hover:opacity-100 hover:bg-primary/10"
      )}
    >
      <Icon className={cn("w-4 h-4 transition-transform duration-200", !active && "group-hover:scale-110")} />
      <span>{label}</span>
    </button>
  );
};

const NavSection = ({ label, children }) => (
  <div className="mb-6">
    <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">{label}</h4>
    <div className="space-y-1">{children}</div>
  </div>
);

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="w-64 h-screen bg-background border-r border-border flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 mb-4">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center p-1 border border-primary/20 shadow-xl hover:scale-105 transition-transform">
            <img src="/logo.png" alt="PaySim" className="w-full h-full object-contain filter" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent italic tracking-tighter">PaySim</span>
        </div>
      </div>
      
      <div className="flex-1 px-3 overflow-y-auto custom-scrollbar">
        <NavSection label="Home">
          <NavItem icon={Home} label="Home" path="/dashboard" />
          {user?.role === 'merchant' && <NavItem icon={PieChart} label="Merchant Center" path="/merchant/dashboard" />}
          {(user?.role === 'admin' || user?.role === 'super_admin') && <NavItem icon={ShieldCheck} label="Admin Hub" path="/admin/dashboard" />}
        </NavSection>
        
        <NavSection label="Payments">
          <NavItem icon={Send} label="Make Payment" path="/make-payment" />
          <NavItem icon={Clock} label="Transactions" path="/transactions" />
        </NavSection>

        <NavSection label="Banking">
          <NavItem icon={CreditCard} label="My Methods" path="/banking" />
          <NavItem icon={Plus} label="Add Method" path="/banking/add" />
        </NavSection>

        {user?.role === 'merchant' && (
          <>
            <NavSection label="Merchant Tools">
              <NavItem icon={Send} label="Payment Links" path="/merchant/links" />
              <NavItem icon={Wallet} label="Payouts" path="/merchant/payouts" />
            </NavSection>
            
            <NavSection label="Developer">
              <NavItem icon={Plus} label="API Keys" path="/merchant/developer" />
              <NavItem icon={ShieldCheck} label="Webhooks" path="/merchant/developer" />
            </NavSection>
          </>
        )}
        
        <NavSection label="Settings">
          <NavItem icon={User} label="My Profile" path="/profile" />
        </NavSection>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <button 
          onClick={logout}
          className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-all text-sm font-medium group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-0.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
