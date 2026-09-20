'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ActivitySquare, CreditCard, AlertTriangle, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'MODERATOR') {
      router.push('/moderator');
      return;
    }

    fetch('/api/admin/overview')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setData(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
        Error loading overview: {error}
      </div>
    );
  }

  const { stats, recentActivity, recentAuditLogs } = data;

  const cards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { title: "AI Tests Conducted", value: stats.totalAiTests, icon: ActivitySquare, color: "text-emerald-500" },
    { title: "Revenue (INR)", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: CreditCard, color: "text-purple-500" },
    { title: "Open Support Tickets", value: stats.openTickets, icon: AlertTriangle, color: stats.openTickets > 0 ? "text-red-500" : "text-slate-400" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-slate-900">Admin Overview</h1>
        <p className="text-slate-500 mt-2">Real-time system metrics and activity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-sm col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-slate-900">Recent AI Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No recent activity</p>
              ) : (
                recentActivity.map((test: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{test.user.name}</span>
                      <span className="text-xs text-slate-500">{new Date(test.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      test.riskLevel === 'Emergency' ? 'bg-red-100 text-red-700' :
                      test.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                      test.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {test.riskLevel}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-slate-900">System Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {recentAuditLogs.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No audit logs found</p>
              ) : (
                recentAuditLogs.map((log: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <div className={`mt-0.5 w-2 h-2 rounded-full ${
                      log.action.includes('DELETE') || log.action.includes('BLOCKED') ? 'bg-red-500' :
                      log.action.includes('CHANGE') || log.action.includes('ADJUSTMENT') ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-slate-500">{log.user?.email || 'System'} • {new Date(log.createdAt).toLocaleString()}</span>
                      {log.details && <span className="text-[10px] text-slate-400 mt-0.5">{log.details}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
