import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  Check,
  ShieldCheck,
  Layers,
  ArrowRight,
  Code,
} from 'lucide-react';
import { SupabaseStatus } from '../../types/index.ts';
import { api } from '../../api/client.ts';
import { useToast } from '../Toast.tsx';

export const SupabaseTab: React.FC = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced: Record<string, number>;
    errors: string[];
  } | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const [resStatus, schemaText] = await Promise.all([
        api.getSupabaseStatus(),
        api.getSupabaseSchemaSql(),
      ]);
      setStatus(resStatus);
      setSqlSchema(schemaText);
    } catch (err: any) {
      showToast(err.message || 'Failed to check Supabase status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    showToast('SQL Schema copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSyncData = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const res = await api.syncAllToSupabase();
      setSyncResult({ synced: res.synced, errors: res.errors });
      if (res.success) {
        showToast('All services, barbers, and bookings synced to Supabase!');
      } else {
        showToast('Some tables require SQL migration before syncing.', 'info');
      }
      loadStatus();
    } catch (err: any) {
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const allTablesExist =
    status &&
    Object.values(status.tables).length > 0 &&
    Object.values(status.tables).every((t) => t.exists);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#c5a059] mb-1">
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud Integration</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-[#f4f2ed]">
            Supabase Connection & Database Sync
          </h2>
          <p className="text-xs text-[#8c8980] mt-1">
            Connected to your personal Supabase project (<code className="text-[#edebe6] font-mono">tqtmomrhmuuhhriximea</code>).
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 py-2 px-3.5 text-xs rounded-lg bg-[#161822] border border-[#272a39] text-[#edebe6] hover:bg-[#202330] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Connection Info Banner */}
      <div className="bg-[#12141c] border border-[#232635] rounded-xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-[#8c8980] block mb-1 font-mono uppercase text-[10px]">Project ID</span>
          <span className="font-mono font-bold text-white text-sm">tqtmomrhmuuhhriximea</span>
        </div>
        <div>
          <span className="text-[#8c8980] block mb-1 font-mono uppercase text-[10px]">API Endpoint</span>
          <span className="font-mono text-[#c5a059] truncate block">https://tqtmomrhmuuhhriximea.supabase.co</span>
        </div>
        <div>
          <span className="text-[#8c8980] block mb-1 font-mono uppercase text-[10px]">Connection Status</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active & Authorized</span>
          </span>
        </div>
      </div>

      {/* Supabase Schema Setup Guide (If tables need to be created) */}
      <div className="bg-[#151722] border border-[#262a3b] rounded-xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-[#c5a059]" />
              <span>Supabase Database Schema Setup</span>
            </h3>
            <p className="text-xs text-[#8c8980] mt-1">
              Follow these simple steps to ensure all 7 tables exist in your Supabase project:
            </p>
          </div>

          <a
            href="https://supabase.com/dashboard/project/tqtmomrhmuuhhriximea/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#c5a059] text-black text-xs font-semibold hover:bg-[#dfbe7d] transition-colors whitespace-nowrap shadow"
          >
            <span>Open SQL Editor</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-3 mb-6 text-xs text-[#a4a198]">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1c27] border border-[#252837]">
            <span className="w-5 h-5 rounded-full bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center font-bold text-xs shrink-0">1</span>
            <div>
              <strong className="text-white">Copy the SQL Schema:</strong> Click the button below to copy the complete schema script (creates <code className="text-[#dfbe7d]">bookings</code>, <code className="text-[#dfbe7d]">services</code>, <code className="text-[#dfbe7d]">barbers</code>, etc. with proper Row Level Security).
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1c27] border border-[#252837]">
            <span className="w-5 h-5 rounded-full bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center font-bold text-xs shrink-0">2</span>
            <div>
              <strong className="text-white">Run in Supabase:</strong> Open your Supabase SQL Editor and click <strong className="text-emerald-400">Run</strong>.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1c27] border border-[#252837]">
            <span className="w-5 h-5 rounded-full bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center font-bold text-xs shrink-0">3</span>
            <div>
              <strong className="text-white">Sync Data:</strong> Click <strong className="text-[#c5a059]">"Sync All Data to Supabase"</strong> below to populate demo services, barbers, and existing bookings!
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-lg bg-[#c5a059] text-[#0a0b0d] font-semibold text-xs uppercase tracking-wider hover:bg-[#dfbe7d] transition-colors font-mono shadow-md"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'SQL Copied!' : 'Copy SQL Schema Script'}</span>
          </button>

          <a
            href="https://supabase.com/dashboard/project/tqtmomrhmuuhhriximea/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-lg bg-[#1d202d] border border-[#2b2f42] text-white hover:text-[#c5a059] text-xs font-semibold transition-colors"
          >
            <span>Open Supabase SQL Editor</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleSyncData}
            disabled={syncing}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-lg bg-[#191c28] border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#232738] text-xs font-semibold transition-colors font-mono disabled:opacity-50"
          >
            <UploadCloud className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
            <span>{syncing ? 'Syncing Tables...' : 'Sync All Data to Supabase'}</span>
          </button>
        </div>

        {syncResult && (
          <div className="mt-5 p-4 rounded-lg bg-[#12141d] border border-[#272b3b] text-xs">
            <span className="font-semibold text-white block mb-2">Sync Results:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(syncResult.synced).map(([table, count]) => (
                <div key={table} className="text-[#8c8980]">
                  <span className="font-mono text-white">{table}:</span>{' '}
                  <span className="text-emerald-400 font-bold">{count} records synced</span>
                </div>
              ))}
            </div>
            {syncResult.errors.length > 0 && (
              <div className="mt-3 pt-2 border-t border-[#232635] text-amber-300">
                <span>Note: Some tables have not been created in Supabase yet. Run the SQL schema script in Supabase first!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tables Status Table */}
      <div className="bg-[#12141c] border border-[#232635] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1f2230] flex items-center justify-between">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#c5a059]" />
            <span>Supabase Cloud Tables Status</span>
          </h3>
          <span className="text-xs text-[#8c8980]">Project Schema: public</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181a25] text-[#8c8980] uppercase tracking-wider font-mono border-b border-[#232635]">
              <tr>
                <th className="py-3 px-4">Table Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Cloud Status</th>
                <th className="py-3 px-4 text-right">Row Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e212d] text-[#edebe6]">
              {status &&
                Object.entries(status.tables).map(([tableName, info]) => {
                  return (
                    <tr key={tableName} className="hover:bg-[#181a24]/50">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {tableName}
                      </td>
                      <td className="py-3 px-4 text-[#8c8980]">
                        {tableName === 'bookings' && 'Customer reservations & appointment tickets'}
                        {tableName === 'services' && 'Haircut & grooming menu with pricing/duration'}
                        {tableName === 'barbers' && 'Resident master barbers and biographies'}
                        {tableName === 'barber_availability' && 'Barber working days and shift times'}
                        {tableName === 'blocked_dates' && 'Holiday and studio temporary closures'}
                        {tableName === 'reviews' && 'Verified client testimonials & 5-star ratings'}
                        {tableName === 'settings' && 'Studio contact details & brand headlines'}
                      </td>
                      <td className="py-3 px-4">
                        {info.exists ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active in Supabase</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-950/70 text-amber-400 border border-amber-800/60">
                            <AlertCircle className="w-3 h-3" />
                            <span>Pending Schema Run</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#c5a059]">
                        {info.exists ? `${info.count ?? 0} rows` : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
