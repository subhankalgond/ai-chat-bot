'use client';

import React, { useState, useEffect } from 'react';
import { MODEL_REGISTRY } from '@/lib/models/registry';
import { SystemStats, ProviderStatus } from '@/types';
import {
  X,
  ShieldAlert,
  Cpu,
  Activity,
  DollarSign,
  Radio,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Layers,
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminDashboardModal({ isOpen, onClose }: AdminDashboardModalProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [infra, setInfra] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setInfra(data.infrastructure);
      } else {
        throw new Error('Failed to load stats');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">NOVA AI Orchestration Console</h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                System Infrastructure & Provider Health
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto text-xs">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
              <div className="text-muted-foreground flex items-center justify-between">
                <span>Total Requests</span>
                <Activity className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                {stats?.totalRequests || 0}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">All providers</div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
              <div className="text-muted-foreground flex items-center justify-between">
                <span>Processed Tokens</span>
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                {stats?.totalTokens.toLocaleString() || '0'}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">In/Out Total</div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
              <div className="text-muted-foreground flex items-center justify-between">
                <span>Estimated Cost</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                ${stats?.estimatedCostUSD?.toFixed(3) || '0.000'}
              </div>
              <div className="text-[10px] text-emerald-500 font-mono">Aggregated API usage</div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
              <div className="text-muted-foreground flex items-center justify-between">
                <span>Voice Pipeline</span>
                <Radio className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                Active
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">WebRTC / STT / TTS</div>
            </div>
          </div>

          {/* AI Providers Verification Status */}
          <div className="space-y-3">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Configured AI Engine Providers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stats?.providers.map((p) => (
                <div
                  key={p.provider}
                  className="p-4 rounded-xl border border-border bg-secondary/40 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{p.name}</span>
                    {p.isConfigured ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                        <CheckCircle className="w-3 h-3" /> Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                        <AlertTriangle className="w-3 h-3" /> Key Pending
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {p.modelCount} Models Registered • {p.isConfigured ? 'API Connected' : 'Configure in .env'}
                  </p>

                  <div className="text-[10px] font-mono text-muted-foreground/80 pt-1 border-t border-border/50">
                    {p.isConfigured ? 'Status: 200 OK' : 'Awaiting Environment Key'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Registry Overview Table */}
          <div className="space-y-3">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Model Registry & verified Capabilities</span>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Context</th>
                    <th className="py-2.5 px-3">Voice</th>
                    <th className="py-2.5 px-3">Pricing (In/Out 1k)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {MODEL_REGISTRY.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-3 font-semibold text-foreground">{m.name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">{m.providerLabel}</td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">
                        {(m.contextWindow / 1000).toFixed(0)}k
                      </td>
                      <td className="py-2.5 px-3">
                        {m.supportsRealtimeVoice ? (
                          <span className="text-emerald-500 font-medium">Supported</span>
                        ) : (
                          <span className="text-muted-foreground">Text & Vision</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        ${m.costPer1kInputUSD} / ${m.costPer1kOutputUSD}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" /> System Architecture & Security
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground font-mono">
              <div>Node: {infra?.nodeVersion || 'v24.x'}</div>
              <div>Env: {infra?.environment || 'development'}</div>
              <div>Web Search: {infra?.webSearchConfigured ? 'Tavily / Serper' : 'DDG Fallback'}</div>
              <div>Database: {infra?.databaseConfigured ? 'Supabase Postgres' : 'Local Storage Mode'}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border flex justify-end bg-secondary/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-foreground text-background font-medium text-xs hover:opacity-90"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
