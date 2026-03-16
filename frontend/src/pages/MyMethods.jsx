import React, { useEffect, useState } from 'react';
import { CreditCard, Landmark, Wallet, Plus, ShieldCheck, Loader2, Trash2, Receipt } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { VisualCard } from '../components/banking/VisualCard';
import { TopUpModal } from '../components/banking/TopUpModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { PayBillModal } from '../components/banking/PayBillModal';
import { cn } from '../utils/cn';

const MyMethods = () => {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpError, setTopUpError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [isPayBillModalOpen, setIsPayBillModalOpen] = useState(false);
  const [selectedCardForBill, setSelectedCardForBill] = useState(null);

  const fetchData = async () => {
    try {
      const [instRes, walletRes] = await Promise.all([
        api.get('/instrument'),
        api.get('/dashboard/stats') // To get wallet balance/info
      ]);
      setInstruments(instRes.data);
      setWallet({
        balance: walletRes.data.wallet_balance,
        wallet_id: walletRes.data.wallet_id || 'ce3bd37a-4b92-4f1a'
      });
    } catch (err) {
      console.error('Failed to fetch methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteClick = (id) => {
    setSelectedForDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!selectedForDelete) return;
    try {
      setLoading(true);
      await api.delete(`/instrument/${selectedForDelete}`);
      await fetchData(); 
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedForDelete(null);
      setLoading(false);
    }
  };

  const handleTopUp = () => {
    setTopUpError('');
    setIsTopUpModalOpen(true);
  };

  const handlePayBillClick = (cardData) => {
    setSelectedCardForBill(cardData);
    setIsPayBillModalOpen(true);
  };

  const handleExecuteTopUp = async (amount) => {
    try {
      setLoading(true);
      setTopUpError('');
      
      const walletMethod = instruments.find(i => i.method_type === 'wallet');
      if (!walletMethod) throw new Error("Wallet instrument not found");

      await api.put(`/instrument/wallets/${walletMethod.instrument_id}/topup`, { amount });
      await fetchData(); 
      setIsTopUpModalOpen(false);
    } catch (err) {
      console.error(err);
      setTopUpError(err.error?.message || err.message || 'Failed to top up wallet');
    } finally {
      setLoading(false);
    }
  };

  const cards = instruments.filter(i => i.method_type === 'credit_card');
  
  // Deduplicate bank accounts by instrument_id
  const bankMap = new Map();
  instruments.filter(i => i.method_type === 'bank_account' || i.method_type === 'net_banking')
    .forEach(i => {
      if (!bankMap.has(i.instrument_id)) {
        bankMap.set(i.instrument_id, i);
      }
    });
  const banks = Array.from(bankMap.values());

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight italic">My Payment Methods</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20 text-primary">
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Wallets Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 opacity-60">
                <Wallet className="w-4 h-4" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Wallets</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wallet && <VisualCard type="wallet" data={wallet} onTopUp={handleTopUp} />}
              </div>
            </section>

            {/* Credit Cards Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 opacity-60">
                <CreditCard className="w-4 h-4" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Credit Cards</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map(card => {
                  const safeDetails = card?.details || {};
                  return (
                  <VisualCard 
                    key={card.id} 
                    type="card" 
                    data={{
                      ...safeDetails,
                      id: safeDetails.id, // Explicitly pass the credit card PK for API calls
                      limit: safeDetails.credit_limit,
                      used: safeDetails.used_credit
                    }} 
                    actions={
                      <>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          disabled={!safeDetails.used_credit || safeDetails.used_credit <= 0}
                          onClick={() => handlePayBillClick({
                            ...safeDetails,
                            id: safeDetails.id,
                            used: safeDetails.used_credit
                          })}
                          className={cn(
                            "bg-primary/20 hover:bg-primary shadow-lg",
                            (!safeDetails.used_credit || safeDetails.used_credit <= 0) && "opacity-50 cursor-not-allowed grayscale"
                          )}
                        >
                          <Receipt className="w-4 h-4 mr-2" /> Pay Bill
                        </Button>
                        <button 
                          onClick={() => handleDeleteClick(card.id)}
                          className="p-2 bg-danger/20 text-danger hover:bg-danger hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    }
                  />
                  );
                })}
              </div>
            </section>

            {/* Bank Accounts Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 opacity-60">
                <Landmark className="w-4 h-4" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Bank Accounts</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banks.map(bank => {
                  const safeBankDetails = bank?.details || {};
                  return (
                  <VisualCard 
                    key={bank.id} 
                    type="bank" 
                    data={safeBankDetails} 
                    active={bank.status === 'active'}
                  />
                  );
                })}
              </div>
            </section>

            <div className="pt-4 flex justify-start">
              <Button onClick={() => navigate('/banking/add')} variant="primary" className="px-8 shadow-xl shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Add New Method
              </Button>
            </div>
          </div>
        )}

        <div className="pt-12 border-t border-border/50">
          <section className="space-y-4">
            <h4 className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em]">Security & Trust</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="bg-primary/5 border-primary/20 flex items-start space-x-4 p-5">
                  <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold mb-1">Bank-level Security</h4>
                    <p className="text-xs opacity-60 italic">Every transaction is protected by 256-bit AES encryption.</p>
                  </div>
               </Card>
            </div>
          </section>
        </div>
        <TopUpModal 
            isOpen={isTopUpModalOpen}
            onClose={() => setIsTopUpModalOpen(false)}
            onTopUp={handleExecuteTopUp}
            loading={loading}
            error={topUpError}
        />
        <ConfirmModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleExecuteDelete}
            title="Remove Instrument?"
            message="This payment method will be permanently deleted from your secure vault. This action cannot be undone."
            confirmText="Delete Permanently"
        />
        <PayBillModal 
            isOpen={isPayBillModalOpen}
            onClose={() => setIsPayBillModalOpen(false)}
            card={selectedCardForBill}
            paymentMethods={instruments}
            onPaymentSuccess={fetchData}
        />
      </div>
    </AppLayout>
  );
};

export default MyMethods;
