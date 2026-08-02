import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
  Building2,
  TrendingUp,
  ExternalLink,
  Sparkles,
  ArrowRight,
  BarChart2,
  Layers
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await api.get('/reports/dashboard');
        if (res.data.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const categoryStats = stats?.categoryStats || [];
  const floorStats = stats?.floorStats || [];
  const engineerWorkload = stats?.engineerWorkload || [];
  const recentTickets = stats?.recentTickets || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Super Admin Master Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Executive IT Overview</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Real-time monitoring of ticket throughput, category distribution, engineer workloads, and SLA metrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/tickets"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              <span>Triage Tickets</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Tickets</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{kpis.total || 0}</h3>
          <span className="text-[10px] text-slate-500">All time logged</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Open / Pending</span>
          <h3 className="text-2xl font-black text-slate-700 mt-1">{kpis.open || 0}</h3>
          <span className="text-[10px] text-slate-500">Needs triage</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Assigned</span>
          <h3 className="text-2xl font-black text-blue-600 mt-1">{kpis.assigned || 0}</h3>
          <span className="text-[10px] text-slate-500">Awaiting pickup</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400">In Progress</span>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{kpis.in_progress || 0}</h3>
          <span className="text-[10px] text-slate-500">Under diagnostics</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Resolved</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{kpis.resolved || 0}</h3>
          <span className="text-[10px] text-slate-500">Closed issues</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Avg Fix Time</span>
          <h3 className="text-2xl font-black text-indigo-600 mt-1">{kpis.avg_resolution_hours || 0}h</h3>
          <span className="text-[10px] text-slate-500">Mean time to resolve</span>
        </div>
      </div>

      {/* Middle Row: Category Distribution & Floor Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Category Volume Distribution</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">By Ticket Count</span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No category data yet.</p>
            ) : (
              categoryStats.map((cat, idx) => {
                const totalTickets = kpis.total || 1;
                const percentage = Math.round((cat.count / totalTickets) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{cat.category}</span>
                      <span className="text-slate-500">{cat.count} tickets ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Floor Location Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Location / Floor Ticket Load</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">By Physical Floor</span>
          </div>

          <div className="space-y-3 pt-2">
            {floorStats.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No floor data yet.</p>
            ) : (
              floorStats.map((fl, idx) => {
                const totalTickets = kpis.total || 1;
                const percentage = Math.round((fl.count / totalTickets) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{fl.floor}</span>
                      <span className="text-slate-500">{fl.count} tickets ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Engineer Workload Matrix */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>IT Support Engineer Workload & Skill Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live view of active assignments, completed resolutions, and tagged specializations.
            </p>
          </div>
          <Link
            to="/admin/users"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Manage Skills & Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 font-bold">Engineer Name</th>
                <th className="py-2.5 font-bold">Specialty Skills</th>
                <th className="py-2.5 font-bold text-center">Active Tickets</th>
                <th className="py-2.5 font-bold text-center">Resolved Tickets</th>
                <th className="py-2.5 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {engineerWorkload.map((eng) => (
                <tr key={eng.id} className="hover:bg-slate-50">
                  <td className="py-3">
                    <div className="font-bold text-slate-900">{eng.name}</div>
                    <div className="text-[11px] text-slate-400">{eng.email}</div>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {eng.skills && eng.skills.length > 0 ? (
                        eng.skills.map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No skills tagged</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`font-black text-sm px-2.5 py-0.5 rounded-full ${
                        eng.active_tickets_count > 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {eng.active_tickets_count}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="font-bold text-emerald-600 text-sm">
                      {eng.resolved_tickets_count}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Available
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Live Ticket Stream */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Recent Ticket Activity Feed</h2>
          <Link
            to="/admin/tickets"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All Tickets Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {recentTickets.map((t) => (
            <Link
              key={t.id}
              to={`/tickets/${t.id}`}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {t.ticket_code}
                </span>
                <span className="font-bold text-slate-800">{t.category}</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-600 truncate max-w-sm">{t.description}</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={t.status} size="sm" />
                <span className="text-[11px] text-slate-400">
                  {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
