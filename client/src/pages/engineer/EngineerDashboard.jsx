import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  PlayCircle,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  MessageSquare,
  Sparkles,
  ExternalLink,
  CheckSquare,
  AlertCircle,
  Tag,
  Flame
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Modal from '../../components/common/Modal';

export default function EngineerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'assigned', 'in_progress', 'resolved'

  // Resolution Modal State
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedTicketForResolution, setSelectedTicketForResolution] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [timeSpentMinutes, setTimeSpentMinutes] = useState('30');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets');
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to load engineer tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleStartProgress = async (e, ticketId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: 'In Progress' });
      loadTickets();
    } catch (err) {
      console.error('Failed to set In Progress:', err);
    }
  };

  const openResolutionModal = (e, ticket) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTicketForResolution(ticket);
    setResolutionNotes('');
    setRootCause('');
    setTimeSpentMinutes('30');
    setResolveError('');
    setResolveModalOpen(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim() || !rootCause.trim()) {
      setResolveError('Resolution notes and Root cause are mandatory.');
      return;
    }

    try {
      setResolving(true);
      setResolveError('');
      const res = await api.post(`/tickets/${selectedTicketForResolution.id}/resolve`, {
        resolution_notes: resolutionNotes.trim(),
        root_cause: rootCause.trim(),
        time_spent_minutes: parseInt(timeSpentMinutes, 10) || 0
      });

      if (res.data.success) {
        setResolveModalOpen(false);
        loadTickets();
      }
    } catch (err) {
      setResolveError(err.response?.data?.message || 'Failed to submit resolution.');
    } finally {
      setResolving(false);
    }
  };

  const activeTickets = tickets.filter(
    (t) => t.status === 'Assigned' || t.status === 'In Progress' || t.status === 'Reopened'
  );
  const assignedTickets = tickets.filter((t) => t.status === 'Assigned');
  const inProgressTickets = tickets.filter((t) => t.status === 'In Progress' || t.status === 'Reopened');
  const resolvedTickets = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed');

  const getFilteredTickets = () => {
    switch (activeTab) {
      case 'assigned':
        return assignedTickets;
      case 'in_progress':
        return inProgressTickets;
      case 'resolved':
        return resolvedTickets;
      case 'active':
      default:
        return activeTickets;
    }
  };

  const displayedTickets = getFilteredTickets();

  return (
    <div className="space-y-6">
      {/* Engineer Profile Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Wrench className="w-3.5 h-3.5" />
              <span>IT Support Engineer Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{user?.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Handle your assigned support requests, record diagnostics, and close resolved issues.
            </p>

            {/* Engineer Skill Tags */}
            {user?.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-xs text-slate-400 font-medium">Domain Skills:</span>
                {user.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                  >
                    <Tag className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Workload</span>
            <span className="text-3xl font-black text-amber-400">{activeTickets.length}</span>
            <span className="text-[10px] text-slate-400">Tickets in queue</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('active')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border shadow-sm transition-all ${
            activeTab === 'active' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All Active Queue</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{activeTickets.length}</h3>
        </div>

        <div
          onClick={() => setActiveTab('assigned')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border shadow-sm transition-all ${
            activeTab === 'assigned' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Needs Pickup</p>
          <h3 className="text-2xl font-black text-blue-600 mt-1">{assignedTickets.length}</h3>
        </div>

        <div
          onClick={() => setActiveTab('in_progress')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border shadow-sm transition-all ${
            activeTab === 'in_progress' ? 'border-amber-600 ring-2 ring-amber-100' : 'border-slate-200'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{inProgressTickets.length}</h3>
        </div>

        <div
          onClick={() => setActiveTab('resolved')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border shadow-sm transition-all ${
            activeTab === 'resolved' ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{resolvedTickets.length}</h3>
        </div>
      </div>

      {/* Ticket Queue List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">
            {activeTab === 'active' && 'My Active Tickets Queue'}
            {activeTab === 'assigned' && 'Assigned Tickets (Ready for In-Progress)'}
            {activeTab === 'in_progress' && 'Currently Working On'}
            {activeTab === 'resolved' && 'Resolved Tickets History'}
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Showing {displayedTickets.length} ticket(s)
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/80" />
            <p className="text-sm font-semibold text-slate-700">No tickets in this tab</p>
            <p className="text-xs text-slate-400">All caught up with assigned tasks!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="block bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {ticket.ticket_code}
                      </span>
                      <StatusBadge status={ticket.status} size="sm" />
                      <PriorityBadge priority={ticket.priority} size="sm" />
                      <span className="text-xs font-semibold text-slate-700">
                        {ticket.category} &rarr; {ticket.sub_option}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {ticket.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>👤 Client: <strong>{ticket.client_name}</strong></span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {ticket.floor}
                      </span>
                      {ticket.asset_id && (
                        <span>Asset: <strong>{ticket.asset_id}</strong></span>
                      )}
                      {ticket.contact_number && (
                        <span>Phone: <strong>{ticket.contact_number}</strong></span>
                      )}
                      {ticket.comments_count > 0 && (
                        <span className="text-indigo-600 font-medium flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {ticket.comments_count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                    {ticket.status === 'Assigned' && (
                      <button
                        type="button"
                        onClick={(e) => handleStartProgress(e, ticket.id)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {(ticket.status === 'In Progress' || ticket.status === 'Reopened') && (
                      <button
                        type="button"
                        onClick={(e) => openResolutionModal(e, ticket)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Resolve & Close</span>
                      </button>
                    )}

                    <div className="p-2 rounded-xl bg-white text-slate-400 group-hover:text-indigo-600 border border-slate-200">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mandatory Resolution Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title={`Resolve Ticket — ${selectedTicketForResolution?.ticket_code}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Please fill in the required diagnostic and resolution details before closing this ticket.
          </p>

          {resolveError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{resolveError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Root Cause Identification <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="e.g. Faulty RAM slot, Corrupt driver, DHCP IP conflict"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resolution Action Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe exactly what was done to fix the issue..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Time Spent (in minutes) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={timeSpentMinutes}
              onChange={(e) => setTimeSpentMinutes(e.target.value)}
              placeholder="e.g. 45"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResolveModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {resolving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit & Close Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
