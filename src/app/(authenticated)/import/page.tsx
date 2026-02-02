'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { ImportPreview } from '@/components/ImportPreview';
import { parseExcelFile, type ParsedExcelData } from '@/lib/excel-parser';
import type { ImportPreviewResponse, ImportState, ImportApplyResponse } from '@/types/import';

export default function ImportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<ImportState>({ step: 'upload' });
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast('error', 'Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setState({ step: 'parsing', fileName: file.name });

    try {
      // Parse Excel file client-side
      const buffer = await file.arrayBuffer();
      const parsed: ParsedExcelData = parseExcelFile(buffer);
      
      // Send to preview API
      const response = await fetch('/api/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inboundShipments: parsed.inboundShipments,
          granulations: parsed.granulations,
          metalRemovals: parsed.metalRemovals,
          polymerPurifications: parsed.polymerPurifications,
          extrusions: parsed.extrusions,
          transfers: parsed.transfers,
          manufacturing: parsed.manufacturing,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          showToast('error', 'Your session has expired. Please log in again.');
          router.push('/login');
          return;
        }
        throw new Error('Failed to generate preview');
      }

      const preview: ImportPreviewResponse = await response.json();
      setState({ step: 'previewing', fileName: file.name, preview });

    } catch (error) {
      console.error('Import error:', error);
      setState({ 
        step: 'error', 
        fileName: file.name,
        error: error instanceof Error ? error.message : 'Failed to parse Excel file'
      });
    }
  }, [showToast, router]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Handle selection changes from preview
  const handleSelectionChange = (preview: ImportPreviewResponse) => {
    setState(prev => ({ ...prev, preview }));
  };

  // Handle apply
  const handleApply = async () => {
    if (!state.preview) return;

    setState(prev => ({ ...prev, step: 'applying' }));

    try {
      const response = await fetch('/api/import/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creates: state.preview.creates.filter(c => c.selected).map(c => c.id),
          events: state.preview.events.filter(e => e.selected).map(e => e.id),
          updates: state.preview.updates.filter(u => u.selected).map(u => u.id),
          previewData: state.preview,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          showToast('error', 'Your session has expired. Please log in again.');
          router.push('/login');
          return;
        }
        throw new Error('Failed to apply changes');
      }

      const result: ImportApplyResponse = await response.json();
      
      if (result.success) {
        setState(prev => ({ ...prev, step: 'complete', result }));
        showToast('success', 'Import completed successfully');
      } else {
        setState(prev => ({ 
          ...prev, 
          step: 'error', 
          error: 'Some changes could not be applied'
        }));
      }
    } catch (error) {
      console.error('Apply error:', error);
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        error: error instanceof Error ? error.message : 'Failed to apply changes'
      }));
    }
  };

  // Reset to start over
  const handleReset = () => {
    setState({ step: 'upload' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Calculate selected counts
  const selectedCounts = state.preview ? {
    creates: state.preview.creates.filter(c => c.selected).length,
    events: state.preview.events.filter(e => e.selected).length,
    updates: state.preview.updates.filter(u => u.selected).length,
    total: 
      state.preview.creates.filter(c => c.selected).length +
      state.preview.events.filter(e => e.selected).length +
      state.preview.updates.filter(u => u.selected).length,
  } : { creates: 0, events: 0, updates: 0, total: 0 };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to campaigns
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Import from Excel
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Upload the LEGO REPLAY inventory tracker to sync campaigns
        </p>
      </div>

      {/* Upload Step */}
      {state.step === 'upload' && (
        <div
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-colors
            ${isDragging 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            {isDragging ? 'Drop file here' : 'Upload Excel file'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Drag and drop or click to browse
          </p>
          
          <label
            htmlFor="file-input"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Choose File
          </label>
          
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4">
            Supports .xlsx and .xls files
          </p>
        </div>
      )}

      {/* Parsing Step */}
      {state.step === 'parsing' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Parsing Excel file...
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {state.fileName}
          </p>
        </div>
      )}

      {/* Preview Step */}
      {state.step === 'previewing' && state.preview && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                  Import Preview
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {state.fileName} - {state.preview.summary.totalRows} rows processed
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Upload different file
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  {state.preview.summary.newCampaigns}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">New Campaigns</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {state.preview.summary.newEvents}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">New Events</div>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                  {state.preview.summary.updates}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400">Updates</div>
              </div>
              <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-2xl font-semibold text-zinc-600 dark:text-zinc-400">
                  {state.preview.summary.skipped}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">Skipped</div>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <ImportPreview
            preview={state.preview}
            onSelectionChange={handleSelectionChange}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {selectedCounts.total} item{selectedCounts.total !== 1 ? 's' : ''} selected
              <span className="hidden sm:inline">
                {' '}({selectedCounts.creates} creates, {selectedCounts.events} events, {selectedCounts.updates} updates)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={selectedCounts.total === 0}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                Apply {selectedCounts.total} Change{selectedCounts.total !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applying Step */}
      {state.step === 'applying' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Applying changes...
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Creating campaigns and recording events
          </p>
        </div>
      )}

      {/* Complete Step */}
      {state.step === 'complete' && state.result && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Import Complete
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {state.result.created.length} campaigns created, {state.result.events.length} events recorded, {state.result.corrections.length} corrections applied
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Import Another
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              View Campaigns
            </Link>
          </div>
        </div>
      )}

      {/* Error Step */}
      {state.step === 'error' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-800 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Import Failed
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {state.error}
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
