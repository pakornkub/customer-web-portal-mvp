import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import Swal from '../utils/swal';
import { useStore } from '../store';

export const ClearData: React.FC = () => {
  const navigate = useNavigate();
  const [clearing, setClearing] = useState(false);
  const resetStore = useStore((state) => state.resetStore);

  const handleClearStorage = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Clear All Data?',
      html: `
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
          This will permanently delete all data from localStorage including:
        </p>
        <ul class="text-left text-sm text-slate-600 dark:text-slate-400 space-y-1 mb-4">
          <li>• All orders and documents</li>
          <li>• Master data configurations</li>
          <li>• User accounts (except defaults)</li>
          <li>• Activity logs and notifications</li>
          <li>• Integration logs</li>
        </ul>
        <p class="text-sm font-bold text-rose-600">This action cannot be undone!</p>
      `,
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Clear Everything',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      setClearing(true);

      // Clear persisted state and reset in-memory store
      await new Promise((resolve) => setTimeout(resolve, 1500));
      useStore.persist.clearStorage();
      resetStore();

      Swal.fire({
        icon: 'success',
        title: 'Data Cleared',
        text: 'All data has been removed. Redirecting to login.',
        timer: 2000,
        showConfirmButton: false
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ui-page-title">Clear Data</h1>
          <p className="ui-page-subtitle mt-1">
            Database management and storage utilities
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/50 ui-radius-card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 ui-radius-control">
            <AlertTriangle
              size={24}
              className="text-rose-600 dark:text-rose-400"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-rose-900 dark:text-rose-100 mb-2">
              Danger Zone - Admin Only
            </h3>
            <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
              These actions will permanently delete data from the browser's
              localStorage. This is intended for development and testing
              purposes only. All users will be logged out and the application
              will reset to its initial state.
            </p>
          </div>
        </div>
      </div>

      {/* Clear All Data Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ui-radius-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 ui-radius-control">
              <Database
                size={20}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div>
              <h2 className="ui-subheader">Storage Management</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clear all application data
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 ui-radius-control bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Clear All Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Remove all orders, configurations, users, and logs from
                localStorage. The application will reset to factory defaults.
              </p>
            </div>
            <button
              onClick={handleClearStorage}
              disabled={clearing}
              className="ml-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white px-5 py-2.5 ui-radius-control text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20 disabled:shadow-none"
            >
              {clearing ? (
                <>
                  <RotateCcw size={16} className="animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Clear Storage
                </>
              )}
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 ui-radius-control p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={16}
                className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
              />
              <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <span className="font-bold">Note:</span> After clearing data,
                you will be logged out and redirected to the login page. The
                application will reinitialize with default seed data on next
                login.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 ui-radius-card p-6">
        <div className="flex items-start gap-3">
          <Database
            size={20}
            className="text-indigo-600 dark:text-indigo-400 mt-0.5"
          />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-2">
              Storage Information
            </h3>
            <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed">
              This application uses browser localStorage to persist data. The
              storage key is{' '}
              <code className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 rounded text-indigo-700 dark:text-indigo-300 font-mono">
                ube-portal-storage-v3
              </code>
              . Data is stored locally in your browser and is not sent to any
              server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
