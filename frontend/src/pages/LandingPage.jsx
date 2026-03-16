import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowRight, 
  ChevronRight,
  Smartphone,
  BarChart3,
  Lock,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 overflow-x-hidden">
            {/* Background Decoration */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto border-b border-white/5 backdrop-blur-sm bg-black/10">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-slate-900/50 rounded-xl flex items-center justify-center shadow-lg border border-white/5 overflow-hidden p-1">
                        <img src="/logo.png" alt="PaySim" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter italic">PaySim</span>
                </div>
                <div className="hidden md:flex items-center space-x-10 text-sm font-bold uppercase tracking-widest text-slate-400">
                    <a href="#features" className="hover:text-primary transition-colors">Features</a>
                    <a href="#merchants" className="hover:text-primary transition-colors">Merchants</a>
                    <a href="#security" className="hover:text-primary transition-colors">Security</a>
                </div>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => navigate('/login')}
                        className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                    >
                        Sign In
                    </button>
                    <Button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                        Get Started
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto text-center lg:text-left lg:flex lg:items-center">
                <div className="lg:w-1/2 space-y-8">
                    <Badge variant="outline" className="px-4 py-1.5 border-primary/30 bg-primary/5 text-primary rounded-full animate-bounce">
                        🚀 Next-Gen Payment Infrastructure
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9]">
                        The Future of <span className="text-primary italic">Secure</span> Money.
                    </h1>
                    <p className="text-xl text-slate-400 max-w-xl font-medium leading-relaxed">
                        A unified payment gateway platform designed for developers, built for security, and loved by customers. Experience seamless transfers with bank-level protection.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
                        <Button onClick={() => navigate('/login')} className="w-full sm:w-auto px-10 py-7 text-lg font-black tracking-tight rounded-2xl group">
                            Start Banking <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <button className="flex items-center space-x-3 text-slate-300 font-bold hover:text-white transition-colors">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                                <Zap className="w-5 h-5" />
                            </div>
                            <span>Explore Merchant API</span>
                        </button>
                    </div>
                    <div className="pt-8 flex items-center space-x-8 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        <div className="flex items-center space-x-2"><ShieldCheck className="w-4 h-4 text-primary" /> <span>PCI DSS Compliant</span></div>
                        <div className="flex items-center space-x-2"><Lock className="w-4 h-4 text-primary" /> <span>256-bit Encryption</span></div>
                        <div className="flex items-center space-x-2"><Smartphone className="w-4 h-4 text-primary" /> <span>Mobile Ready</span></div>
                    </div>
                </div>

                <div className="hidden lg:block lg:w-1/2 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary/20 rounded-full blur-[150px] opacity-30"></div>
                    <div className="relative z-10 p-12 bg-white/[0.02] border border-white/10 rounded-[4rem] backdrop-blur-2xl shadow-2xl">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available Balance</p>
                                    <h2 className="text-4xl font-black italic tracking-tighter">₹1,24,950.<span className="text-slate-500">00</span></h2>
                                </div>
                                <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30">
                                    <BarChart3 className="text-primary w-8 h-8" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="p-6 bg-white/[0.03] border-white/5 hover:border-primary/30 transition-all cursor-default group">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                        <ArrowUpRight className="text-indigo-400 w-5 h-5 group-hover:text-primary transition-colors" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Limit</p>
                                    <p className="text-lg font-bold">₹5.0 L</p>
                                </Card>
                                <Card className="p-6 bg-white/[0.03] border-white/5 hover:border-primary/30 transition-all cursor-default group">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                        <Zap className="text-emerald-400 w-5 h-5 group-hover:text-primary transition-colors" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Growth</p>
                                    <p className="text-lg font-bold text-emerald-400">+12.5%</p>
                                </Card>
                            </div>

                            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 shadow-2xl shadow-primary/30 relative overflow-hidden group">
                                <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="relative z-10 flex justify-between items-end h-32">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Primary Wallet</p>
                                        <p className="text-2xl font-bold tracking-widest">**** **** **** 8852</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Status</p>
                                        <Badge className="bg-white/20 text-white font-black">ACTIVE</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
                <div className="text-center space-y-4 mb-20">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight underline decoration-primary decoration-4 underline-offset-8">One Platform. Any Payment.</h2>
                    <p className="text-slate-500 font-medium max-w-2xl mx-auto">We've built all the tools you need to manage your private finances or scale your business payments globally.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { 
                            icon: <Layers className="w-8 h-8" />, 
                            title: "Multi-Instrument", 
                            desc: "Connect Wallets, Credit Cards, and Bank Accounts seamlessly in one secure vault." 
                        },
                        { 
                            icon: <ShieldCheck className="w-8 h-8" />, 
                            title: "2-Stage Security", 
                            desc: "Bank-level encryption with 4-digit PIN for payments and 2FA OTP for high-value transactions." 
                        },
                        { 
                            icon: <Globe className="w-8 h-8" />, 
                            title: "PaySim Gateway", 
                            desc: "A developer-first API that allows any merchant to accept payments with just 3 lines of code." 
                        },
                        { 
                            icon: <Smartphone className="w-8 h-8" />, 
                            title: "Real-time Alerts", 
                            desc: "Get instant confirmation via platform notifications and professional email receipts." 
                        },
                        { 
                            icon: <Zap className="w-8 h-8" />, 
                            title: "Smart Routing", 
                            desc: "Automatic transaction failover and retry logic ensures your payments never get stuck." 
                        },
                        { 
                            icon: <BarChart3 className="w-8 h-8" />, 
                            title: "Advanced Analytics", 
                            desc: "Detailed spending charts and merchant ROI dashboards for data-driven decisions." 
                        }
                    ].map((feature, idx) => (
                        <Card key={idx} className="p-8 bg-white/[0.02] border-white/5 hover:border-primary/30 transition-all group scale-95 hover:scale-100 duration-500">
                            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                <span className="text-primary group-hover:scale-110 transition-transform">{feature.icon}</span>
                            </div>
                            <h3 className="text-xl font-black mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Merchant / NexStore Section */}
            <section id="merchants" className="relative z-10 py-32 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="md:w-1/2 order-2 md:order-1">
                        <div className="relative group cursor-pointer" onClick={() => navigate('/ecommerce')}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                            <div className="relative p-8 bg-black rounded-[2rem] border border-white/10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                            <div className="w-6 h-6 bg-black rounded-sm"></div>
                                        </div>
                                        <span className="text-xl font-black tracking-tight">NexStore</span>
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400">DEMO ACTIVE</Badge>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-40 bg-white/5 rounded-2xl flex items-center justify-center">
                                        <Smartphone className="w-20 h-20 text-white/10" />
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-t border-white/5">
                                        <p className="font-bold">MacBook Pro M3 Max</p>
                                        <p className="text-primary font-black">₹3,49,900</p>
                                    </div>
                                    <Button className="w-full py-6 font-black tracking-widest text-xs uppercase">
                                        Test Platform Integration <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:w-1/2 order-1 md:order-2 space-y-8">
                        <Badge className="bg-primary/20 text-primary border border-primary/20">MERCHANT ECOSYSTEM</Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Accept Payments <br/><span className="italic underline decoration-primary">Everywhere.</span></h2>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed">
                            Integrate our high-conversion checkout experience into your store in minutes. Features built-in fraud detection, high-value OTP protection, and automated receipts.
                        </p>
                        <div className="space-y-4 pt-4">
                            {[
                                "Customizable checkout branding",
                                "One-click merchant app registration",
                                "API Key management for production/sandbox",
                                "Webhooks and automated email receipts"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center space-x-3 text-slate-300 font-bold">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="relative z-10 py-32 px-6 max-w-5xl mx-auto text-center">
                <div className="p-16 rounded-[4rem] bg-gradient-to-br from-primary/10 to-indigo-600/10 border border-white/10 backdrop-blur-3xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50"></div>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none relative z-10">
                        Join the Revolution <br/>of <span className="text-primary italic">Fintech.</span>
                    </h2>
                    <p className="text-xl text-slate-400 font-medium max-w-xl mx-auto relative z-10">
                        Zero setup fees. Real-time settlements. Unparalleled security. Start your journey with PaySim today.
                    </p>
                    <div className="relative z-10 pt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <Button onClick={() => navigate('/login')} className="px-12 py-8 text-xl font-black tracking-tight rounded-3xl shadow-2xl shadow-primary/30">
                            Get Your Private Wallet
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 px-6 border-t border-white/5 bg-black">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center space-x-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="w-6 h-6 bg-slate-900/50 rounded-lg flex items-center justify-center p-0.5 border border-white/5 overflow-hidden">
                            <img src="/logo.png" alt="PaySim" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-lg font-black tracking-tighter italic">PaySim</span>
                    </div>
                    <div className="flex items-center space-x-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Documentation</a>
                        <a href="#" className="hover:text-primary transition-colors">API Status</a>
                    </div>
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                        &copy; 2026 PaySim Inc. All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
