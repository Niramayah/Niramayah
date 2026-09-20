"use client";

import { useState, useEffect } from "react";
import { Database, Upload, Link as LinkIcon, FileText, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Dataset {
  id: string;
  name: string;
  dataUrl: string;
  sourceType: string;
  uploadedAt: string;
  uploadedBy?: { name: string };
}

export default function AiTrainingPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'URL' | 'FILE'>('URL');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDataset, setNewDataset] = useState({ name: '', dataUrl: '' });

  const fetchDatasets = async () => {
    try {
      const res = await fetch('/api/moderator/ai-training');
      const data = await res.json();
      if (data.datasets) setDatasets(data.datasets);
    } catch (err) {
      console.error("Failed to fetch datasets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let res;
      if (uploadMode === 'FILE') {
        if (!selectedFile) throw new Error("Please select a CSV file");
        if (!selectedFile.name.endsWith('.csv')) throw new Error("Only .csv files are allowed");
        
        const formData = new FormData();
        formData.append('name', newDataset.name);
        formData.append('file', selectedFile);
        
        res = await fetch('/api/moderator/ai-training', {
          method: 'POST',
          body: formData
        });
      } else {
        res = await fetch('/api/moderator/ai-training', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDataset)
        });
      }
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setDatasets([data.dataset, ...datasets]);
      setShowUploadModal(false);
      setNewDataset({ name: '', dataUrl: '' });
      setSelectedFile(null);
    } catch (err: any) {
      alert(err.message || "Failed to upload dataset");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this dataset?")) return;
    try {
      const res = await fetch(`/api/moderator/ai-training?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDatasets(datasets.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete dataset", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">AI Training Lab</h1>
            <p className="text-slate-500">Manage and upload datasets for cardiac AI models</p>
          </div>
        </div>
        <Button onClick={() => {
          setShowUploadModal(true);
          setUploadMode('URL');
          setSelectedFile(null);
        }} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 h-11 shadow-lg">
          <Plus className="h-4 w-4 mr-2" /> Upload Dataset
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <p className="text-slate-500 font-medium">Loading datasets...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Datasets Found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">Start by uploading a CSV or providing a data URL for AI training.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {datasets.map((dataset) => (
              <Card key={dataset.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{dataset.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${dataset.sourceType === 'FILE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {dataset.sourceType === 'FILE' ? 'Local File' : 'External URL'}
                        </span>
                        <span className="text-[10px] text-slate-400">By {dataset.uploadedBy?.name || 'Staff'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs text-slate-500 mb-4">
                    <LinkIcon className="h-3 w-3" />
                    <span className="truncate">{dataset.dataUrl}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      {new Date(dataset.uploadedAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200" asChild>
                        <a href={dataset.dataUrl} target="_blank" rel="noopener noreferrer">View Data</a>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(dataset.id)}
                        className="h-8 w-8 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-0 shadow-2xl scale-in-center overflow-hidden">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-serif">Upload Dataset</CardTitle>
                <CardDescription>Add new training data to the system.</CardDescription>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </CardHeader>
            
            <div className="flex border-b border-slate-100">
              <button 
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${uploadMode === 'URL' ? 'text-purple-600 bg-purple-50/50 border-b-2 border-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setUploadMode('URL')}
              >
                URL Link
              </button>
              <button 
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${uploadMode === 'FILE' ? 'text-purple-600 bg-purple-50/50 border-b-2 border-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setUploadMode('FILE')}
              >
                CSV File
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Dataset Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Heart Disease Dataset v1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                    value={newDataset.name}
                    onChange={e => setNewDataset({...newDataset, name: e.target.value})}
                  />
                </div>

                {uploadMode === 'URL' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Data URL (JSON/CSV)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input 
                        type="url" 
                        required
                        placeholder="https://example.com/data.csv"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                        value={newDataset.dataUrl}
                        onChange={e => setNewDataset({...newDataset, dataUrl: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">CSV File</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".csv"
                        required
                        className="hidden"
                        id="csv-upload"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <label 
                        htmlFor="csv-upload"
                        className="flex flex-col items-center justify-center w-full h-32 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-purple-300 transition-all group"
                      >
                        {selectedFile ? (
                          <div className="text-center">
                            <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{selectedFile.name}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2 group-hover:text-purple-400" />
                            <p className="text-xs font-medium text-slate-500">Click to select CSV file</p>
                            <p className="text-[10px] text-slate-400 mt-1">Only .csv files supported</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-6 pt-0 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 rounded-xl h-11"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUploading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 shadow-lg transition-all"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Upload"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
