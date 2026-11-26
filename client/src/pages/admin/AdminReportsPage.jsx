import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Download,
  AlertTriangle,
  Layers,
  Building2,
  Users,
  Ticket,
  RefreshCw
} from 'lucide-react';
import api from '../../api/client';

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'text-indigo-600 bg-indigo-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
    purple: 'text-purple-600 bg-purple-50',
    slate: 'text-slate-600 bg-slate-100',
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/reports/dashboard');
      if (res.data.success) {
        setData(res.data);
      } else {
        setError('Failed to load analytics data.');
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError(err.response?.data?.message || 'Could not connect to the server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleExportCSV = () => {
    const engineers = data?.engineerWorkload || [];
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Engineer,Email,Skills,Active Tickets,Resolved Tickets,Avg Resolution (min)\n';
    engineers.forEach((eng) => {
      const skills = Array.isArray(eng.skills) ? eng.skills.join('; ') : (eng.skills || '');
      csv += `"${eng.name}","${eng.email}","${skills}",${eng.active_tickets},${eng.resolved_tickets},${eng.avg_time_minutes}\n`;
    });
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `support_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 max-w-md w-full">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-800">Failed to Load Analytics</p>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={loadReports}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const stats = data?.stats || {};
  const engineerWorkload = data?.engineerWorkload || [];
  const byCategory = data?.byCategory || [];
  const byFloor = data?.byFloor || [];
  const byPriority = data?.byPriority || [];

  // Avg resolution — backend returns minutes, convert to hours
  const avgHours = stats.avgResolutionMinutes
    ? (stats.avgResolutionMinutes / 60).toFixed(1)
    : '—';

  // Max count for bar chart scaling
  const maxCategoryCount = Math.max(...byCategory.map((c) => c.count), 1);
  const maxFloorCount = Math.max(...byFloor.map((f) => f.count), 1);

  const priorityColors = {
    Critical: 'bg-rose-500',
    High: 'bg-orange-400',
    Medium: 'bg-amber-400',
    Low: 'bg-emerald-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Support Analytics & Performance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live breakdown of ticket volume, resolution speed, category trends, and engineer workloads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadReports}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm border border-slate-200 flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Ticket} label="Total Tickets" value={stats.total ?? 0} sub="All time" color="indigo" />
        <StatCard icon={AlertTriangle} label="Open / Unassigned" value={stats.open ?? 0} sub="Awaiting triage" color="amber" />
        <StatCard icon={TrendingUp} label="In Progress" value={(stats.assigned ?? 0) + (stats.inProgress ?? 0)} sub="Being worked on" color="purple" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved ?? 0} sub="Closed successfully" color="emerald" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="Avg Resolution Time" value={`${avgHours} hrs`} sub="Mean time open → resolved" color="indigo" />
        <StatCard icon={ShieldCheck} label="Reopened Tickets" value={stats.reopened ?? 0} sub="Clients reopened after resolve" color="rose" />
        <StatCard icon={AlertTriangle} label="Critical / High Open" value={stats.critical ?? 0} sub="Unresolved urgent tickets" color="amber" />
      </div>

      {/* Charts Row: Category & Floor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Category */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Tickets by Issue Category
          </h2>
          {byCategory.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{cat.category}</span>
                    <span className="text-xs font-bold text-indigo-700">{cat.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tickets by Floor */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Tickets by Floor / Location
          </h2>
          {byFloor.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {byFloor.map((f) => (
                <div key={f.floor}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{f.floor}</span>
                    <span className="text-xs font-bold text-emerald-700">{f.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(f.count / maxFloorCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Priority Breakdown */}
      {byPriority.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Ticket Priority Distribution
          </h2>
          <div className="flex flex-wrap gap-4">
            {byPriority.map((p) => (
              <div key={p.priority} className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200">
                <span className={`w-2.5 h-2.5 rounded-full ${priorityColors[p.priority] || 'bg-slate-400'}`} />
                <span className="text-xs font-semibold text-slate-700">{p.priority || 'Unset'}</span>
                <span className="text-xs font-black text-slate-900">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engineer Workload Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Technician Performance & Workload
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{engineerWorkload.length} Active Engineers</span>
        </div>

        {engineerWorkload.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No engineer workload data available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 font-bold">Technician</th>
                  <th className="py-3 font-bold">Domain Skills</th>
                  <th className="py-3 font-bold text-center">Active Load</th>
                  <th className="py-3 font-bold text-center">Resolved Total</th>
                  <th className="py-3 font-bold text-center">Avg Time (min)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {engineerWorkload.map((eng) => {
                  const skills = Array.isArray(eng.skills)
                    ? eng.skills
                    : typeof eng.skills === 'string' && eng.skills
                    ? eng.skills.split(',').map((s) => s.trim())
                    : [];
                  return (
                    <tr key={eng.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                            {eng.name?.substring(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{eng.name}</span>
                            <span className="text-[11px] text-slate-400">{eng.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {skills.length > 0 ? (
                            skills.map((s, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No skills tagged</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`font-bold text-sm ${eng.active_tickets > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {eng.active_tickets}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-bold text-emerald-600 text-sm">
                        {eng.resolved_tickets}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                          <Clock className="w-3 h-3" />
                          {eng.avg_time_minutes || '—'} min
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
