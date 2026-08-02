import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TicketPlus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets');
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to load client tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const codeMatch = t.ticket_code?.toLowerCase().includes(term);
      const descMatch = t.description?.toLowerCase().includes(term);
      const catMatch = t.category?.toLowerCase().includes(term);
      const subMatch = t.sub_option?.toLowerCase().includes(term);
      return codeMatch || descMatch || catMatch || subMatch;
    }
    return true;
  });

  const openCount = tickets.filter((t) => t.status === 'Open' || t.status === 'Assigned').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress' || t.status === 'Reopened').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Employee Support Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Track the live progress of your IT service requests, reply to technician queries, or submit new tickets.
            </p>
          </div>
          <Link
            to="/raise-ticket"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
          >
            <TicketPlus className="w-5 h-5" />
            <span>Raise New Ticket</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending / Open
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{openCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              In Progress
            </p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{inProgressCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resolved & Closed
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { key: 'all', label: 'All Tickets' },
            { key: 'Open', label: 'Open' },
            { key: 'Assigned', label: 'Assigned' },
            { key: 'In Progress', label: 'In Progress' },
            { key: 'Resolved', label: 'Resolved' },
            { key: 'Reopened', label: 'Reopened' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Tickets Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'No tickets match your filter criteria.'
                : 'You have not raised any support requests yet.'}
            </p>
          </div>
          <Link
            to="/raise-ticket"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700"
          >
            <TicketPlus className="w-4 h-4" />
            <span>Raise Your First Ticket</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.id}`}
              className="block bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Code, Category, Description */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {ticket.ticket_code}
                    </span>
                    <StatusBadge status={ticket.status} size="sm" />
                    <PriorityBadge priority={ticket.priority} size="sm" />
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {ticket.category} &bull; {ticket.sub_option}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {ticket.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {ticket.floor}
                    </span>
                    {ticket.asset_id && (
                      <span>Asset: <strong>{ticket.asset_id}</strong></span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    {ticket.comments_count > 0 && (
                      <span className="flex items-center gap-1 text-indigo-600 font-medium">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {ticket.comments_count} updates
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Assigned Engineer & CTA */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:border-l sm:border-slate-100 sm:pl-5">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Assigned Tech
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {ticket.engineer_name || 'Pending Assignment'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
