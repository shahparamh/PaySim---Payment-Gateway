import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Plus, Copy, Check, Loader2, AlertCircle, Calendar, RefreshCw, Send } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import api from '../services/api';

const MerchantLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    is_reusable: false
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/links');
      setLinks(res.data || []);
    } catch (err) {
      console.error('Failed to fetch links:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildShareableUrl = (link) => {
    // Use the URL returned directly by the server (includes correct host/IP)
    return link.url || `${window.location.origin}/pay/${link.session_id}`;
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    try {
      setCreating(true);
      await api.post('/platform/links', {
        amount: parseFloat(formData.amount),
        description: formData.description || 'Payment Request',
        is_reusable: formData.is_reusable
      });
      setFormData({ amount: '', description: '', is_reusable: false });
      setSuccessMsg('Payment link created! Share it with anyone.');
      await fetchLinks();
    } catch (err) {
      setError(err.error?.message || err.message || 'Failed to create link.');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (link) => {
    const url = buildShareableUrl(link);
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const shareViaText = (link) => {
    const url = buildShareableUrl(link);
    const text = `Pay ₹${parseFloat(link.amount).toLocaleString('en-IN')} for "${link.description}": ${url}`;
    if (navigator.share) {
      navigator.share({ title: 'Payment Request', text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl">
            <LinkIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tight">Payment Links</h1>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Generate & share payment requests instantly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Link Form */}
          <div className="lg:col-span-1">
            <Card className="border-emerald-600/20 bg-emerald-600/5 sticky top-8">
              <CardHeader>
                <CardTitle className="text-base font-black italic uppercase text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  New Payment Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateLink} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount (₹) *</label>
                    <input
                      type="number" required min="1" step="0.01"
                      placeholder="500"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-white font-bold text-lg outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Purpose / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Consulting Fee, Order #123"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl cursor-pointer" onClick={() => setFormData({ ...formData, is_reusable: !formData.is_reusable })}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData.is_reusable ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                      {formData.is_reusable && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Reusable Link</p>
                      <p className="text-[10px] text-slate-500">Expires in 1 year; can be paid multiple times</p>
                    </div>
                  </div>
                  {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                  {successMsg && <p className="text-emerald-400 text-xs font-bold">{successMsg}</p>}
                  <Button type="submit" disabled={creating} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-600/20">
                    {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <LinkIcon className="w-5 h-5 mr-2" />}
                    Create Payment Link
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Links List */}
          <div className="lg:col-span-2">
            <Card className="border-white/5 bg-slate-900/50 min-h-[400px]">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-black italic uppercase text-white">
                    My Payment Links ({links.length})
                  </CardTitle>
                  <button onClick={fetchLinks} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-20 flex justify-center text-emerald-400">
                    <Loader2 className="w-10 h-10 animate-spin" />
                  </div>
                ) : links.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {links.map(link => (
                      <div key={link.id} className="p-5 hover:bg-white/5 transition-colors group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-2xl font-black text-white italic tracking-tighter">
                                ₹{parseFloat(link.amount).toLocaleString('en-IN')}
                              </span>
                              <Badge
                                variant={link.status === 'completed' ? 'success' : link.status === 'pending' ? 'warning' : 'outline'}
                                className="text-[9px] uppercase font-black"
                              >
                                {link.status}
                              </Badge>
                              {link.is_reusable && (
                                <Badge variant="outline" className="text-[9px] uppercase font-black border-indigo-600/30 text-indigo-400">
                                  Reusable
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mb-2">{link.description || 'No description'}</p>
                            {/* Shareable URL */}
                            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-white/5 group-hover:border-emerald-500/20 transition-colors">
                              <code className="text-[10px] font-mono text-emerald-400 truncate flex-1">
                                {buildShareableUrl(link)}
                              </code>
                              <button
                                onClick={() => copyToClipboard(link)}
                                className="p-1 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                                title="Copy link"
                              >
                                {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => shareViaText(link)}
                                className="p-1 text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
                                title="Share via text"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(link.created_at).toLocaleDateString('en-IN')}
                            </div>
                            {link.expires_at && (
                              <p className="text-[9px] text-slate-600 mt-0.5">Exp: {new Date(link.expires_at).toLocaleDateString('en-IN')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-500 font-medium italic mb-2">No payment links yet.</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-black">Create one to start collecting payments.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MerchantLinks;
