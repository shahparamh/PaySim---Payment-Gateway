import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, Loader2, Shield, Globe, ChevronRight, AlertCircle, Settings } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import api from '../services/api';

// ── Step 1: Register App ─────────────────────────────
const RegisterAppForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    app_name: '',
    website_url: '',
    callback_url: 'https://example.com/webhook',
    environment: 'sandbox'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/platform/register-app', form);
      onSuccess(res.data);
    } catch (err) {
      setError(err.error?.message || err.message || 'Failed to register app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-indigo-600/20 bg-indigo-600/5">
        <CardHeader>
          <CardTitle className="text-xl font-black italic text-white uppercase flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            Register Your App
          </CardTitle>
          <p className="text-slate-400 text-sm mt-2">To generate API keys, first register your store or app with PaySim.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">App / Store Name *</label>
              <input
                type="text" required placeholder="My Online Store"
                value={form.app_name}
                onChange={e => setForm({ ...form, app_name: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Website URL (Optional)</label>
              <input
                type="url" placeholder="https://mystore.com"
                value={form.website_url}
                onChange={e => setForm({ ...form, website_url: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Webhook Callback URL *</label>
              <input
                type="url" required
                value={form.callback_url}
                onChange={e => setForm({ ...form, callback_url: e.target.value })}
                placeholder="https://yourstore.com/webhook"
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <p className="text-[10px] text-slate-600">PaySim will POST payment notifications to this URL.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Environment</label>
              <select
                value={form.environment}
                onChange={e => setForm({ ...form, environment: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-white text-sm outline-none"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
            </div>
            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-600/20">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ChevronRight className="w-5 h-5 mr-2" />}
              Register & Generate First API Key
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// ── New Key Alert ──────────────────────────────────────
const NewKeyAlert = ({ apiKey, onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };
  return (
    <Card className="border-emerald-500/30 bg-emerald-500/10 animate-slide-up">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 shrink-0"><Key className="w-5 h-5" /></div>
          <div className="flex-1 min-w-0">
            <h3 className="text-emerald-400 font-black uppercase tracking-tight text-sm mb-1">🎉 API Key Generated!</h3>
            <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-3">⚠️ Copy this now — it won't be shown again.</p>
            <div className="flex items-center gap-2 bg-black/60 p-3 rounded-xl border border-white/5">
              <code className="text-emerald-300 text-xs font-mono break-all flex-1">{apiKey}</code>
              <button onClick={copy} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-emerald-400 shrink-0">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Usage Example (curl)</p>
              <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`curl -X POST http://localhost:5001/api/v1/platform/create-payment-session \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 999, "description": "Order #1234"}'`}
              </pre>
            </div>
          </div>
          <button onClick={onDismiss} className="text-slate-500 hover:text-white shrink-0"><Plus className="w-4 h-4 rotate-45" /></button>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Main Component ────────────────────────────────────
const MerchantDeveloper = () => {
  const [apps, setApps] = useState([]);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [keyType, setKeyType] = useState('secret');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, keysRes] = await Promise.all([
        api.get('/platform/apps'),
        api.get('/platform/api-keys')
      ]);
      setApps(appsRes.data || []);
      setKeys(keysRes.data || []);
      if (appsRes.data?.length > 0 && !selectedAppId) {
        setSelectedAppId(appsRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch developer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAppRegistered = (data) => {
    // data.api_key is returned only on registration
    if (data.api_key) setNewKey(data.api_key);
    fetchData();
  };

  const handleGenerateKey = async () => {
    if (!selectedAppId) return;
    setGeneratingKey(true);
    try {
      const res = await api.post('/platform/api-keys', {
        merchant_app_id: selectedAppId,
        key_type: keyType
      });
      setNewKey(res.data.key);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Failed to generate key');
    } finally {
      setGeneratingKey(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh] text-amber-400">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-600/20 text-amber-400 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tight">Developer Settings</h1>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">API Keys & App Management</p>
          </div>
        </div>

        {/* New Key Alert */}
        {newKey && <NewKeyAlert apiKey={newKey} onDismiss={() => setNewKey(null)} />}

        {/* No Apps → Show Registration */}
        {apps.length === 0 ? (
          <RegisterAppForm onSuccess={handleAppRegistered} />
        ) : (
          <>
            {/* Apps List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apps.map(app => (
                <Card
                  key={app.id}
                  className={`cursor-pointer transition-all border-2 ${selectedAppId === app.id ? 'border-amber-600/50 bg-amber-600/5' : 'border-white/5 bg-slate-900/50 hover:border-white/10'}`}
                  onClick={() => setSelectedAppId(app.id)}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <Globe className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-black text-white text-sm italic uppercase">{app.app_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{app.website_url || 'No website URL'}</p>
                      </div>
                    </div>
                    <Badge variant={app.environment === 'production' ? 'success' : 'warning'} className="text-[10px] uppercase font-black">
                      {app.environment}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Generate Key Section */}
            <Card className="border-white/5 bg-slate-900/50">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-base font-bold text-white uppercase italic flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  Generate New API Key
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Key Type</label>
                  <select
                    value={keyType}
                    onChange={e => setKeyType(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-white text-sm outline-none"
                  >
                    <option value="secret">Secret Key (sk_...) — Server-side use only</option>
                    <option value="publishable">Publishable Key (pk_...) — Frontend safe</option>
                  </select>
                </div>
                <Button
                  onClick={handleGenerateKey}
                  disabled={generatingKey || !selectedAppId}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-black px-8 py-3 shadow-xl shadow-amber-600/20 uppercase tracking-widest text-sm"
                >
                  {generatingKey ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Generate Key
                </Button>
              </CardContent>
            </Card>

            {/* Existing Keys Table */}
            <Card className="border-white/5 bg-slate-900/50">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-base font-bold text-white uppercase italic">Active Keys</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {keys.length > 0 ? (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">App</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Type</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Prefix</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Env</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                        <th className="py-3 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {keys.map(key => (
                        <tr key={key.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6 font-bold text-white text-xs italic">{key.app_name}</td>
                          <td className="py-4 px-6 font-bold text-amber-400 uppercase text-[10px] tracking-widest">{key.key_type}</td>
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">{key.key_prefix}••••••••</td>
                          <td className="py-4 px-6">
                            <Badge variant={key.environment === 'production' ? 'success' : 'warning'} className="text-[10px] uppercase font-black">
                              {key.environment}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${key.is_active ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-slate-600'}`} />
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{key.is_active ? 'Active' : 'Disabled'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-[10px] font-mono text-slate-500">
                            {new Date(key.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center">
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 italic text-sm">No API keys yet. Generate your first key above.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Integration Guide */}
            <Card className="border-indigo-600/10 bg-indigo-600/5">
              <CardContent className="p-6">
                <h3 className="font-black text-white italic uppercase text-sm mb-4">Quick Integration Guide</h3>
                <div className="space-y-3 text-xs text-slate-400 font-mono">
                  <p className="font-bold text-slate-300">Step 1 — Create a Payment Session (from your server):</p>
                  <pre className="bg-black/40 p-3 rounded-lg text-[11px] overflow-x-auto">{`POST http://localhost:5001/api/v1/platform/create-payment-session
x-api-key: sk_test_YOUR_KEY_HERE

{ "amount": 1999, "description": "Premium Plan" }`}</pre>
                  <p className="font-bold text-slate-300 mt-3">Step 2 — Redirect your customer to the checkout URL from the response:</p>
                  <pre className="bg-black/40 p-3 rounded-lg text-[11px]">{`{ "checkout_url": "http://localhost:5001/checkout?session=abc123" }`}</pre>
                  <p className="font-bold text-slate-300 mt-3">Step 3 — PaySim handles payment and fires a webhook to your callback URL.</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MerchantDeveloper;
