'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Settings, Database, Plus, Save, Loader2, ArrowLeft, Trash2, Edit, X, CheckCircle2, AlertCircle } from "lucide-react";
import Link from 'next/link';

interface AiQuestion {
  id: string;
  step: number;
  section: string;
  questionText: string;
  type: string;
  options: string[] | null;
  weight: number;
  dependsOn?: string | null;
  dependencyValue?: string | null;
}

interface AiDataset {
  id: string;
  name: string;
  dataUrl: string;
  uploadedAt: string;
}

interface AiSetting {
  key: string;
  value: string;
}

export default function AiManagement() {
  const [questions, setQuestions] = useState<AiQuestion[]>([]);
  const [datasets, setDatasets] = useState<AiDataset[]>([]);
  const [provider, setProvider] = useState('Ollama (Llama 3)');
  const [threshold, setThreshold] = useState(70);
  
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Modals
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AiQuestion | null>(null);

  // Form States
  const [questionForm, setQuestionForm] = useState({
    step: 1,
    section: 'Vitals',
    questionText: '',
    type: 'boolean',
    options: '',
    weight: 10,
    dependsOn: '',
    dependencyValue: ''
  });

  const [datasetForm, setDatasetForm] = useState<{
    name: string;
    uploadMethod: 'URL' | 'CSV';
    dataUrl: string;
    file: File | null;
  }>({
    name: '',
    uploadMethod: 'URL',
    dataUrl: '',
    file: null
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, dRes, sRes] = await Promise.all([
        fetch('/api/admin/ai/questions'),
        fetch('/api/admin/ai/datasets'),
        fetch('/api/admin/ai/settings')
      ]);

      const qData = await qRes.json();
      const dData = await dRes.json();
      const sData = await sRes.json();

      if (qData.questions) setQuestions(qData.questions);
      if (dData.datasets) setDatasets(dData.datasets);
      
      if (sData.settings) {
        const settings = sData.settings as AiSetting[];
        const p = settings.find(s => s.key === 'ai_provider')?.value;
        const t = settings.find(s => s.key === 'ai_confidence_threshold')?.value;
        if (p) setProvider(p);
        if (t) setThreshold(parseInt(t));
      }
    } catch (err) {
      console.error('Failed to fetch AI data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, threshold })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessage({ type: 'success', text: 'AI configuration saved successfully' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const url = editingQuestion ? `/api/admin/ai/questions/${editingQuestion.id}` : '/api/admin/ai/questions';
      const method = editingQuestion ? 'PUT' : 'POST';
      
      // Parse options if it's a select
      const payload = {
        ...questionForm,
        step: parseInt(questionForm.step.toString()),
        weight: parseInt(questionForm.weight.toString()),
        options: questionForm.type === 'select' ? questionForm.options.split(',').map(o => o.trim()) : null
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessage({ type: 'success', text: `Question ${editingQuestion ? 'updated' : 'added'} successfully` });
      setShowQuestionModal(false);
      setEditingQuestion(null);
      setQuestionForm({ step: 1, section: 'Vitals', questionText: '', type: 'boolean', options: '', weight: 10, dependsOn: '', dependencyValue: '' });
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit question';
      alert(errorMessage);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/ai/questions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete question';
      alert(errorMessage);
    }
  };

  const handleDatasetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('name', datasetForm.name);
      formData.append('uploadMethod', datasetForm.uploadMethod);
      if (datasetForm.uploadMethod === 'URL') {
        formData.append('dataUrl', datasetForm.dataUrl);
      } else if (datasetForm.file) {
        formData.append('file', datasetForm.file);
      } else {
        throw new Error('Please select a CSV file to upload');
      }

      const res = await fetch('/api/admin/ai/datasets/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setMessage({ type: 'success', text: 'Dataset uploaded successfully' });
      setShowDatasetModal(false);
      setDatasetForm({ name: '', uploadMethod: 'URL', dataUrl: '', file: null });
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload dataset';
      alert(errorMessage);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">AI & Diagnosis Engine</h1>
          <p className="text-slate-500 mt-2">Manage the underlying logic, questions, and training modules.</p>
        </div>
        <button 
          onClick={() => {
            setEditingQuestion(null);
            setShowQuestionModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Question
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions Table */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
            <CardTitle className="text-xl font-serif">Assessment Questions</CardTitle>
            <span className="text-xs text-slate-400 font-sans uppercase font-bold tracking-wider">{questions.length} Total</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Step</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Question</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
                      </td>
                    </tr>
                  ) : questions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                        No questions configured yet. Click "Add Question" to start.
                      </td>
                    </tr>
                  ) : (
                    questions.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-400">Step {q.step}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{q.questionText}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{q.section}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                            {q.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingQuestion(q);
                                setQuestionForm({
                                  step: q.step,
                                  section: q.section,
                                  questionText: q.questionText,
                                  type: q.type,
                                  options: Array.isArray(q.options) ? q.options.join(', ') : '',
                                  weight: q.weight,
                                  dependsOn: q.dependsOn || '',
                                  dependencyValue: q.dependencyValue || ''
                                });
                                setShowQuestionModal(true);
                              }}
                              className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-500 transition-all"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Engine Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">AI Provider</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  <option value="ollama">Ollama (Local Llama 3)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="gemini">Google (Gemini 1.5 Pro)</option>
                  <option value="mock">Mock Service (Local Development)</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase">Confidence Threshold</label>
                  <span className="text-xs font-bold text-blue-600">{threshold}%</span>
                </div>
                <input 
                  type="range" 
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                  min="0" 
                  max="100" 
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Fast/Risky (0%)</span>
                  <span>Strict/Safe (100%)</span>
                </div>
              </div>
              <button 
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
              >
                {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Config
              </button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-serif">Training Datasets</CardTitle>
              <Database className="h-4 w-4 text-slate-300" />
            </CardHeader>
            <CardContent className="space-y-4">
               {datasets.length === 0 ? (
                 <div className="text-center py-4 text-xs text-slate-400 italic">No datasets uploaded</div>
               ) : (
                 datasets.map(ds => (
                   <div key={ds.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                       <Database className="h-4 w-4 text-blue-600" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-slate-900">{ds.name}</p>
                       <p className="text-[10px] text-slate-400">{new Date(ds.uploadedAt).toLocaleDateString()}</p>
                     </div>
                   </div>
                 ))
               )}
               <button 
                onClick={() => setShowDatasetModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
               >
                <Plus className="h-4 w-4" />
                Upload New
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg border-0 shadow-2xl">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-serif">{editingQuestion ? 'Edit Question' : 'Add New Question'}</CardTitle>
              <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleQuestionSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Step Number</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      value={questionForm.step}
                      onChange={e => setQuestionForm({ ...questionForm, step: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Section</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Vitals"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      value={questionForm.section}
                      onChange={e => setQuestionForm({ ...questionForm, section: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Question Text</label>
                  <textarea 
                    required
                    placeholder="e.g. Do you experience chest pain?"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[80px]"
                    value={questionForm.questionText}
                    onChange={e => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Input Type</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      value={questionForm.type}
                      onChange={e => setQuestionForm({ ...questionForm, type: e.target.value })}
                    >
                      <option value="boolean">Boolean (Yes/No)</option>
                      <option value="number">Number Input</option>
                      <option value="select">Select Options</option>
                      <option value="text">Free Text</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Weight (Impact)</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      value={questionForm.weight}
                      onChange={e => setQuestionForm({ ...questionForm, weight: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                {questionForm.type === 'select' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Options (Comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="Option 1, Option 2, Option 3"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      value={questionForm.options}
                      onChange={e => setQuestionForm({ ...questionForm, options: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                   <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Depends On (Question ID)</label>
                    <input 
                      type="text" 
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      value={questionForm.dependsOn}
                      onChange={e => setQuestionForm({ ...questionForm, dependsOn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Value to Trigger</label>
                    <input 
                      type="text" 
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      value={questionForm.dependencyValue}
                      onChange={e => setQuestionForm({ ...questionForm, dependencyValue: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Dataset Modal */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-[600px] border-0 shadow-2xl">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-serif">Upload Training Data</CardTitle>
              <button onClick={() => setShowDatasetModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleDatasetSubmit}>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dataset Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Patient Clinical Study 2024"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={datasetForm.name}
                    onChange={e => setDatasetForm({ ...datasetForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload Method</label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDatasetForm({...datasetForm, uploadMethod: 'URL'})}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${datasetForm.uploadMethod === 'URL' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      DATA URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setDatasetForm({...datasetForm, uploadMethod: 'CSV'})}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${datasetForm.uploadMethod === 'CSV' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      CSV UPLOAD
                    </button>
                  </div>
                </div>

                {datasetForm.uploadMethod === 'URL' ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cloud Path / Data URL</label>
                    <input 
                      type="text" 
                      required
                      placeholder="https://s3.amazonaws.com/datasets/..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={datasetForm.dataUrl}
                      onChange={e => setDatasetForm({ ...datasetForm, dataUrl: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400">Direct links to AWS S3, Google Cloud Storage, or public URLs.</p>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CSV File Upload</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept=".csv"
                        required={datasetForm.uploadMethod === 'CSV'}
                        className="w-full px-4 py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 file:hidden cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all text-center"
                        onChange={e => setDatasetForm({ ...datasetForm, file: e.target.files?.[0] || null })}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <Database className="h-8 w-8 text-slate-300 mb-2" />
                        <span className="font-medium text-slate-500">
                          {datasetForm.file ? datasetForm.file.name : 'Drop CSV file here or click to browse'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">Maximum size: 10MB</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-8 pt-0 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowDatasetModal(false)}
                  className="flex-1 h-12 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-12 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold shadow-lg active:scale-95"
                >
                  Start Upload
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
