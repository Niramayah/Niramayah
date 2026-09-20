'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Plus, Trash2, Edit, Loader2, ArrowLeft, Check, X, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from 'next/link';

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  credits: number;
  features: string[];
  isActive: boolean;
  _count?: {
    subscriptions: number;
  };
}

export default function BillingManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '0',
    credits: '100',
    features: '',
    isActive: true
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/billing/plans');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Sort plans: Price ascending, then credits ascending
      const sortedPlans = [...data.plans].sort((a, b) => {
        if (a.price !== b.price) return a.price - b.price;
        return a.credits - b.credits;
      });
      
      setPlans(sortedPlans);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plans';
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPlan ? `/api/admin/billing/plans/${editingPlan.id}` : '/api/admin/billing/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const payload = {
        ...form,
        features: form.features.split(',').map(f => f.trim()).filter(f => f !== '')
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessage({ type: 'success', text: `Plan ${editingPlan ? 'updated' : 'created'} successfully` });
      setShowPlanModal(false);
      setEditingPlan(null);
      setForm({ name: '', description: '', price: '0', credits: '100', features: '', isActive: true });
      fetchPlans();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit plan';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan? This will affect existing subscriptions.')) return;
    try {
      const res = await fetch(`/api/admin/billing/plans/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchPlans();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete plan';
      alert(errorMessage);
    }
  };

  const toggleStatus = async (plan: SubscriptionPlan) => {
    try {
      const res = await fetch(`/api/admin/billing/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plan, isActive: !plan.isActive })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchPlans();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle status';
      alert(errorMessage);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Subscription & Billing</h1>
          <p className="text-slate-500 mt-2">Manage plans, pricing, and revenue models.</p>
        </div>
        <button 
          onClick={() => {
            setEditingPlan(null);
            setForm({ name: '', description: '', price: '0', credits: '100', features: '', isActive: true });
            setShowPlanModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 italic">
            No subscription plans created yet.
          </div>
        ) : (
          plans.map((plan, idx) => {
            return (
              <Card key={plan.id} className="border-0 shadow-sm overflow-hidden flex flex-col group relative transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
                <div className={`h-1.5 ${plan.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-serif text-slate-900">{plan.name}</CardTitle>
                    <button 
                      onClick={() => toggleStatus(plan)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${plan.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <div className="flex items-baseline gap-1 p-4 bg-slate-50 rounded-xl">
                    <span className="text-3xl font-bold text-slate-900">₹{plan.price}</span>
                    <span className="text-slate-500 text-sm">/ {plan.credits} Credits</span>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Included Features</p>
                     {plan.features && Array.isArray(plan.features) && plan.features.length > 0 ? (
                       <div className="space-y-1.5">
                         {plan.features.map((feature: string, fidx: number) => (
                           <div key={fidx} className="flex items-start gap-2 text-xs text-slate-600">
                             <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                             <span>{feature}</span>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <p className="text-xs text-slate-400 italic">No features listed</p>
                     )}
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                     <span className="text-[10px] text-slate-400 font-medium">{plan._count?.subscriptions || 0} active users</span>
                     <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingPlan(plan);
                          setForm({
                            name: plan.name,
                            description: plan.description || '',
                            price: plan.price.toString(),
                            credits: plan.credits.toString(),
                            features: Array.isArray(plan.features) ? plan.features.join(', ') : '',
                            isActive: plan.isActive
                          });
                          setShowPlanModal(true);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-all"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(plan.id)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg border-0 shadow-2xl">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-serif">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</CardTitle>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Plan Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Pro Cardiac Care"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                  <textarea 
                    placeholder="Briefly describe what this plan offers..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[60px]"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Price (INR)</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Credits Included</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      value={form.credits}
                      onChange={e => setForm({ ...form, credits: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Features (Comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="Unlimited tests, Priority support, Email reports"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    value={form.features}
                    onChange={e => setForm({ ...form, features: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Set as active plan</label>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex justify-center">
        <Link 
          href="/admin" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
