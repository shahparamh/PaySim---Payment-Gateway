import React from 'react';
import { Bell, Search, User } from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from "../ui/Button";
import { NotificationDropdown } from './NotificationDropdown';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { cn } from '../../utils/cn';

export const TopNavbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setUnreadCount(res.data.data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4 lg:hidden cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center p-1 border shadow-xl bg-background border-border hover:scale-105 transition-transform">
          <img src="/logo.png" alt="PaySim Logo" className="w-full h-full object-contain filter" />
        </div>
        <span className="text-lg font-black italic tracking-tighter">PaySim</span>
      </div>

      <div className="flex items-center flex-1 ml-4 lg:ml-0">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search transactions, users..." 
            className="w-full bg-background border border-border rounded-xl py-2 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:opacity-50" 
          />
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={cn(
                "relative group p-2 opacity-70 hover:opacity-100 transition-all",
                isNotifOpen && "text-primary bg-primary/10 opacity-100"
              )}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-danger rounded-full ring-2 ring-background animate-pulse"></span>
              )}
            </Button>
            <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
        </div>
        
        <div className="h-4 w-px bg-border"></div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black leading-tight uppercase tracking-tight">{user ? `${user.first_name} ${user.last_name}` : 'Guest'}</p>
            <div className="flex items-center justify-end">
              <div className="w-2 h-2 bg-success rounded-full mr-1.5 animate-pulse" />
              <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">{user?.type || 'Premium'}</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border cursor-pointer hover:border-primary/50 transition-all ring-offset-2 ring-offset-background hover:ring-2 ring-primary/20">
            <User className="opacity-70 w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
