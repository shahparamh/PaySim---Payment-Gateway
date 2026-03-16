import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity, Server, Loader2, AlertTriangle, CheckCircle, XCircle, Users, TrendingUp, DollarSign, RefreshCw } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { StatCard } from "../components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import api from '../services/api';
import { Button } from "../components/ui/Button";

const severityVariant = (s) => {
  if (s === 'critical') return 'danger';
  if (s === 'high') return 'danger';
  if (s === 'medium') return 'warning';
  return 'outline';
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [fraudStats, setFraudStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, fraudStatsRes, alertsRes, settlementsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/fraud-alerts/stats').catch(() => ({ data: {} })),
        api.get('/dashboard/fraud-alerts', { params: { status: 'open', limit: 10 } }).catch(() => ({ data: { alerts: [] } })),
        api.get('/admin/settlements', { params: { status: 'pending' } }).catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setFraudStats(fraudStatsRes.data || {});
      setAlerts(alertsRes.data?.alerts || []);
      setSettlements(settlementsRes.data || []);
    } catch (err) {
      console.error('Admin dashboard load failed:', err);
      setError('Failed to load admin data. Ensure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSettlement = async (id) => {
    try {
      setProcessingId(id);
      await api.patch(`/admin/settlements/${id}`, { status: 'completed' });
      await fetchData();
    } catch (err) {
      console.error('Failed to approve settlement:', err);
      setError('Failed to approve payout request.');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-red-400 gap-4">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Admin Console...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-600/20 text-red-400 rounded-xl">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic tracking-tight">Admin: Genesis</h1>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Platform Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">System Optimal</span>
            </div>
            <button onClick={fetchData} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Volume"
            value={`₹${(stats?.total_volume || 0).toLocaleString('en-IN')}`}
            trend={`${stats?.total_transactions || 0} txns`}
            icon={DollarSign}
          />
          <StatCard
            title="Successful"
            value={(stats?.successful || 0).toLocaleString()}
            trend="Completed"
            icon={CheckCircle}
          />
          <StatCard
            title="Failed"
            value={(stats?.failed || 0).toLocaleString()}
            trend="Needs review"
            icon={XCircle}
          />
          <StatCard
            title="Open Alerts"
            value={(fraudStats?.open || fraudStats?.total_open || 0).toLocaleString()}
            trend="Fraud signals"
            icon={AlertTriangle}
          />
        </div>

        {/* Fraud Alert Summary Row */}
        {fraudStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Critical', val: fraudStats.critical || 0, color: 'bg-red-500/10 border-red-500/20 text-red-400' },
              { label: 'High', val: fraudStats.high || 0, color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
              { label: 'Medium', val: fraudStats.medium || 0, color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
              { label: 'Low', val: fraudStats.low || 0, color: 'bg-slate-500/10 border-slate-500/20 text-slate-400' }
            ].map(item => (
              <Card key={item.label} className={`border ${item.color}`}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black">{item.val}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest mt-1 opacity-70">{item.label} Severity</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Open Fraud Alerts Table */}
        <Card className="border-red-600/10 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="border-b border-red-600/10">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2 italic uppercase">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Open Fraud Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {alerts.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-red-600/5">
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Alert Type</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Severity</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Customer</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Description</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Date</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-600/5">
                  {alerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-red-600/5 transition-colors">
                      <td className="py-4 px-6 font-bold text-white text-xs uppercase tracking-tight italic">
                        {(alert.alert_type || '').replace(/_/g, ' ')}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={severityVariant(alert.severity)} className="text-[10px] uppercase font-black">
                          {alert.severity}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">
                        {alert.customer_email || `CID-${alert.customer_id}`}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400 max-w-[200px] truncate">
                        {alert.description}
                      </td>
                      <td className="py-4 px-6 text-[10px] font-mono text-slate-500 italic">
                        {new Date(alert.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="warning" className="text-[10px] uppercase font-black">
                          {alert.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500/40 mx-auto mb-4" />
                <p className="text-slate-500 italic text-sm">No open fraud alerts.</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black mt-2">Platform operating normally.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settlement Queue */}
        <Card className="border-indigo-600/10 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="border-b border-indigo-600/10 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2 italic uppercase">
              <DollarSign className="w-5 h-5 text-indigo-400" />
              Pending Payout Requests
            </CardTitle>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{settlements.length} Pending</Badge>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {settlements.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-indigo-600/5">
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Payout ID</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Merchant</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Amount</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Date</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-600/5">
                  {settlements.map(s => (
                    <tr key={s.id} className="hover:bg-indigo-600/5 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-white uppercase tracking-tighter">
                        {s.settlement_id}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400 font-bold">
                        <div>{s.merchant?.business_name || `MID-${s.merchant_id}`}</div>
                        <div className="text-[10px] font-mono text-slate-600 mt-1 uppercase">
                          {s.bank_accounts ? `To: ${s.bank_accounts.bank_name} (****${s.bank_accounts.account_last_four})` : 'No Bank Linked'}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-black text-indigo-400 text-sm">
                        ₹{parseFloat(s.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6 text-[10px] font-mono text-slate-500 italic">
                        {new Date(s.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          onClick={() => handleApproveSettlement(s.id)}
                          disabled={processingId === s.id}
                          className="px-4 py-1.5 h-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[9px] rounded-lg disabled:opacity-50"
                        >
                          {processingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Process Payout'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <CheckCircle className="w-8 h-8 text-slate-800 mx-auto mb-3" />
                <p className="text-slate-600 italic text-xs uppercase font-black tracking-widest">No pending payouts</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-white/5 bg-slate-900/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2 italic uppercase">
                <Server className="w-4 h-4 text-slate-400" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'API Server', status: 'Online' },
                  { name: 'Oracle Database', status: 'Connected' },
                  { name: 'Payment Engine', status: 'Active' },
                  { name: 'Fraud Detection', status: 'Active' }
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                      <span className="text-[10px] text-emerald-400 font-black uppercase">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-slate-900/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2 italic uppercase">
                <Activity className="w-4 h-4 text-slate-400" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Success Rate</span>
                  <span className="text-xs font-black text-white">
                    {stats?.total_transactions > 0 ? `${Math.round((stats.successful / stats.total_transactions) * 100)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Spent This Month</span>
                  <span className="text-xs font-black text-white">₹{(stats?.spent_this_month || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Fraud Alert Rate</span>
                  <span className="text-xs font-black text-amber-400">
                    {stats?.total_transactions > 0 && fraudStats?.total
                      ? `${((fraudStats.total / stats.total_transactions) * 100).toFixed(2)}%`
                      : '0.00%'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">DB Engine</span>
                  <span className="text-xs font-black text-indigo-400">Oracle 23ai</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
