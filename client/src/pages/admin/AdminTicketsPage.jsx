import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  UserPlus,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Ticket
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Modal from '../../components/common/Modal';

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [assigning, setAssigning] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets');
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to load tickets for triage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const openAssignModal = async (e, t) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTicket(t);
    setSelectedPriority(t.priority || 'Medium');
    setSelectedEngineerId(t.assigned_engineer_id ? String(t.assigned_engineer_id) : '');

    try {
      const res = await api.get(`/users/engineers?category=${encodeURIComponent(t.category)}`);
      if (res.data.success) {
        setEngineers(res.data.engineers);
        if (!t.assigned_engineer_id) {
          const match = res.data.engineers.find((eng) => eng.matchesCategory);
          if (match) setSelectedEngineerId(String(match.id));
        }
      }
      setAssignModalOpen(true);
    } catch (err) {
      console.error('Failed to load engineers:', err);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEngineerId || !selectedTicket) return;

    try {
      setAssigning(true);
      const res = await api.patch(`/tickets/${selectedTicket.id}/assign`, {
        engineer_id: parseInt(selectedEngineerId, 10),
        priority: selectedPriority
      });
      if (res.data.success) {
        setAssignModalOpen(false);
        loadTickets();
      }
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    } finally {
      setAssigning(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const codeMatch = t.ticket_code?.toLowerCase().includes(term);
      const descMatch = t.description?.toLowerCase().includes(term);
      const clientMatch = t.client_name?.toLowerCase().includes(term);
      const engMatch = t.engineer_name?.toLowerCase().includes(term);
      return codeMatch || descMatch || clientMatch || engMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-indigo-600" />
            <span>Master Tickets & Triage Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, search, filter, and assign tickets across all departments and locations.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm w-fit">
          Total: {filteredTickets.length} tickets
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, description, client..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Reopened">Reopened</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="PC Issue">PC Issue</option>
            <option value="Laptop Issue">Laptop Issue</option>
            <option value="Printer Issue">Printer Issue</option>
            <option value="Network Issue">Network Issue</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Layers className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No tickets found</p>
            <p className="text-xs text-slate-400">Try adjusting your filter options above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-3.5">Ticket Code</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Category & Description</th>
                  <th className="px-6 py-3.5">Raised By / Floor</th>
                  <th className="px-6 py-3.5">Assigned Specialist</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="font-mono font-bold text-indigo-600 hover:underline"
                      >
                        {t.ticket_code}
                      </Link>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} size="sm" />
                    </td>

                    <td className="px-6 py-4">
                      <PriorityBadge priority={t.priority} size="sm" />
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-slate-900">{t.category} &bull; {t.sub_option}</div>
                      <div className="text-slate-500 truncate text-[11px] mt-0.5">{t.description}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{t.client_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {t.floor}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {t.engineer_name ? (
                        <div className="font-bold text-slate-900">{t.engineer_name}</div>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={(e) => openAssignModal(e, t)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>{t.assigned_engineer_id ? 'Reassign' : 'Assign'}</span>
                      </button>
                      <Link
                        to={`/tickets/${t.id}`}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors inline-block"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Triage & Assign — ${selectedTicket?.ticket_code}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-900 text-xs">
            <strong>Category:</strong> {selectedTicket?.category} ({selectedTicket?.sub_option})
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select IT Engineer
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {engineers.map((eng) => {
                const isSelected = selectedEngineerId === String(eng.id);
                return (
                  <div
                    key={eng.id}
                    onClick={() => setSelectedEngineerId(String(eng.id))}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{eng.name}</span>
                        {eng.matchesCategory && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            ★ Skill Match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>Active: {eng.active_tickets_count || 0} tickets</span>
                        <span>&bull;</span>
                        <span>Skills: {eng.skills.join(', ') || 'General'}</span>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Set Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigning || !selectedEngineerId}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {assigning ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Assign & Notify</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
