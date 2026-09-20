"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Plus, Search, Filter, Clock, CheckCircle2, AlertTriangle, Loader2, ChevronRight, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  createdAt: string;
}

interface Reply {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newTicket, setNewTicket] = useState({ subject: "", message: "", category: "OTHER" });
  const [replyMessage, setReplyMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (res.ok) setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      const data = await res.json();
      if (res.ok) setSelectedTicket(data.ticket);
    } catch (err) {
      console.error("Failed to fetch ticket details:", err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });
      if (res.ok) {
        toast({ title: "Ticket Created", description: "We will get back to you soon." });
        setShowCreate(false);
        setNewTicket({ subject: "", message: "", category: "OTHER" });
        fetchTickets();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage })
      });
      if (res.ok) {
        setReplyMessage("");
        fetchTicketDetails(selectedTicket.id);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-tighter">Open</span>;
      case 'IN_PROGRESS': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase tracking-tighter">In Progress</span>;
      case 'RESOLVED': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-tighter">Resolved</span>;
      case 'CLOSED': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-tighter">Closed</span>;
      case 'ESCALATED': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-tighter">Escalated</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-niramayah-green mb-4" />
        <p className="text-niramayah-gray">Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-niramayah-navy">Support Center</h1>
          <p className="text-niramayah-gray mt-1">Need help? Create a ticket and our team will assist you.</p>
        </div>
        <Button 
          className="bg-niramayah-green hover:bg-niramayah-green/90 text-white"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Ticket
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search tickets..." className="pl-9 bg-gray-50/50" />
              </div>
            </CardHeader>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No tickets found.
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'bg-niramayah-green/5 border-l-4 border-l-niramayah-green' : ''}`}
                    onClick={() => fetchTicketDetails(ticket.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      {getStatusBadge(ticket.status)}
                      <span className="text-[10px] text-gray-400 font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-semibold text-niramayah-navy truncate">{ticket.subject}</h3>
                    <p className="text-xs text-gray-500 truncate mt-1">{ticket.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Ticket Detail / Conversation */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="flex flex-col h-full shadow-lg border-niramayah-navy/5">
              <CardHeader className="border-b bg-gray-50/30">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-niramayah-green bg-niramayah-green/10 px-2 py-0.5 rounded">#{selectedTicket.id.slice(-6).toUpperCase()}</span>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <CardTitle className="text-xl text-niramayah-navy">{selectedTicket.subject}</CardTitle>
                    <CardDescription className="mt-1">Category: <span className="font-medium text-niramayah-navy">{selectedTicket.category}</span></CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                  {/* Original Message */}
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-niramayah-navy flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {selectedTicket.user.name[0]}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-niramayah-navy">{selectedTicket.user.name}</span>
                        <span className="text-[10px] text-gray-400">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none text-sm text-niramayah-navy/90 leading-relaxed shadow-sm">
                        {selectedTicket.message}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {selectedTicket.replies?.map((reply: any) => (
                    <div key={reply.id} className={`flex gap-4 ${reply.user.role !== 'USER' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${reply.user.role !== 'USER' ? 'bg-niramayah-green shadow-md shadow-niramayah-green/20' : 'bg-niramayah-navy'}`}>
                        {reply.user.name[0]}
                      </div>
                      <div className={`flex-1 space-y-1 ${reply.user.role !== 'USER' ? 'text-right' : ''}`}>
                        <div className={`flex items-center gap-2 ${reply.user.role !== 'USER' ? 'flex-row-reverse' : ''}`}>
                          <span className="font-bold text-sm text-niramayah-navy">{reply.user.name} {reply.user.role !== 'USER' && <span className="text-[10px] bg-niramayah-green/10 text-niramayah-green px-1.5 py-0.5 rounded ml-1">Staff</span>}</span>
                          <span className="text-[10px] text-gray-400">{new Date(reply.createdAt).toLocaleString()}</span>
                        </div>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${reply.user.role !== 'USER' ? 'bg-niramayah-green text-white rounded-tr-none' : 'bg-gray-50 text-niramayah-navy/90 rounded-tl-none'}`}>
                          {reply.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t bg-gray-50/50">
                  {selectedTicket.status === 'CLOSED' ? (
                    <div className="bg-gray-100 p-4 rounded-lg text-center text-sm text-gray-500 font-medium border border-gray-200">
                      This ticket is closed. You can no longer reply.
                    </div>
                  ) : (
                    <form onSubmit={handleReply} className="flex gap-2">
                      <Input 
                        placeholder="Type your message..." 
                        value={replyMessage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplyMessage(e.target.value)}
                        disabled={actionLoading}
                        className="bg-white"
                      />
                      <Button 
                        type="submit" 
                        className="bg-niramayah-navy hover:bg-niramayah-navy/90 text-white shadow-md transition-all active:scale-95"
                        disabled={actionLoading || !replyMessage.trim()}
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center bg-gray-50/30 rounded-xl border border-dashed border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner mb-6">
                <MessageSquare className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-serif font-bold text-niramayah-navy mb-2">Select a Ticket</h3>
              <p className="text-niramayah-gray max-w-sm">Choose a ticket from the list to view the conversation or create a new one to get help.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <CardHeader className="border-b">
              <CardTitle className="font-serif text-niramayah-navy">Create New Support Ticket</CardTitle>
              <CardDescription>Describe your issue and we'll get back to you within 24 hours.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateTicket}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-niramayah-navy">Subject</label>
                  <Input 
                    placeholder="Brief summary of the issue" 
                    value={newTicket.subject}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTicket({...newTicket, subject: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-niramayah-navy">Category</label>
                  <select 
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-niramayah-green"
                    value={newTicket.category}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTicket({...newTicket, category: e.target.value})}
                  >
                    <option value="OTHER">Other</option>
                    <option value="BILLING">Billing & Payments</option>
                    <option value="DIAGNOSIS">AI Diagnosis Help</option>
                    <option value="ACCOUNT">Account Access</option>
                    <option value="TECHNICAL">Technical Issue</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-niramayah-navy">Message</label>
                  <textarea 
                    className="w-full h-32 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-niramayah-green"
                    placeholder="Provide details about your problem..."
                    value={newTicket.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTicket({...newTicket, message: e.target.value})}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t pt-4">
                <Button variant="ghost" type="button" onClick={() => setShowCreate(false)} disabled={actionLoading}>Cancel</Button>
                <Button className="bg-niramayah-green hover:bg-niramayah-green/90 text-white px-8" type="submit" disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Ticket"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
