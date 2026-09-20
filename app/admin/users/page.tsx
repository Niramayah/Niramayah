'use client';

import { useEffect, useState } from 'react';
import { Search, Shield, CreditCard, Trash2, Loader2, ArrowLeft, Zap, X, Calendar, Info, User, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/components/auth/AuthContext';
import Link from 'next/link';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { Button } from '@/components/ui/button';

const MODERATOR_PERMISSIONS = [
  { key: 'aiTestAccess', label: 'AI Test Access' },
  { key: 'aiTrainingAccess', label: 'AI Training Access' },
  { key: 'aiQuestionManage', label: 'AI Question Manage' },
  { key: 'blogWrite', label: 'Blog Write' },
  { key: 'blogPublish', label: 'Blog Publish' },
  { key: 'newsWrite', label: 'News Write' },
  { key: 'newsPublish', label: 'News Publish' },
  { key: 'supportTicketHandle', label: 'Support Ticket Handle' },
  { key: 'contentManage', label: 'Content Manage' },
  { key: 'viewAuditLimited', label: 'View Audit Limited' }
];

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  credits: number;
  isUnlimitedCredits: boolean;
  createdAt: string;
  permissions?: { permissionKey: string; enabled: boolean }[];
  subscriptions?: { plan: { name: string } }[];
}

interface Plan {
  id: string;
  name: string;
  credits: number;
}

export default function UsersManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [assigningPlanUser, setAssigningPlanUser] = useState<UserData | null>(null);
  const [viewingDetailsUser, setViewingDetailsUser] = useState<UserData | null>(null);
  const [changingRoleUser, setChangingRoleUser] = useState<UserData | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [grantPlanCredits, setGrantPlanCredits] = useState(true);
  const [newRole, setNewRole] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [managingPermissionsUser, setManagingPermissionsUser] = useState<UserData | null>(null);
  const [currentPermissions, setCurrentPermissions] = useState<{ [key: string]: boolean }>({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    fetch(`/api/admin/users?q=${search}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setUsers(data.users);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to fetch users'))
      .finally(() => setLoading(false));
  };

  const fetchPlans = () => {
    fetch('/api/admin/billing/plans')
      .then(res => res.json())
      .then(data => {
        if (data.plans) setPlans(data.plans);
      })
      .catch(err => console.error('Failed to fetch plans', err));
  };

  useEffect(() => {
    fetchPlans();
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    setExpiryDate(defaultExpiry.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRoleUpdate = async () => {
    if (!changingRoleUser || !newRole) return;
    
    setIsUpdatingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${changingRoleUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      alert(`Role updated successfully for ${changingRoleUser.name}`);
      setChangingRoleUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleCreditAdjustment = async (userId: string) => {
    const amount = prompt('Enter new credit balance:');
    if (amount === null) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: parseInt(amount) })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else fetchUsers();
    } catch (err) {
      alert('Failed to update credits');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) alert(data.error);
      else fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const fetchPermissions = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/permissions`);
      const data = await res.json();
      if (data.success && data.permissions) {
        // data.permissions is now an object { aiTestAccess: true, ... }
        setCurrentPermissions(data.permissions);
      }
    } catch (err) {
      console.error('Failed to fetch permissions', err);
    }
  };

  const handlePermissionSave = async () => {
    if (!managingPermissionsUser) return;
    setIsSavingPermissions(true);
    
    try {
      const permissions = Object.entries(currentPermissions).map(([key, enabled]) => ({ key, enabled }));
      
      const res = await fetch(`/api/admin/users/${managingPermissionsUser.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('API returned non-JSON response:', text);
        throw new Error('API returned invalid response format.');
      }

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update permissions');
      }
      
      alert(data.message || 'Permissions updated successfully');
      setManagingPermissionsUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Permission save failed:', err);
      alert(err.message || 'Failed to update permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!assigningPlanUser || !selectedPlanId) return;
    
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/admin/users/${assigningPlanUser.id}/assign-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: selectedPlanId,
          isFree: true,
          endDate: expiryDate,
          grantCredits: grantPlanCredits
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      alert(data.message || `Plan assigned successfully to ${assigningPlanUser.name}`);
      setAssigningPlanUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to assign plan');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-2">Manage accounts, roles, and platform permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name or email..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 w-full md:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">User</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Credits</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Joined</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{user.name}</span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'MODERATOR' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <CoinIcon />
                          <span>{user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.isUnlimitedCredits ? '∞' : user.credits}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Protection Logic: ONLY SUPER_ADMIN is protected */}
                          {user.role === 'SUPER_ADMIN' ? (
                            <div className="flex items-center gap-2">
                               <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider border border-slate-200">
                                 Protected
                               </span>
                               {user.id === currentUser?.id && (
                                 <span className="text-[10px] text-blue-500 font-bold uppercase">(You)</span>
                               )}
                            </div>
                          ) : (
                            <>
                              {user.id === currentUser?.id && (
                                <span className="text-[10px] text-blue-500 font-bold uppercase mr-2">(You)</span>
                              )}
                              
                              <button 
                                onClick={() => setViewingDetailsUser(user)}
                                className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                                title="View Details"
                              >
                                <Info className="h-4 w-4" />
                              </button>

                              {/* ROLE SPECIFIC ACTIONS */}
                              {user.role === 'USER' && (
                                <>
                                  <button 
                                    onClick={() => handleCreditAdjustment(user.id)}
                                    className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-emerald-500 transition-all"
                                    title="Manage Credits"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => setAssigningPlanUser(user)}
                                    className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-500 transition-all"
                                    title="Assign Plan"
                                  >
                                    <Zap className="h-4 w-4" />
                                  </button>
                                </>
                              )}

                              {user.role === 'MODERATOR' && (
                                <button 
                                  onClick={() => {
                                    setManagingPermissionsUser(user);
                                    fetchPermissions(user.id);
                                  }}
                                  className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-purple-500 transition-all"
                                  title="Manage Permissions"
                                >
                                  <Shield className="h-4 w-4" />
                                </button>
                              )}

                              {/* ROLE CHANGE PROTECTION: ADMIN CANNOT MODIFY ADMIN */}
                              {!(currentUser?.role === 'ADMIN' && user.role === 'ADMIN') && (
                                <button 
                                  onClick={() => {
                                    setChangingRoleUser(user);
                                    setNewRole(user.role);
                                  }}
                                  className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-orange-500 transition-all"
                                  title="Change Role"
                                >
                                  <User className="h-4 w-4" />
                                </button>
                              )}

                              {/* DELETE PROTECTION */}
                              {!(currentUser?.role === 'ADMIN' && user.role === 'ADMIN') && (
                                <button 
                                  onClick={() => handleDelete(user.id)}
                                  className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-500 transition-all"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* User Details Modal */}
      {viewingDetailsUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-0 animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 text-slate-600 rounded-lg">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">User Details</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Full profile for {viewingDetailsUser.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingDetailsUser(null)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-medium">{viewingDetailsUser.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Credits</p>
                  <div className="flex items-center gap-2">
                    <CoinIcon />
                    <span className="text-sm font-bold">{viewingDetailsUser.isUnlimitedCredits ? 'Unlimited' : viewingDetailsUser.credits}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Role</p>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">
                    {viewingDetailsUser.role}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joined On</p>
                  <p className="text-sm">{new Date(viewingDetailsUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Current Subscription</p>
                {viewingDetailsUser.subscriptions && viewingDetailsUser.subscriptions.length > 0 ? (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm font-bold text-blue-700">{viewingDetailsUser.subscriptions[0].plan.name}</p>
                    <p className="text-[10px] text-blue-600/70 uppercase font-bold mt-1 tracking-wider">Active Plan</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No active subscription found.</p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Special Permissions</p>
                {viewingDetailsUser.permissions && viewingDetailsUser.permissions.filter(p => p.enabled).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingDetailsUser.permissions.filter(p => p.enabled).map(p => (
                      <span key={p.permissionKey} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> {p.permissionKey}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No special permissions granted.</p>
                )}
              </div>

              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setViewingDetailsUser(null)}
                >
                  Close Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Plan Modal */}
      {assigningPlanUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl border-0 animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Assign Plan</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Free plan assignment for <b>{assigningPlanUser.name}</b></p>
                  </div>
                </div>
                <button 
                  onClick={() => setAssigningPlanUser(null)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Subscription Plan</label>
                  <select 
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                  >
                    <option value="">-- Choose a Plan --</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.credits} Credits)</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Expiry Date
                  </label>
                  <input 
                    type="date"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400">Default: 30 days from today</p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setGrantPlanCredits(!grantPlanCredits)}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${grantPlanCredits ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                    {grantPlanCredits && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700">Grant plan credits now</p>
                    <p className="text-[10px] text-slate-500">Add the plan's default credits to user's balance immediately.</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                   <div className="flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-xs font-semibold text-emerald-700">Free Access Mode Active</span>
                   </div>
                   <p className="text-[10px] text-emerald-600/70 mt-1 ml-5">
                     Price will be set to 0. Credits will be added once.
                   </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setAssigningPlanUser(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!selectedPlanId || isAssigning}
                  onClick={handleAssignPlan}
                >
                  {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign Plan Free'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Role Modal */}
      {changingRoleUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl border-0 animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Update User Role</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Modify account privileges for <b>{changingRoleUser.name}</b></p>
                  </div>
                </div>
                <button 
                  onClick={() => setChangingRoleUser(null)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Name</label>
                      <p className="text-sm font-medium">{changingRoleUser.name}</p>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                      <p className="text-sm font-medium truncate">{changingRoleUser.email}</p>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Role</label>
                  <div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      changingRoleUser.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      changingRoleUser.role === 'ADMIN' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      changingRoleUser.role === 'MODERATOR' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {changingRoleUser.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Role</label>
                  <select 
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="USER">USER - Standard customer access</option>
                    <option value="MODERATOR">MODERATOR - Staff with partial tools</option>
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <option value="ADMIN">ADMIN - Full platform management</option>
                    )}
                  </select>
                </div>

                {currentUser?.role !== 'SUPER_ADMIN' && newRole === 'ADMIN' && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3 items-start">
                    <Info className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-red-600 font-medium">
                      Forbidden: Only Super Admins can promote users to ADMIN role.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setChangingRoleUser(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={isUpdatingRole || newRole === changingRoleUser.role}
                  onClick={handleRoleUpdate}
                >
                  {isUpdatingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Role'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Moderator Permissions Modal */}
      {managingPermissionsUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-0 animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Moderator Permissions</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Configure access for <b>{managingPermissionsUser.name}</b></p>
                  </div>
                </div>
                <button onClick={() => setManagingPermissionsUser(null)} className="p-1 hover:bg-slate-200 rounded-full">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {MODERATOR_PERMISSIONS.map(permission => (
                  <label key={permission.key} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all group">
                    <div 
                      onClick={() => setCurrentPermissions(prev => ({ ...prev, [permission.key]: !prev[permission.key] }))}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${currentPermissions[permission.key] ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-300'}`}
                    >
                      {currentPermissions[permission.key] && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                      {permission.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setManagingPermissionsUser(null)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handlePermissionSave} disabled={isSavingPermissions}>
                  {isSavingPermissions ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Permissions'}
                </Button>
              </div>
            </CardContent>
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
