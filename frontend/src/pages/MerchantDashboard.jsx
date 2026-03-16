import React, { useEffect, useState } from 'react';
import { Store, TrendingUp, DollarSign, Loader2, CheckCircle, Clock, Plus, BarChart2, Link as LinkIcon } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { AppLayout } from "../components/layout/AppLayout";
import { StatCard } from "../components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Badge } from "../components/ui/Badge";

const MerchantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        // ✅ Use the merchant-specific platform dashboard endpoint
        const res = await api.get('/platform/dashboard', { params: { range: 7 } });
        setDashData(res.data);
      } catch (err) {
        console.error('Merchant Dashboard load failed:', err);
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-indigo-400 gap-4">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Merchant Data...</p>
        </div>
      </AppLayout>
    );
  }

  const stats = dashData?.stats || {};
  const txns = dashData?.recent_transactions || [];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl shadow-inner">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic tracking-tight">Merchant Terminal</h1>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                {user?.business_name || user?.email} &nbsp;·&nbsp; ID: {user?.uuid?.slice(0, 8)?.toUpperCase() || 'MCH'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/merchant/links')}
              className="border-emerald-600/30 text-emerald-400 font-bold hover:bg-emerald-600/10"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Payment Links
            </Button>
            <Button
              onClick={() => navigate('/merchant/developer')}
              className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate API Key
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Revenue"
            value={`₹${(stats.total_revenue || 0).toLocaleString('en-IN')}`}
            trend="+Live"
            icon={DollarSign}
          />
          <StatCard
            title="Total Orders"
            value={(stats.total_transactions || 0).toLocaleString()}
            trend={`${stats.successful || 0} success`}
            icon={TrendingUp}
          />
          <StatCard
            title="Success Rate"
            value={`${stats.total_transactions > 0 ? Math.round((stats.successful / stats.total_transactions) * 100) : 0}%`}
            trend={`${stats.failed || 0} failed`}
            icon={CheckCircle}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="border-indigo-600/10 bg-indigo-600/5 hover:bg-indigo-600/10 transition-colors cursor-pointer group"
            onClick={() => navigate('/merchant/developer')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl group-hover:bg-indigo-600/30 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm uppercase tracking-tight italic">API Keys</p>
                <p className="text-xs text-slate-500">Integrate PaySim into your store</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="border-emerald-600/10 bg-emerald-600/5 hover:bg-emerald-600/10 transition-colors cursor-pointer group"
            onClick={() => navigate('/merchant/links')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl group-hover:bg-emerald-600/30 transition-colors">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm uppercase tracking-tight italic">Payment Links</p>
                <p className="text-xs text-slate-500">Create shareable payment requests</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="border-amber-600/10 bg-amber-600/5 hover:bg-amber-600/10 transition-colors cursor-pointer group"
            onClick={() => navigate('/transactions')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-600/20 text-amber-400 rounded-xl group-hover:bg-amber-600/30 transition-colors">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm uppercase tracking-tight italic">All Transactions</p>
                <p className="text-xs text-slate-500">View full transaction history</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="border-indigo-600/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="border-b border-indigo-600/10 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Recent Orders
              </CardTitle>
              <Button
                variant="ghost"
                onClick={() => navigate('/transactions')}
                className="text-xs text-indigo-400 font-bold hover:text-indigo-300"
              >
                View All →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {txns.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-indigo-600/5">
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Order ID</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Amount</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Mode</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-600/5">
                  {txns.map(txn => (
                    <tr key={txn.id} className="hover:bg-indigo-600/5 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">
                        {txn.txn_id?.slice(0, 8)?.toUpperCase() || `ORD-${String(txn.id).padStart(5, '0')}`}
                      </td>
                      <td className="py-4 px-6 font-black text-white">₹{parseFloat(txn.amount).toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-md font-black text-slate-400 uppercase tracking-widest">
                          {txn.mode || 'platform'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          variant={txn.status === 'success' || txn.status === 'completed' ? 'success' : 'danger'}
                          className="text-[10px]"
                        >
                          {txn.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-[10px] text-slate-500 font-mono italic">
                        {new Date(txn.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center">
                <p className="text-slate-500 italic text-sm mb-2">No orders yet.</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Start by sharing a payment link or integrating the API.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MerchantDashboard;
