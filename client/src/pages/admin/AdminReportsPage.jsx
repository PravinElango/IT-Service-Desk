import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Download,
  Calendar,
  Layers,
  Building2,
  Users
} from 'lucide-react';
import api from '../../api/client';

export default function AdminReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await api.get('/reports/dashboard');
        if (res.data.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const engineerWorkload = stats?.engineerWorkload || [];
  const categoryStats = stats?.categoryStats || [];
  const floorStats = stats?.floorStats || [];

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Engineer,Skills,Active Tickets,Resolved Tickets\n';
    engineerWorkload.forEach((eng) => {
      csvContent += `"${eng.name}","${eng.skills.join(', ')}",${eng.active_tickets_count},${eng.resolved_tickets_count}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `support_ticket_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Support Analytics & SLA Performance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed breakdown of resolution speeds, category volume trends, and engineer throughput.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Summary</span>
        </button>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>SLA Target Compliance</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 mt-2">94.8%</h3>
          <p className="text-xs text-slate-500 mt-1">Tickets resolved within target priority timeframe</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Average Resolution Time</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 mt-2">{kpis.avg_resolution_hours || 0} Hours</h3>
          <p className="text-xs text-slate-500 mt-1">Mean duration from submission to closure</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>First-Touch Resolution</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 mt-2">88.2%</h3>
          <p className="text-xs text-slate-500 mt-1">Resolved without requiring customer reopening</p>
        </div>
      </div>

      {/* Detailed Engineer Performance Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Technician Performance & Workload Distribution</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">Active Staff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 font-bold">Technician</th>
                <th className="py-3 font-bold">Domain Skills</th>
                <th className="py-3 font-bold text-center">Active Load</th>
                <th className="py-3 font-bold text-center">Resolved Total</th>
                <th className="py-3 font-bold text-center">Efficiency Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {engineerWorkload.map((eng) => (
                <tr key={eng.id} className="hover:bg-slate-50">
                  <td className="py-3.5">
                    <span className="font-bold text-slate-900 block">{eng.name}</span>
                    <span className="text-[11px] text-slate-400">{eng.email}</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {eng.skills.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 text-center font-bold text-amber-600">{eng.active_tickets_count}</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">{eng.resolved_tickets_count}</td>
                  <td className="py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                      ★ 4.9 / 5.0
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
