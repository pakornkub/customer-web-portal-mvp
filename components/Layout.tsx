import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import {
  LayoutDashboard,
  ShoppingCart,
  FileCheck,
  UserCog,
  Truck,
  Settings,
  LogOut,
  Bell,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
  Command,
  Sun,
  Moon,
  Database,
  BadgeCheck
} from 'lucide-react';
import { Role } from '../types';

interface NavItemProps {
  to: string;
  icon: any;
  label: string;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  icon: Icon,
  label,
  collapsed
}) => {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 ui-radius-control transition-all duration-200 group ${
        isActive
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      )}
    </Link>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { currentUser, logout, notifications, theme, toggleTheme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (!currentUser) return <>{children}</>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.map((part, i) => ({
      label: part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' '),
      href: '/' + parts.slice(0, i + 1).join('/')
    }));
  };

  const menuItems = [
    {
      to: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: [
        Role.UBE_JAPAN,
        Role.MAIN_TRADER,
        Role.CS,
        Role.SALE,
        Role.SALE_MANAGER,
        Role.ADMIN
      ]
    },
    {
      to: '/orders',
      icon: ShoppingCart,
      label: 'Orders',
      roles: [
        Role.UBE_JAPAN,
        Role.MAIN_TRADER,
        Role.CS,
        Role.SALE,
        Role.SALE_MANAGER,
        Role.ADMIN
      ]
    },
    {
      to: '/review',
      icon: FileCheck,
      label: 'Sale Review',
      roles: [Role.UBE_JAPAN, Role.SALE, Role.SALE_MANAGER, Role.ADMIN]
    },
    {
      to: '/mgr-approve',
      icon: BadgeCheck,
      label: 'Mgr Approve',
      roles: [Role.SALE_MANAGER, Role.ADMIN]
    },
    { to: '/cs', icon: Truck, label: 'CS Hub', roles: [Role.CS, Role.ADMIN] },
    {
      to: '/master-data',
      icon: Settings,
      label: 'Configuration',
      roles: [Role.ADMIN]
    },
    {
      to: '/admin',
      icon: UserCog,
      label: 'User Management',
      roles: [Role.ADMIN]
    },
    {
      to: '/logs',
      icon: ClipboardList,
      label: 'System Logs',
      roles: [Role.ADMIN]
    },
    {
      to: '/clear-data',
      icon: Database,
      label: 'Clear Data',
      roles: [Role.ADMIN]
    }
  ].filter((item) => item.roles.includes(currentUser.role));

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <aside
        className={`${collapsed ? 'w-16' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-30`}
      >
        <div className="p-4 flex items-center justify-between h-16">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
                <Command size={18} />
              </div>
              <span className="font-bold text-lg tracking-tight dark:text-white flex gap-1">
                UBE
                <span className="text-indigo-600 dark:text-indigo-400">
                  CUSTOMER
                </span>
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 ui-radius-control text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {!collapsed && (
              <span className="text-sm font-medium">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 ui-radius-control text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
          >
            <LogOut size={18} />
            {!collapsed && (
              <span className="text-sm font-medium">Sign Out</span>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 text-xs">
            <Link
              to="/"
              className="font-medium text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Portal
            </Link>
            {getBreadcrumbs().map((bc, i) => (
              <React.Fragment key={bc.href}>
                <ChevronRight size={12} className="text-slate-300" />
                <Link
                  to={bc.href}
                  className={`font-semibold ${i === getBreadcrumbs().length - 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {bc.label}
                </Link>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-right">
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {currentUser.username}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <UserIcon size={16} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
