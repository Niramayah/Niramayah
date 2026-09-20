'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Search, Loader2, ArrowLeft, Send, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Link from 'next/link';

export default function SupportManagement() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const fetchTickets = () => {
    setLoading(true);
    fetch('/api/admin/support/tickets')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setTickets(data.tickets);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'CLOSED': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'ESCALATED': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Support Center</h1>
          <p className="text-slate-500 mt-2">Manage customer queries and technical support tickets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-sm h-[600px] flex flex-col">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg font-serif">All Tickets</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">No tickets found</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {tickets.map((ticket) => (
                    <div 
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-slate-50 border-l-4 border-l-blue-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase">#{(ticket.id || '').substring(0, 8)}</span>
                        {getStatusIcon(ticket.status)}
                      </div>
                      <h4 className="font-medium text-slate-900 truncate">{ticket.subject}</h4>
                      <p className="text-xs text-slate-500 mt-1">{ticket.user.name} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="border-0 shadow-sm h-[600px] flex flex-col">
              <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-serif text-slate-900">{selectedTicket.subject}</CardTitle>
                  <p className="text-sm text-slate-500">From: {selectedTicket.user.name} ({selectedTicket.user.email})</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedTicket.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                  selectedTicket.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedTicket.status}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedTicket.replies?.map((reply: any, i: number) => (
                  <div key={i} className={`flex ${reply.user.role !== 'USER' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      reply.user.role !== 'USER' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-none'
                    }`}>
                      <p className="text-sm">{reply.message}</p>
                      <div className={`text-[10px] mt-2 opacity-70 ${reply.user.role !== 'USER' ? 'text-right' : 'text-left'}`}>
                        {reply.user.name} • {new Date(reply.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type your reply..." 
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>Select a ticket to view conversation</p>
            </div>
          )}
        </div>
      </div>

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
