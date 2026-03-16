import React, { useEffect, useState } from 'react';
import { Wallet, CheckCircle, Activity, Send, Plus, List, Loader2, ArrowUpRight, TrendingUp } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AppLayout } from "../components/layout/AppLayout";
import { StatCard } from "../components/dashboard/StatCard";
import { SpendingTrends } from "../components/dashboard/SpendingTrends";
import { ActionCard } from "../components/dashboard/ActionCard";
import { Button } from "../components/ui/Button";
import { VisualCard } from '../components/banking/VisualCard';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/export', { responseType: 'blob' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payment_report.csv');
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh] text-primary">
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight italic">Dashboard</h1>
            <p className="opacity-60 font-medium">Welcome back, <span className="opacity-100 uppercase font-bold tracking-tight">{user?.first_name || 'User'}</span></p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="border-border opacity-70" onClick={handleDownloadReport}>Download Report</Button>
            <Button variant="primary" onClick={() => navigate('/checkout')} className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />New Transaction
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
             <StatCard 
              title="Spent This Month" 
              value={`₹${stats?.spent_this_month?.toLocaleString() || '0'}`} 
              trend={stats?.spendingTrend || '0%'} 
              trendType={stats?.spendingTrend?.startsWith('+') ? 'up' : 'down'} 
              icon={Activity} 
            />
          </div>
          <div className="lg:col-span-1">
            <StatCard 
              title="Successful Payments" 
              value={stats?.successful || '0'} 
              subtitle={`${stats?.successRate || '100'}% Success Rate`} 
              trend={stats?.successTrend || '0%'} 
              trendType="up" 
              icon={CheckCircle} 
            />
          </div>
          <div className="lg:col-span-1">
            <VisualCard 
              type="wallet" 
              data={{ 
                balance: stats?.wallet_balance || 0,
                wallet_id: stats?.wallet_id || 'ce3bd37a...' 
              }} 
              onTopUp={() => navigate('/banking')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SpendingTrends chartData={stats?.chart} />
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Quick Actions</h4>
              <ArrowUpRight className="w-3 h-3 text-slate-600" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <ActionCard 
                title="Make a Payment" 
                description="Send money instantly" 
                icon={Send} 
                variant="primary" 
                onClick={() => navigate('/checkout')}
              />
              <ActionCard 
                title="Payment Methods" 
                description="Manage cards & banks" 
                icon={Wallet} 
                variant="success" 
                onClick={() => navigate('/banking')}
              />
              <ActionCard 
                title="Audit Ledger" 
                description="View full history" 
                icon={List} 
                variant="warning" 
                onClick={() => navigate('/transactions')}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
