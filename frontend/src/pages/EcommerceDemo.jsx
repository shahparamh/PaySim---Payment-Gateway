import React, { useState } from 'react';
import { ShoppingBag, Plus, X, ArrowRight, ShieldCheck, CheckCircle, Info } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const PRODUCTS = [
  { id: 1, name: "Titan Pro Smartphone", price: 89999, img: "/ecommerce/phone.png" },
  { id: 2, name: "Lunar Headphones", price: 24500, img: "/ecommerce/headphones.png" },
  { id: 3, name: "Vector Smartwatch", price: 12900, img: "/ecommerce/watch.png" }
];

const EcommerceDemo = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const addToCart = (product) => {
    setCart([...cart, product]);
    if (!isCartOpen) setIsCartOpen(true);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/platform/create-payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'sk_test_nexstore_demo_key_2026_secure' // NexStore Demo API Key
        },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          description: `Order for ${cart.length} items from NexStore`,
          success_redirect_url: window.location.origin + '/ecommerce/success',
          failure_redirect_url: window.location.origin + '/ecommerce/failure',
          metadata: {
            order_id: 'NS-' + Date.now(),
            items: cart.map(i => i.name).join(', ')
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        window.location.href = result.data.checkout_url;
      } else {
        alert('Payment Session Creation Failed: ' + result.error.message);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Checkout failed. Is the PaySim server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black italic">N</div>
            <span className="text-xl font-black tracking-tighter italic uppercase underline decoration-indigo-500 underline-offset-4">NexStore</span>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-white/70 hover:text-white transition-colors">
            <ShoppingBag className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-[10px] font-black flex items-center justify-center rounded-full border-2 border-black">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header className="py-24 px-6 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[150px] -z-10"></div>
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-indigo-600/10 text-indigo-400 border-indigo-600/20 px-4 py-1">NEW ARRIVALS 2026</Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            FUTURE OF TECH, <br />
            <span className="text-indigo-500 italic">DESIGNED FOR YOU.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 font-medium text-lg italic">
            Experience precision-engineered essentials that elevate your digital lifestyle. Minimalist design, maximal performance.
          </p>
        </div>
      </header>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {PRODUCTS.map(product => (
            <div key={product.id} className="group relative">
              <div className="aspect-square bg-white/5 rounded-[2rem] overflow-hidden border border-white/5 relative group-hover:border-indigo-600/30 transition-all duration-500">
                <img src={product.img} alt={product.name} className="w-full h-full object-contain p-12 group-hover:scale-110 transition-transform duration-700" />
                <button 
                  onClick={() => addToCart(product)}
                  className="absolute bottom-6 left-6 right-6 bg-white text-black py-4 rounded-2xl font-black text-sm uppercase translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Bag</span>
                </button>
              </div>
              <div className="mt-6 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold italic">{product.name}</h3>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Limited Edition</p>
                </div>
                <p className="text-xl font-black text-indigo-400 italic">₹{product.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cart Sidebar */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
        <aside className={`absolute top-0 right-0 w-full max-w-md h-screen bg-[#0a0a0a] border-l border-white/10 p-8 flex flex-col transition-transform duration-500 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-2xl font-black tracking-tighter italic">YOUR BAG</h2>
            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500 italic">
                <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                <p>Your bag is empty.</p>
              </div>
            ) : (
              cart.map((item, i) => (
                <div key={i} className="flex items-center space-x-4 bg-white/5 p-4 rounded-2xl border border-white/5 group">
                  <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden p-2">
                    <img src={item.img} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm italic">{item.name}</p>
                    <p className="text-indigo-400 font-black text-xs">₹{item.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => removeFromCart(i)} className="text-white/20 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total Amount</span>
              <span className="text-3xl font-black italic">₹{total.toLocaleString()}</span>
            </div>
            
            <Button 
              disabled={cart.length === 0 || loading} 
              onClick={handleCheckout}
              className="w-full py-8 text-lg font-black italic tracking-tighter bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-600/20"
            >
              {loading ? 'REDIRECTING...' : 'SECURE CHECKOUT'} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <div className="flex items-center justify-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3 text-indigo-500" />
              <span>Secured by PaySim Gateway</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-2xl font-black tracking-tighter italic mb-4">NEXSTORE</div>
          <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase mb-8 italic">DEMO E-COMMERCE SHOWCASE FOR PAYSIM</p>
          <div className="flex space-x-6 text-slate-600">
            <div className="w-1 h-1 rounded-full bg-slate-800"></div>
            <div className="w-1 h-1 rounded-full bg-slate-800"></div>
            <div className="w-1 h-1 rounded-full bg-slate-800"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EcommerceDemo;
