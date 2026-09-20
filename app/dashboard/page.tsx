"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Clock, CreditCard, HeartPulse, History, ArrowRight, Link2, ExternalLink, Mail, Info } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinIcon } from "@/components/ui/CoinIcon";
import Image from "next/image";

export default function DashboardOverview() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(100);
  const [totalTests, setTotalTests] = useState(0);
  const [latestRisk, setLatestRisk] = useState("-");
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    // Fetch leaders
    fetch('/api/team/leaders')
      .then(res => res.json())
      .then(data => {
        if (data.leaders) setLeaders(data.leaders);
      });
    // Read credits
    const storedCredits = localStorage.getItem('niramayah_credits');
    if (storedCredits) {
      setCredits(parseInt(storedCredits));
    }
    
    // Listen for credits update
    const handleCreditsUpdate = () => {
      const updated = localStorage.getItem('niramayah_credits');
      if (updated) setCredits(parseInt(updated));
    };
    window.addEventListener('creditsUpdated', handleCreditsUpdate);
    
    // Read history
    const historyData = localStorage.getItem('niramayah_assessment_history');
    if (historyData) {
      const history = JSON.parse(historyData);
      setTotalTests(history.length);
      if (history.length > 0) {
        setLatestRisk(history[0].risk_level);
        setRecentActivity(history[0]);
      }
    }
    
    return () => window.removeEventListener('creditsUpdated', handleCreditsUpdate);
  }, []);

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'emergency': return 'text-red-600 border-red-200 bg-red-50';
      case 'high': return 'text-orange-600 border-orange-200 bg-orange-50';
      case 'moderate': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'low': return 'text-green-600 border-green-200 bg-green-50';
      default: return 'text-niramayah-navy border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-black text-niramayah-navy tracking-tight italic">
            Dashboard <span className="text-niramayah-green">Overview.</span>
          </h1>
          <p className="text-niramayah-gray mt-2 text-lg">Your personalized heart health monitoring center.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/ai-test">
            <Button className="bg-niramayah-green hover:bg-niramayah-green/90 text-white font-bold rounded-xl h-12 px-6">
              New Screening <HeartPulse className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-niramayah-gray">
              Available Credits
            </CardTitle>
            <CoinIcon />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-niramayah-navy">
              {user?.isUnlimitedCredits || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '∞' : user?.credits || 0}
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-niramayah-green rounded-full" style={{ width: '65%' }}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-niramayah-gray">
              Total Assessments
            </CardTitle>
            <Activity className="h-5 w-5 text-niramayah-green" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-niramayah-navy">{totalTests}</div>
            <p className="text-[10px] font-bold text-niramayah-green uppercase tracking-widest mt-2 flex items-center">
              Active Monitoring <ArrowRight className="ml-1 h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-niramayah-gray">
              Risk Profile
            </CardTitle>
            <HeartPulse className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black uppercase ${getRiskColor(latestRisk)} px-3 py-1 rounded-lg inline-block`}>
              {latestRisk}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-niramayah-gray">
              Membership
            </CardTitle>
            <CreditCard className="h-5 w-5 text-niramayah-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-niramayah-navy">FREE TIER</div>
            <Link href="/pricing" className="text-[10px] font-bold text-niramayah-green uppercase tracking-widest mt-2 hover:underline">
              Upgrade Plan →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <Card className="border-0 shadow-xl bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b p-8">
              <CardTitle className="text-2xl font-serif font-bold text-niramayah-navy">Recent Clinical Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {recentActivity ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${getRiskColor(recentActivity.risk_level)}`}>
                        {recentActivity.risk_level[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-niramayah-navy">Heart Health Screening</h4>
                        <p className="text-sm text-gray-500">{new Date(recentActivity.date).toLocaleDateString()} &bull; {recentActivity.patient_name || 'Personal Test'}</p>
                      </div>
                    </div>
                    <Link href="/dashboard/history">
                      <Button variant="ghost" size="sm" className="font-bold text-niramayah-green">View PDF</Button>
                    </Link>
                  </div>
                  <div className="p-6 bg-niramayah-navy rounded-2xl text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-niramayah-green/10 rounded-full blur-3xl group-hover:bg-niramayah-green/20 transition-all"></div>
                    <h5 className="text-xs font-black uppercase tracking-widest text-niramayah-green mb-3">AI Recommendation</h5>
                    <p className="text-sm leading-relaxed text-slate-300 italic">"{recentActivity.recommendation}"</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                    <History className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-niramayah-navy mb-2">No activity detected</h3>
                  <p className="text-niramayah-gray max-w-sm mb-8">Take your first assessment to begin tracking your cardiac health data.</p>
                  <Link href="/dashboard/ai-test">
                    <Button variant="outline" className="border-niramayah-green text-niramayah-green hover:bg-niramayah-green hover:text-white rounded-xl">Start Your First Test</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-0 shadow-lg bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-bold text-niramayah-navy">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: "Stability Index", value: "94%", color: "bg-niramayah-green" },
                { label: "Risk Mitigation", value: "High", color: "bg-blue-500" },
                { label: "Data Quality", value: "Premium", color: "bg-violet-500" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: i === 0 ? '94%' : i === 1 ? '85%' : '100%' }}></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-niramayah-green text-white rounded-3xl p-8 relative overflow-hidden group">
             <div className="relative z-10">
               <h3 className="text-xl font-bold mb-2">Need Expert Analysis?</h3>
               <p className="text-sm text-white/80 mb-6">Our Pro plans include prioritized medical consultant reviews of your AI results.</p>
               <Link href="/pricing">
                 <Button className="bg-white text-niramayah-green hover:bg-slate-50 font-bold rounded-xl w-full">View Pro Plans</Button>
               </Link>
             </div>
          </Card>
        </div>
      </div>

      {/* The Visionaries Section */}
      <section className="pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif font-black text-niramayah-navy tracking-tight italic">
              The <span className="text-niramayah-green">Visionaries.</span>
            </h2>
            <p className="text-niramayah-gray mt-1">The core team driving cardiac diagnostic innovation.</p>
          </div>
          <Link href="/about">
            <Button variant="outline" className="border-niramayah-navy text-niramayah-navy hover:bg-niramayah-navy hover:text-white rounded-xl h-11">
              About Us <Info className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {leaders.length > 0 ? (
            leaders.map((member, i) => (
              <Card key={i} className="border-slate-200 border-2 overflow-hidden group hover:border-niramayah-green transition-all duration-500 rounded-3xl bg-white shadow-sm hover:shadow-xl">
                <CardContent className="p-0">
                  <div className="aspect-square relative overflow-hidden">
                    <Image 
                      src={member.profileImage || "/placeholder-avatar.jpg"} 
                      alt={member.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-niramayah-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="p-5 text-center">
                    <p className="text-niramayah-navy font-bold truncate group-hover:text-niramayah-green transition-colors capitalize">{member.name}</p>
                    <p className="text-[9px] font-black text-niramayah-green uppercase tracking-widest mt-1 truncate">{member.coreRoleTitle || member.role}</p>
                    <div className="flex justify-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href="#"><Link2 className="h-3.5 w-3.5 text-slate-400 hover:text-niramayah-green" /></Link>
                      <Link href="#"><ExternalLink className="h-3.5 w-3.5 text-slate-400 hover:text-niramayah-green" /></Link>
                      <Link href="#"><Mail className="h-3.5 w-3.5 text-slate-400 hover:text-niramayah-green" /></Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-3xl animate-pulse"></div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
