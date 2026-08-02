import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Headphones,
  LogOut,
  User,
  Shield,
  Wrench,
  UserCheck,
  CheckCheck,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import StatusBadge from '../common/StatusBadge';

export default function Navbar() {
  const { user, logout, demoAccounts, login } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const demoRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (demoRef.current && !demoRef.current.contains(e.target)) {
        setShowDemoMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDemoSwitch = async (account) => {
    try {
      await login(account.email, account.password);
      setShowDemoMenu(false);
      if (account.role === 'super_admin') navigate('/admin');
      else if (account.role === 'engineer') navigate('/engineer');
      else navigate('/client');
    } catch (err) {
      console.error('Demo switch failed:', err);
    }
  };

  const getRoleIcon = () => {
    if (user?.role === 'super_admin') return <Shield className="w-4 h-4 text-purple-600" />;
    if (user?.role === 'engineer') return <Wrench className="w-4 h-4 text-amber-600" />;
    return <UserCheck className="w-4 h-4 text-blue-600" />;
  };

  const getRoleBadgeStyle = () => {
    if (user?.role === 'super_admin') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (user?.role === 'engineer') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-slate-900 via-brand-900 to-indigo-900 bg-clip-text text-transparent">
                  AutoDesk IT
                </span>
                <span className="hidden sm:inline-block ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Service Desk
                </span>
              </div>
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Role Switcher */}
            <div className="relative" ref={demoRef}>
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                title="Switch demo role without logging out"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Demo Switcher</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Quick Demo Switcher
                    </p>
                    <p className="text-xs text-slate-500">Instant login as any test role</p>
                  </div>
                  <div className="py-1 max-h-80 overflow-y-auto space-y-1">
                    {demoAccounts.map((acc, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDemoSwitch(acc)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                          user?.email === acc.email
                            ? 'bg-indigo-50 border border-indigo-200'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>{acc.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            {acc.badge}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">{acc.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fadeIn">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold text-sm text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.is_read) markAsRead(notif.id);
                            if (notif.ticket_id) {
                              setShowNotifications(false);
                              navigate(`/tickets/${notif.ticket_id}`);
                            }
                          }}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                              )}
                              {notif.title || 'Update'}
                            </h4>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          {notif.ticket_code && (
                            <span className="inline-block mt-1.5 text-[10px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {notif.ticket_code}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {user?.name}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded border w-fit ${getRoleBadgeStyle()}`}>
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    {user?.floor && (
                      <p className="text-[11px] text-indigo-600 mt-1 font-medium">📍 {user.floor}</p>
                    )}
                    {user?.skills && user.skills.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {user.skills.map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
