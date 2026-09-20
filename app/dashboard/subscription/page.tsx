"use client";

import { useEffect, useState } from "react";
import { CreditCard, Check, ShieldCheck, Zap, AlertCircle, Loader2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  features: string[];
  isActive: boolean;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (res.ok) {
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedPlan) return;
    setActionLoading(selectedPlan.id);
    setShowPaymentModal(false);
    
    try {
      const res = await fetch('/api/subscription/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.status === 'SUCCESS') {
          toast({
            title: "Success!",
            description: data.message,
          });
          window.dispatchEvent(new Event('refreshNotifications'));
        } else if (data.status === 'PAYMENT_PENDING') {
          // This is the expected state for now as per user request
          toast({
            title: "Payment Pending",
            description: "Your payment record has been created. Please complete the transaction to receive credits.",
            className: "bg-blue-50 border-blue-200 text-blue-800"
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process request",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-niramayah-green mb-4" />
        <p className="text-niramayah-gray">Loading available plans...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-niramayah-navy tracking-tight">Cardiac Monitoring Plans</h1>
        <p className="text-niramayah-gray max-w-2xl mx-auto text-lg">
          Select a package that fits your health monitoring schedule. Credits never expire.
        </p>
      </div>

      {plans.length === 0 ? (
        <Card className="border-dashed border-2 p-12 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-niramayah-navy">No active plans</h3>
          <p className="text-niramayah-gray mt-2">No active plans available right now. Please check back later.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`group relative overflow-hidden flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out cursor-default hover:border-niramayah-green ${
                plan.name === 'Pro' 
                  ? 'border-niramayah-orange shadow-niramayah-orange/10 border' 
                  : 'border-2 border-slate-700/50'
              }`}
            >

              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-niramayah-green/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-serif text-niramayah-navy group-hover:text-niramayah-green transition-colors">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-6 pt-4 text-center">
                <div className="flex flex-col items-center justify-center py-6 bg-slate-50/80 rounded-3xl group-hover:bg-niramayah-green/5 transition-colors">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-niramayah-navy/60">₹</span>
                    <span className="text-5xl font-bold text-niramayah-navy">{plan.price}</span>
                  </div>
                  <span className="text-xs font-bold text-niramayah-green uppercase tracking-widest mt-2">Special Offer</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-niramayah-green font-bold justify-center bg-niramayah-green/10 py-2 rounded-full">
                    <Zap className="w-4 h-4 fill-current" />
                    <span className="text-sm">{plan.credits} AI Reports Included</span>
                  </div>
                  
                  <ul className="text-sm text-left space-y-3 px-4">
                    {Array.isArray(plan.features) && plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">
                          <Check className="w-4 h-4 text-niramayah-green" />
                        </div>
                        <span className="text-niramayah-navy/70 leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              
              <CardFooter className="pt-6 border-t bg-slate-50/50">
                <Button 
                  className="w-full bg-niramayah-navy hover:bg-niramayah-navy/90 text-white h-12 text-base font-bold shadow-md hover:shadow-xl transition-all active:scale-95"
                  onClick={() => handleBuyClick(plan)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Buy Now
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Enterprise Section */}
      <div className="mt-16 p-10 bg-gradient-to-br from-niramayah-navy to-[#0A1A31] text-white rounded-[2.5rem] relative overflow-hidden shadow-2xl border border-white/5 transition-all duration-500 ease-out">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/10 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-niramayah-green" />
              Institutional Access
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 transition-colors">Enterprise & Hospitals</h2>
            <p className="text-blue-100/80 text-lg leading-relaxed">
              We provide custom integration for hospitals, clinics, and insurance providers. Get bulk credits, priority API access, and institutional reporting.
            </p>
          </div>
          <div className="shrink-0">
            <Button 
              asChild
              className="bg-niramayah-green hover:bg-niramayah-green/90 text-white px-8 py-6 h-auto text-lg font-bold shadow-xl hover:shadow-niramayah-green/30 hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <Link href="/dashboard/support">Contact Support</Link>
            </Button>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-niramayah-green/10 rounded-full -mr-40 -mt-40 blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-niramayah-orange/10 rounded-full -ml-32 -mb-32 blur-[60px]"></div>
      </div>

      {/* Payment Pending Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border-niramayah-orange/20">
            <CardHeader className="text-center relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPaymentModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="w-16 h-16 bg-niramayah-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-niramayah-orange" />
              </div>
              <CardTitle className="text-2xl font-serif text-niramayah-navy">Checkout Status</CardTitle>
              <CardDescription>Payment Gateway Integration</CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl mb-6">
                <p className="text-niramayah-orange font-bold mb-1">Integration Pending</p>
                <p className="text-sm text-orange-800/80">
                  Direct online payments are currently being configured. Clicking "Continue" will create a pending request.
                </p>
              </div>
              <p className="text-niramayah-navy/70 text-sm">
                You are purchasing the <strong className="text-niramayah-navy">{selectedPlan?.name}</strong> for <strong className="text-niramayah-navy">₹{selectedPlan?.price}</strong>.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                className="w-full bg-niramayah-navy hover:bg-niramayah-navy/90 text-white py-6 font-bold"
                onClick={confirmPurchase}
              >
                Continue to Payment Record
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-gray-500 font-medium"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
