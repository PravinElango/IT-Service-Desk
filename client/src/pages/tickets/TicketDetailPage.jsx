import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Phone,
  Barcode,
  User,
  Shield,
  Wrench,
  Send,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Clock,
  FileText,
  History,
  Tag,
  UserPlus,
  Paperclip,
  Download,
  ExternalLink,
  Eye,
  File,
  X,
  Maximize2
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Modal from '../../components/common/Modal';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isEngineer, isClient } = useAuth();
  const { socket } = useNotifications();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const commentsEndRef = useRef(null);

  // Assign Modal (Admin)
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [engineers, setEngineers] = useState([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [assigning, setAssigning] = useState(false);

  // Resolution Modal (Engineer/Admin)
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [timeSpentMinutes, setTimeSpentMinutes] = useState('30');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  // Reopen Modal (Client)
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  // Lightbox Modal for Media Attachments
  const [lightboxImage, setLightboxImage] = useState(null);

  const [activeViewTab, setActiveViewTab] = useState('conversation'); // 'conversation', 'audit'

  const loadTicket = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${id}`);
      if (res.data.success) {
        setTicket(res.data.ticket);
        setSelectedPriority(res.data.ticket.priority || 'Medium');
        if (res.data.ticket.assigned_engineer_id) {
          setSelectedEngineerId(String(res.data.ticket.assigned_engineer_id));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  // Join ticket socket room
  useEffect(() => {
    if (socket && ticket?.id) {
      socket.emit('join_ticket', ticket.id);

      socket.on('new_comment', (data) => {
        if (data.ticketId === ticket.id) {
          setTicket((prev) => {
            if (!prev) return prev;
            // Prevent duplicates
            if (prev.comments.some((c) => c.id === data.comment.id)) return prev;
            return {
              ...prev,
              comments: [...prev.comments, data.comment]
            };
          });
          scrollToBottom();
        }
      });

      return () => {
        socket.emit('leave_ticket', ticket.id);
        socket.off('new_comment');
      };
    }
  }, [socket, ticket?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const openAssignModal = async () => {
    try {
      const res = await api.get(`/users/engineers?category=${encodeURIComponent(ticket.category)}`);
      if (res.data.success) {
        setEngineers(res.data.engineers);
        // Pre-select matching engineer if none assigned
        if (!ticket.assigned_engineer_id) {
          const match = res.data.engineers.find((e) => e.matchesCategory);
          if (match) setSelectedEngineerId(String(match.id));
        }
      }
      setAssignModalOpen(true);
    } catch (err) {
      console.error('Failed to load engineers list:', err);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEngineerId) return;

    try {
      setAssigning(true);
      const res = await api.patch(`/tickets/${ticket.id}/assign`, {
        engineer_id: parseInt(selectedEngineerId, 10),
        priority: selectedPriority
      });
      if (res.data.success) {
        setAssignModalOpen(false);
        loadTicket();
      }
    } catch (err) {
      console.error('Failed to assign engineer:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/tickets/${ticket.id}/status`, { status: newStatus });
      loadTicket();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
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
      const res = await api.post(`/tickets/${ticket.id}/resolve`, {
        resolution_notes: resolutionNotes.trim(),
        root_cause: rootCause.trim(),
        time_spent_minutes: parseInt(timeSpentMinutes, 10) || 0
      });

      if (res.data.success) {
        setResolveModalOpen(false);
        loadTicket();
      }
    } catch (err) {
      setResolveError(err.response?.data?.message || 'Failed to resolve ticket.');
    } finally {
      setResolving(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    try {
      setReopening(true);
      const res = await api.post(`/tickets/${ticket.id}/reopen`, {
        reason: reopenReason.trim()
      });
      if (res.data.success) {
        setReopenModalOpen(false);
        loadTicket();
      }
    } catch (err) {
      console.error('Failed to reopen ticket:', err);
    } finally {
      setReopening(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setPostingComment(true);
      const res = await api.post(`/tickets/${ticket.id}/comments`, {
        message: commentText.trim()
      });
      if (res.data.success) {
        setCommentText('');
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Unable to view ticket</h3>
        <p className="text-xs text-slate-500">{error || 'Ticket not found.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isResolved = ticket.status === 'Resolved' || ticket.status === 'Closed';
  const isAssigned = ticket.status === 'Assigned';
  const isInProgress = ticket.status === 'In Progress';
  const isReopened = ticket.status === 'Reopened';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ticket Queue</span>
        </button>

        {/* Top Workflow Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Triage / Assign */}
          {isAdmin && (
            <button
              onClick={openAssignModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>{ticket.assigned_engineer_id ? 'Reassign Engineer' : 'Assign IT Engineer'}</span>
            </button>
          )}

          {/* Engineer Start Work */}
          {(isEngineer || isAdmin) && isAssigned && (
            <button
              onClick={() => handleStatusChange('In Progress')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Mark In Progress</span>
            </button>
          )}

          {/* Engineer / Admin Resolve */}
          {(isEngineer || isAdmin) && (isInProgress || isReopened) && (
            <button
              onClick={() => {
                setResolutionNotes('');
                setRootCause('');
                setTimeSpentMinutes('30');
                setResolveError('');
                setResolveModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolve & Close Ticket</span>
            </button>
          )}

          {/* Client Reopen */}
          {(isClient || isAdmin) && isResolved && (
            <button
              onClick={() => {
                setReopenReason('');
                setReopenModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Issue Not Fixed? Reopen Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Ticket Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                {ticket.ticket_code}
              </span>
              <StatusBadge status={ticket.status} size="md" />
              <PriorityBadge priority={ticket.priority} size="md" />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {ticket.category} &mdash; {ticket.sub_option}
            </h1>

            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Raised on {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>

          {/* Ticket Key Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs min-w-[280px]">
            <div>
              <span className="text-slate-400 block font-medium">Raised By</span>
              <span className="font-bold text-slate-900">{ticket.client_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Floor / Location</span>
              <span className="font-bold text-slate-900">{ticket.floor}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Asset ID</span>
              <span className="font-bold text-slate-900">{ticket.asset_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Contact Phone</span>
              <span className="font-bold text-slate-900">{ticket.contact_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Problem Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Problem Description
          </h3>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>

        {/* Media & Attachments Section */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
              <span>Attached Media & Evidence ({ticket.attachments.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ticket.attachments.map((att) => {
                const isImage = att.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.file_name);
                const fileUrl = `http://localhost:5000${att.file_path}`;

                return (
                  <div
                    key={att.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                  >
                    {isImage ? (
                      <div
                        onClick={() => setLightboxImage({ url: fileUrl, name: att.file_name })}
                        className="relative h-32 rounded-xl overflow-hidden bg-slate-100 cursor-pointer group/img border border-slate-100"
                      >
                        <img
                          src={fileUrl}
                          alt={att.file_name}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-bold">
                          <Maximize2 className="w-4 h-4" />
                          <span>Click to Zoom</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <File className="w-8 h-8" />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate" title={att.file_name}>
                          {att.file_name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {att.file_size ? (att.file_size / 1024).toFixed(1) + ' KB' : 'File attachment'}
                        </p>
                      </div>

                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={att.file_name}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition-colors shrink-0 flex items-center gap-1 text-xs font-bold"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Assigned Engineer Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-600 block tracking-wider">
                Assigned IT Specialist
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {ticket.engineer_name || 'Unassigned (Awaiting Super Admin Triage)'}
              </span>
              {ticket.engineer_email && (
                <span className="text-xs text-slate-500 ml-2">({ticket.engineer_email})</span>
              )}
            </div>
          </div>

          {ticket.assigned_at && (
            <span className="text-[11px] text-slate-500 font-medium">
              Assigned on: {new Date(ticket.assigned_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Resolution Details Card (if resolved) */}
        {ticket.resolution && (
          <div className="p-6 rounded-3xl bg-emerald-50/80 border border-emerald-200 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Resolution & Diagnostic Summary
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <span className="text-emerald-700 font-semibold block">Root Cause:</span>
                <p className="text-slate-900 font-medium mt-0.5">{ticket.resolution.root_cause}</p>
              </div>
              <div>
                <span className="text-emerald-700 font-semibold block">Time Spent:</span>
                <p className="text-slate-900 font-bold mt-0.5">{ticket.resolution.time_spent_minutes} minutes</p>
              </div>
              <div className="sm:col-span-3 pt-2 border-t border-emerald-200/60">
                <span className="text-emerald-700 font-semibold block">Resolution Actions:</span>
                <p className="text-slate-900 mt-0.5 leading-relaxed bg-white p-3 rounded-xl border border-emerald-200/80">
                  {ticket.resolution.resolution_notes}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Conversation & Audit Trail */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-6 px-6 pt-4 border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveViewTab('conversation')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeViewTab === 'conversation'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Updates & Comments ({ticket.comments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveViewTab('audit')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeViewTab === 'audit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail & Lifecycle History</span>
          </button>
        </div>

        {/* Conversation Stream */}
        {activeViewTab === 'conversation' && (
          <div className="p-6 space-y-6">
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {ticket.comments?.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No comments or messages posted yet. Use the box below to ask questions or provide updates.
                </div>
              ) : (
                ticket.comments?.map((c) => {
                  const isMe = c.user_id === user?.id;
                  const isEng = c.user_role === 'engineer';
                  const isAdm = c.user_role === 'super_admin';

                  return (
                    <div
                      key={c.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-700">
                          {c.user_name}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                            isAdm
                              ? 'bg-purple-100 text-purple-700'
                              : isEng
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {c.user_role.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs max-w-lg leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200/80'
                        }`}
                      >
                        {c.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Post Box */}
            <form onSubmit={handleSendComment} className="pt-4 border-t border-slate-100 flex gap-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your message, query, or technician update here..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={postingComment || !commentText.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

        {/* Audit History Tab */}
        {activeViewTab === 'audit' && (
          <div className="p-6">
            <div className="space-y-4">
              {ticket.auditLogs?.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5" />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">{log.action}: </span>
                    <span className="text-slate-700">{log.details}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      By {log.performer_name || 'System'} on {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Admin Triage & Assignment Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign IT Engineer — ${ticket.ticket_code}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-900 text-xs">
            <strong>Ticket Category:</strong> {ticket.category} ({ticket.sub_option})
            <p className="text-[11px] text-indigo-700 mt-0.5">
              Engineers tagged with matching skill are marked with a <span className="font-bold text-emerald-700">★ Skill Match</span> badge.
            </p>
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

      {/* Mandatory Resolution Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title={`Resolve Ticket — ${ticket.ticket_code}`}
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
              placeholder="e.g. Loose SATA cable, Print spooler hang, Driver crash"
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
              placeholder="Describe what was repaired, replaced, or configured..."
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
                  <span>Submit Resolution</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reopen Ticket Modal */}
      <Modal
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        title={`Reopen Ticket — ${ticket.ticket_code}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReopenSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            If the problem persists, please explain what is still not working. The engineer will be notified immediately.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Reopening <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. The Wi-Fi disconnected again after reboot..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReopenModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reopening}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {reopening ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Reopen Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
      {/* Media Lightbox Zoom Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-4">
              <span className="text-xs font-bold truncate">{lightboxImage.name}</span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.url}
                  download={lightboxImage.name}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
