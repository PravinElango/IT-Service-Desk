import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TicketPlus,
  Ticket,
  Users,
  Building2,
  BarChart3,
  CheckCircle2,
  Wrench,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, isAdmin, isEngineer, isClient } = useAuth();

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 hidden md:flex">
      <div className="space-y-6">
        {/* Role Banner */}
        <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace Mode
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 capitalize">
              {user?.role?.replace('_', ' ')} Portal
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-1.5">
          {/* Client Navigation */}
          {isClient && (
            <>
              <NavLink to="/client" end className={navItemClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>My Dashboard</span>
              </NavLink>
              <NavLink to="/raise-ticket" className={navItemClass}>
                <TicketPlus className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-emerald-700">Raise Ticket</span>
              </NavLink>
            </>
          )}

          {/* Engineer Navigation */}
          {isEngineer && (
            <>
              <NavLink to="/engineer" end className={navItemClass}>
                <Wrench className="w-4 h-4" />
                <span>My Assigned Tickets</span>
              </NavLink>
            </>
          )}

          {/* Super Admin Navigation */}
          {isAdmin && (
            <>
              <NavLink to="/admin" end className={navItemClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Dashboard</span>
              </NavLink>
              <NavLink to="/admin/tickets" className={navItemClass}>
                <Ticket className="w-4 h-4" />
                <span>All Tickets & Triage</span>
              </NavLink>
              <NavLink to="/admin/users" className={navItemClass}>
                <Users className="w-4 h-4" />
                <span>User & Skills Management</span>
              </NavLink>
              <NavLink to="/admin/master" className={navItemClass}>
                <Building2 className="w-4 h-4" />
                <span>Locations & Categories</span>
              </NavLink>
              <NavLink to="/admin/reports" className={navItemClass}>
                <BarChart3 className="w-4 h-4" />
                <span>Reports & Analytics</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-Time SLA Guard</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          System automatically notifies engineers based on category skill tags.
        </p>
      </div>
    </aside>
  );
}
