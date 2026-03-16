import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, Info, ShieldAlert, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'security': return <ShieldAlert className="w-4 h-4 text-danger" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-success" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in ring-1 ring-white/5">
      <div className="p-4 border-b border-border flex justify-between items-center bg-slate-900/50">
        <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Notifications</h3>
        <span className="text-[10px] font-bold text-slate-500">{notifications.filter(n => !n.is_read).length} Unread</span>
      </div>

      <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No new alerts</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={cn(
                "p-4 border-b border-border/50 hover:bg-white/5 transition-colors relative group",
                !notif.is_read && "bg-primary/5"
              )}
            >
              {!notif.is_read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
              <div className="flex gap-3">
                <div className="mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-black text-white leading-tight">{notif.title}</p>
                  <p className="text-[11px] text-slate-400 leading-normal">{notif.message}</p>
                  <div className="flex items-center text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeAgo(notif.created_at)}
                  </div>
                </div>
                {!notif.is_read && (
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 bg-slate-800 rounded-lg text-primary hover:bg-primary hover:text-white transition-all"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-slate-900/50 text-center border-t border-border">
        <button onClick={onClose} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Close Panel</button>
      </div>
    </div>
  );
};
