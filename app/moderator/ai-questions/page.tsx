"use client";

import { useState, useEffect } from "react";
import { HelpCircle, Plus, Edit2, Trash2, Loader2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  step: number;
  section: string;
  questionText: string;
  type: string;
  options: any;
  dependsOn: string | null;
  dependencyValue: string | null;
  weight: number;
}

export default function AiQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Question>>({
    step: 1,
    section: 'Basic Profile',
    questionText: '',
    type: 'select',
    weight: 0
  });

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/moderator/ai-questions');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status}. ${text.includes('<!DOCTYPE') ? 'Received HTML instead of JSON.' : text}`);
      }
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
    } catch (err: any) {
      console.error("Failed to fetch questions", err);
      // Optional: alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSave = async (id: string | null) => {
    const isNew = id === null;
    const url = isNew ? '/api/moderator/ai-questions' : `/api/moderator/ai-questions/${id}`;
    const method = isNew ? 'POST' : 'PATCH';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.includes('<!DOCTYPE') ? 'API route not found or server error (HTML returned)' : text);
      }
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Refresh list from server to ensure accuracy
      await fetchQuestions();
      
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ step: 1, section: 'Basic Profile', questionText: '', type: 'select', weight: 0 });
    } catch (err: any) {
      alert(err.message || "Failed to save question");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/moderator/ai-questions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.includes('<!DOCTYPE') ? 'API route not found' : text);
      }
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete question");
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setFormData(q);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">AI Questions</h1>
            <p className="text-slate-500">Configure diagnostic assessment logic and questions</p>
          </div>
        </div>
        <Button onClick={() => {
          setFormData({ step: 1, section: 'Basic Profile', questionText: '', type: 'select', weight: 0 });
          setShowAddModal(true);
        }} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 h-11 shadow-lg">
          <Plus className="h-4 w-4 mr-2" /> Add Question
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <p className="text-slate-500 font-medium">Loading questions...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {[1, 2, 3, 4, 5, 6].map(step => {
              const stepQuestions = questions.filter(q => q.step === step);
              if (stepQuestions.length === 0) return null;
              return (
                <div key={step} className="space-y-4">
                  <div className="flex items-center gap-4 px-2">
                    <div className="h-px flex-1 bg-slate-100"></div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Step {step} Assessment</h3>
                    <div className="h-px flex-1 bg-slate-100"></div>
                  </div>
                  <div className="grid gap-3">
                    {stepQuestions.map((q) => (
                      <Card key={q.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white group">
                        <div className="flex items-center justify-between p-4 md:p-5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                {q.section}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                {q.type}
                              </span>
                              {q.weight > 0 && (
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                  Risk Weight: {q.weight}
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-slate-800 leading-tight group-hover:text-purple-700 transition-colors">{q.questionText}</h4>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => startEdit(q)} 
                              className="h-9 w-9 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(q.id)} 
                              className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingId) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-lg border-0 shadow-2xl scale-in-center overflow-hidden">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-serif">{editingId ? 'Edit Question' : 'Add New Question'}</CardTitle>
                <CardDescription>Configure diagnostic logic for cardiac screening.</CardDescription>
              </div>
              <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </CardHeader>
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Assessment Step</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    value={formData.step}
                    onChange={e => setFormData({...formData, step: parseInt(e.target.value)})}
                  >
                    {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Step {s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Section Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    value={formData.section}
                    onChange={e => setFormData({...formData, section: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Question Text</label>
                <textarea 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none h-24"
                  value={formData.questionText}
                  onChange={e => setFormData({...formData, questionText: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Input Type</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="select">Select / Boolean</option>
                    <option value="number">Numeric Input</option>
                    <option value="text">Free Text</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Risk Weighting (0-10)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => { setShowAddModal(false); setEditingId(null); }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleSave(editingId)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-all"
              >
                {editingId ? "Update Question" : "Create Question"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
