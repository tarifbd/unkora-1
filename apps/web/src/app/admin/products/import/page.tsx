'use client';

import { useState, useRef } from 'react';
import { Upload, Download, XCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export default function ProductImportPage() {
  const { token } = useAdminAuth();
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setCsvContent(e.target?.result as string ?? '');
    reader.readAsText(f);
  };

  const runImport = async () => {
    if (!csvContent) { toast.error('Please select a CSV file'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/products/import/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ csvContent, dryRun, updateExisting }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Import failed');
      setResult(data.data ?? data);
      toast.success(dryRun ? 'Dry run complete!' : `Import complete: ${(data.data ?? data).created ?? 0} created`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-green-600 flex items-center justify-center">
          <Upload className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Products</h1>
          <p className="text-sm text-gray-500">Bulk import products from CSV file</p>
        </div>
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Download CSV Template</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">Use this template as a starting point</p>
        </div>
        <a
          href={`${API}/products/import/template`}
          download="unkora-import-template.csv"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700"
        >
          <Download className="h-4 w-4" /> Download
        </a>
      </div>

      {/* File Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          {file
            ? <p className="font-semibold text-gray-900 dark:text-white">{file.name}</p>
            : <p className="text-gray-500">Drop CSV file here or click to browse</p>
          }
          <p className="text-xs text-gray-400 mt-1">Supports .csv files up to 10MB</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        <div className="flex items-center gap-6 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Dry run (preview only)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={updateExisting} onChange={e => setUpdateExisting(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Update existing SKUs</span>
          </label>
        </div>
      </div>

      <button
        onClick={runImport}
        disabled={!csvContent || loading}
        className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        {loading ? 'Processing...' : dryRun ? 'Run Dry Run' : 'Import Products'}
      </button>

      {result && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Import Results</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-2xl font-black text-green-600">{result.created}</div>
              <div className="text-xs text-gray-500">Created</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-2xl font-black text-blue-600">{result.updated}</div>
              <div className="text-xs text-gray-500">Updated</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="text-2xl font-black text-red-600">{result.failed}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {result.errors.map((err: string, i: number) => (
                <div key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                  <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  {err}
                </div>
              ))}
            </div>
          )}
          {dryRun && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              This was a dry run. Uncheck &quot;Dry run&quot; and re-run to actually import.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
