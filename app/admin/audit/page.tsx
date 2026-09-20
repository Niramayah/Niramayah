'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Search, Loader2, ArrowLeft, Filter } from "lucide-react";
import Link from 'next/link';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchLogs = () => {
    setLoading(true);
    fetch(`/api/admin/audit?limit=${limit}&offset=${offset}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setLogs(data.logs);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [offset]);

  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('BLOCKED')) return 'text-red-600 bg-red-50';
    if (action.includes('CHANGE') || action.includes('ADJUSTMENT')) return 'text-orange-600 bg-orange-50';
    if (action.includes('SUCCESS') || action.includes('CREATE')) return 'text-emerald-600 bg-emerald-50';
    return 'text-blue-600 bg-blue-50';
  };

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
        Error loading audit logs: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">System Audit Logs</h1>
          <p className="text-slate-500 mt-2">Track all administrative actions and security events.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Timestamp</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">User</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Action</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{log.user?.name || 'System'}</span>
                          <span className="text-xs text-slate-500">{log.user?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-md">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Link 
          href="/admin" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="flex gap-2">
          <button 
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Previous
          </button>
          <button 
            disabled={logs.length < limit}
            onClick={() => setOffset(offset + limit)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
