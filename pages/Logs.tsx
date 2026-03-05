import React, { useState } from 'react';
import { useStore } from '../store';
import { ClipboardList, Bell, Mail, Monitor, Link2 } from 'lucide-react';

export const Logs: React.FC = () => {
  const { activities, notifications, integrationLogs } = useStore();
  const [tab, setTab] = useState<'activity' | 'notification' | 'integration'>(
    'activity'
  );

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ui-page-title">System Logs</h1>
          <p className="ui-page-subtitle">
            Audit trail for all system activities and communication logs.
          </p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 ui-radius-control w-fit">
        <button
          onClick={() => setTab('activity')}
          className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${tab === 'activity' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Activity Log
        </button>
        <button
          onClick={() => setTab('notification')}
          className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${tab === 'notification' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Notifications
        </button>
        <button
          onClick={() => setTab('integration')}
          className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${tab === 'integration' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Integration
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'activity' ? (
            <table className="w-full text-left text-sm ui-table-standard">
              <thead className="bg-slate-50 dark:bg-slate-950/50 ui-table-head border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left">Timestamp</th>
                  <th className="px-6 py-4 text-left">User</th>
                  <th className="px-6 py-4 text-left">Action</th>
                  <th className="px-6 py-4 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activities.map((act) => (
                  <tr
                    key={act.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs">
                      {formatDateTime(act.timestamp)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      {act.user}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-bold ui-micro-text border border-slate-200 dark:border-slate-700">
                        {act.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {act.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === 'notification' ? (
            <table className="w-full text-left text-sm ui-table-standard">
              <thead className="bg-slate-50 dark:bg-slate-950/50 ui-table-head border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left">Time</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Target Role</th>
                  <th className="px-6 py-4 text-left">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notif) => (
                  <tr
                    key={notif.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs">
                      {formatDateTime(notif.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {notif.type === 'email' ? (
                          <Mail
                            size={14}
                            className="text-blue-500 dark:text-blue-400"
                          />
                        ) : (
                          <Monitor
                            size={14}
                            className="text-slate-400 dark:text-slate-500"
                          />
                        )}
                        <span className="ui-kicker text-slate-700 dark:text-slate-300">
                          {notif.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-black text-[9px] border border-blue-100 dark:border-blue-800 tracking-wider">
                        {notif.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {notif.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm ui-table-standard">
              <thead className="bg-slate-50 dark:bg-slate-950/50 ui-table-head border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left">Time</th>
                  <th className="px-6 py-4 text-left">Order</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {integrationLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      <div className="inline-flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-slate-400" />
                        {log.orderNo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold ui-micro-text border ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                            : log.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {log.message}
                    </td>
                  </tr>
                ))}
                {integrationLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-slate-400"
                    >
                      No integration logs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
