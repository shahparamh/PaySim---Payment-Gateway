import React, { useEffect, useState } from 'react';
import { List, Search, Download, Loader2, Clock, Filter, ChevronDown, CreditCard, Landmark, Wallet } from "lucide-react";
import api from '../services/api';
import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { cn } from '../utils/cn';

const Transactions = () => {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [mode, setMode] = useState('All Modes');
  const [limit, setLimit] = useState(15);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/transactions', {
          params: {
            search: debouncedSearch,
            status,
            mode,
            limit,
            page
          }
        });
        setTxns(res.data.transactions || []);
        setTotal(res.data.pagination?.total || 0);
      } catch (err) {
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [debouncedSearch, status, mode, limit, page]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
  };
  
  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await api.get('/dashboard/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  const getMethodIcon = (type) => {
    if (type?.includes('card')) return <CreditCard className="w-4 h-4" />;
    if (type?.includes('bank')) return <Landmark className="w-4 h-4" />;
    return <Wallet className="w-4 h-4" />;
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight italic">Transaction History</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={exporting}
              className="bg-slate-900 border-border text-slate-400"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Export
            </Button>
          </div>
        </div>

        <Card className="border-border/50 bg-slate-900 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3 text-white">
                <Clock className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-bold uppercase tracking-widest">All Transactions</span>
              </div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{total} total</span>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search by Transaction ID or Reference..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:ring-1 focus:ring-primary/50 outline-none transition-all" 
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-slate-800 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none appearance-none min-w-[120px]"
                >
                  <option>All Statuses</option>
                  <option>Success</option>
                  <option>Failed</option>
                </select>
                <select 
                  value={mode} 
                  onChange={(e) => setMode(e.target.value)}
                  className="bg-slate-800 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none appearance-none min-w-[120px]"
                >
                  <option>All Modes</option>
                  <option>Simulator</option>
                  <option>Platform</option>
                </select>
                <select 
                  value={limit} 
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="bg-slate-800 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none appearance-none min-w-[120px]"
                >
                  <option value={15}>15 per page</option>
                  <option value={30}>30 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto custom-scrollbar">
            {loading ? (
              <div className="p-24 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Decoding Ledger...</p>
              </div>
            ) : txns.length > 0 ? (
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-800/30">
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-border/50">TXN ID</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-border/50">METHOD</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-border/50">AMOUNT</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-border/50">TYPE</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-border/50">STATUS</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-border/50">MODE</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-border/50">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {txns.map(txn => (
                    <tr key={txn.id} className="hover:bg-slate-800/20 group transition-colors">
                      <td className="py-5 px-6 font-mono text-[11px] text-slate-400 group-hover:text-primary transition-colors">
                        {txn.transaction_id?.slice(0, 8) || `TXN-${txn.id.toString().padStart(6, '0')}`}
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-800 rounded-lg text-slate-400">{getMethodIcon(txn.instrument_type)}</div>
                          <span className="text-xs font-bold text-white uppercase tracking-tight">{txn.instrument_type?.replace(/_/g, ' ') || 'card'}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 font-black text-white text-sm">₹{parseFloat(txn.amount).toLocaleString()}</td>
                      <td className="py-5 px-6 font-bold text-slate-400 text-[11px] uppercase tracking-wider">{txn.type || 'payment'}</td>
                      <td className="py-5 px-6">
                        <Badge 
                          variant={txn.status === 'completed' || txn.status === 'success' ? 'success' : 'danger'} 
                          className="text-[10px] px-2.5 py-0.5"
                        >
                          {txn.status || 'success'}
                        </Badge>
                      </td>
                      <td className="py-5 px-6">
                        <span className="px-2 py-0.5 bg-slate-700/50 rounded-md text-[10px] font-black text-slate-200 uppercase tracking-widest">
                          {txn.mode || 'simulator'}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-[11px] font-bold text-slate-500 italic">
                        {formatDate(txn.created_at || new Date())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-32 text-center text-slate-500 italic font-medium">No transaction records found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Transactions;
