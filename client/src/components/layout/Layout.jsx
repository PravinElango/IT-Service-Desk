import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Layout() {
  const { toastNotification, dismissToast } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Floating Live Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-start gap-3 animate-slideUp">
          <div className="p-2 rounded-xl bg-indigo-600 text-white">
            <Bell className="w-4 h-4" />
          </div>
          <div
            className="flex-1 cursor-pointer"
            onClick={() => {
              if (toastNotification.ticket_id) {
                navigate(`/tickets/${toastNotification.ticket_id}`);
              }
              dismissToast();
            }}
          >
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              {toastNotification.title}
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed line-clamp-2">
              {toastNotification.message}
            </p>
          </div>
          <button
            onClick={dismissToast}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
