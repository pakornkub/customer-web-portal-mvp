import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { LogIn, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-900 p-8 ui-radius-card shadow-lg border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <h1 className="ui-page-title">UBE Portal</h1>
            <p className="ui-page-subtitle mt-2">
              Sign in to manage your orders
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm ui-radius-control flex items-center gap-2">
              <Info size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block ui-form-label mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadcn-input"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="block ui-form-label mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadcn-input"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2.5 px-4 ui-radius-control font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <LogIn size={18} />
              Sign In
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 uppercase font-semibold tracking-wider">
              Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  trader1
                </span>{' '}
                (Trader)
              </div>
              <div className="text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  ube1
                </span>{' '}
                (UBE Japan)
              </div>
              <div className="text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  mizutani
                </span>{' '}
                (Sale)
              </div>
              <div className="text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  sakuma
                </span>{' '}
                (Sale)
              </div>
              <div className="text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  cs1
                </span>{' '}
                (CS)
              </div>
              <div className="text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  admin
                </span>{' '}
                (Admin)
              </div>
            </div>
            <p className="ui-form-helper mt-2 italic">
              * Use any password to login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
