"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, ArrowUpCircle, CheckCircle2, Clock, AlertCircle, Loader2, User, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Ticket {
  id: string;
  subject: string;
  message: string | null;
  status: string;
  category: string;
  createdAt: string;
  user: { name: string, email: string };
  replies: any[];
}

export default function SupportDeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [ticketsRes, permRes] = await Promise.all([
          fetch('/api/moderator/tickets'),
          fetch('/api/moderator/permissions')
        ]);
        const ticketsData = await ticketsRes.json();
        const permData = await permRes.json();
        
        if (ticketsData.tickets) setTickets(ticketsData.tickets);
        if (permData.permissions) setPermissions(permData.permissions.map((p: any) => p.permissionKey));
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const hasPerm = (perm: string) => permissions.includes(perm);

  const handleReply = async (action: 'REPLY' | 'ESCALATE') => {
    if (!reply.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/moderator/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket?.id,
          message: reply,
          escalate: action === 'ESCALATE',
          status: action === 'REPLY' ? 'IN_PROGRESS' : 'ESCALATED'
        })
      });
      
      if (res.ok) {
        setReply("");
        // Refresh tickets
        const updatedRes = await fetch('/api/moderator/tickets');
        const updatedData = await updatedRes.json();
        if (updatedData.tickets) {
          setTickets(updatedData.tickets);
          const updatedSelected = updatedData.tickets.find((t: Ticket) => t.id === selectedTicket?.id);
          setSelectedTicket(updatedSelected);
        }
      }
    } catch (err) {
      alert("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-50 text-blue-600';
      case 'IN_PROGRESS': return 'bg-orange-50 text-orange-600';
      case 'ESCALATED': return 'bg-purple-50 text-purple-600';
      case 'RESOLVED': return 'bg-emerald-50 text-emerald-600';
      case 'CLOSED': return 'bg-slate-50 text-slate-500';
      case 'HOLD': return 'bg-yellow-50 text-yellow-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex h-full">
        {/* Ticket List */}
        <div className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" /> Support Desk
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Active Tickets</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600 mb-2" />
                <p className="text-xs text-slate-400">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-20 px-6">
                <Clock className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No support tickets found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {tickets.map((ticket) => (
                  <button 
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-purple-50 border-r-4 border-purple-600' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-mono text-slate-400">{ticket.id.slice(-6)}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 truncate">{ticket.subject}</h3>
                    <p className="text-xs text-slate-500 mt-1 truncate">{ticket.user.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50">
          {selectedTicket ? (
            <>
              <div className="bg-white p-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedTicket.subject}</h2>
                    <p className="text-xs text-slate-500">
                      From: <span className="font-medium text-slate-700">{selectedTicket.user.name}</span> ({selectedTicket.user.email})
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusStyle(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Original Message */}
                <div className="flex gap-4">
                  <div className="h-8 w-8 bg-slate-100 rounded-full flex-shrink-0 flex items-center justify-center text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="max-w-[80%]">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block px-2">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Replies */}
                {selectedTicket.replies.map((reply: any) => (
                  <div key={reply.id} className={`flex gap-4 ${reply.user.role !== 'USER' ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center ${reply.user.role !== 'USER' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                      {reply.user.role !== 'USER' ? <UserCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className={`max-w-[80%] ${reply.user.role !== 'USER' ? 'text-right' : ''}`}>
                      <div className={`p-4 rounded-2xl shadow-sm border ${
                        reply.isInternal 
                          ? 'bg-purple-50 border-purple-100 text-purple-800 italic' 
                          : reply.user.role !== 'USER' 
                            ? 'bg-white border-purple-100 rounded-tr-none' 
                            : 'bg-white border-slate-100 rounded-tl-none'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block px-2">
                        {reply.user.name} • {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white border-t border-slate-200">
                <div className="relative">
                  <textarea 
                    placeholder="Type your response..."
                    className="w-full h-32 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 resize-none pb-12"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    {hasPerm('supportEscalateToAdmin') && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleReply('ESCALATE')}
                        disabled={isSending || !reply.trim()}
                        className="h-8 text-xs text-purple-600 hover:bg-purple-50"
                      >
                        <ArrowUpCircle className="h-4 w-4 mr-1" /> Escalate to Admin
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={() => handleReply('REPLY')}
                      disabled={isSending || !reply.trim()}
                      className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20"
                    >
                      <Send className="h-4 w-4 mr-1" /> Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4 animate-bounce">
                <MessageSquare className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Select a Ticket</h2>
              <p className="text-sm text-slate-500 max-w-xs mt-2">Choose a ticket from the list to view conversation and respond to user queries.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
