import React, { useState, useEffect } from 'react';
import { db } from './utils/db';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Vehicles from './components/Vehicles';
import Drivers from './components/Drivers';
import Trips from './components/Trips';
import Maintenance from './components/Maintenance';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import Settings from './components/Settings';

import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Navigation, 
  Wrench, 
  DollarSign, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  Sun, 
  Moon,
  ShieldAlert
} from 'lucide-react';

import './App.css';

export default function App() {
  // Database Initializer
  useEffect(() => {
    db.init();
  }, []);

  // Theme & Auth States
  const [activeUser, setActiveUser] = useState(() => db.getActiveUser());
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [lightMode, setLightMode] = useState(false);

  // Sync state data with localStorage to trigger instant updates across components
  const [vehicles, setVehicles] = useState(() => db.getVehicles());
  const [drivers, setDrivers] = useState(() => db.getDrivers());
  const [trips, setTrips] = useState(() => db.getTrips());
  const [maintenance, setMaintenance] = useState(() => db.getMaintenance());
  const [fuelLogs, setFuelLogs] = useState(() => db.getFuelLogs());
  const [expenses, setExpenses] = useState(() => db.getExpenses());
  const [permissions, setPermissions] = useState(() => db.getPermissions());

  // Reload states when db is altered
  const refreshStateData = () => {
    setVehicles(db.getVehicles());
    setDrivers(db.getDrivers());
    setTrips(db.getTrips());
    setMaintenance(db.getMaintenance());
    setFuelLogs(db.getFuelLogs());
    setExpenses(db.getExpenses());
    setPermissions(db.getPermissions());
  };

  // Sync database functions
  const handleUpdateVehicles = (list) => {
    db.saveVehicles(list);
    setVehicles(list);
  };

  const handleUpdateDrivers = (list) => {
    db.saveDrivers(list);
    setDrivers(list);
  };

  const handleUpdateTrips = (list) => {
    db.saveTrips(list);
    setTrips(list);
  };

  const handleUpdateMaintenance = (list) => {
    db.saveMaintenance(list);
    setMaintenance(list);
  };

  const handleUpdatePermissions = (perms) => {
    db.savePermissions(perms);
    setPermissions(perms);
  };

  const handleAddFuelLog = (log) => {
    const list = [...fuelLogs, log];
    db.saveFuelLogs(list);
    setFuelLogs(list);
  };

  const handleAddExpense = (expense) => {
    const list = [...expenses, expense];
    db.saveExpenses(list);
    setExpenses(list);
  };

  const handleResetDatabase = () => {
    db.reset();
  };

  // Toggle Theme Class on Body
  useEffect(() => {
    if (lightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [lightMode]);

  // Auth Callbacks
  const handleLoginSuccess = (user) => {
    setActiveUser(user);
    // Find first permitted tab
    const rolePerms = permissions[user.role] || {};
    const firstTab = Object.keys(rolePerms).find(key => rolePerms[key]) || 'dashboard';
    setCurrentTab(firstTab);
  };

  const handleLogout = () => {
    db.logout();
    setActiveUser(null);
  };

  // Render Login page if not authenticated
  if (!activeUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // Check role-based permission for current tab
  const rolePerms = permissions[activeUser.role] || {};
  const hasAccessToTab = rolePerms[currentTab];

  // Tab definitions
  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'vehicles', label: 'Vehicle Registry', icon: <Truck size={18} /> },
    { key: 'drivers', label: 'Drivers & Safety', icon: <Users size={18} /> },
    { key: 'trips', label: 'Trip Dispatcher', icon: <Navigation size={18} /> },
    { key: 'maintenance', label: 'Maintenance', icon: <Wrench size={18} /> },
    { key: 'expenses', label: 'Fuel & Expenses', icon: <DollarSign size={18} /> },
    { key: 'reports', label: 'Reports & Analytics', icon: <BarChart3 size={18} /> },
    { key: 'settings', label: 'Settings & RBAC', icon: <SettingsIcon size={18} /> }
  ];

  // Helper title renderer
  const getTabTitle = () => {
    const t = tabs.find(tb => tb.key === currentTab);
    return t ? t.label : 'Operations';
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg className="logo-icon-svg" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
            <defs>
              <linearGradient id="odooGradApp" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#714B67" />
                <stop offset="100%" stopColor="#a24b89" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#odooGradApp)" />
            <rect x="5" y="8" width="13" height="10" rx="1.5" fill="white" />
            <path d="M19 11h5.5l2.5 3v4a1 1 0 0 1-1 1h-7v-8z M21 12.5h3.2l1.3 1.8H21v-1.8z" fill="white" fillRule="evenodd" />
            <circle cx="10" cy="19.5" r="3" fill="#111827" stroke="white" strokeWidth="1.5" />
            <circle cx="21" cy="19.5" r="3" fill="#111827" stroke="white" strokeWidth="1.5" />
            <circle cx="10" cy="19.5" r="1" fill="white" />
            <circle cx="21" cy="19.5" r="1" fill="white" />
            <rect x="1" y="10" width="3" height="1.5" rx="0.75" fill="white" opacity="0.6" />
            <rect x="0.5" y="13" width="3.5" height="1.5" rx="0.75" fill="white" opacity="0.8" />
            <rect x="2" y="16" width="2" height="1.5" rx="0.75" fill="white" opacity="0.4" />
          </svg>
          <span className="logo-text">TransitOps</span>
        </div>

        <nav className="sidebar-menu">
          {tabs.map((tab) => {
            const hasPerm = rolePerms[tab.key];
            if (!hasPerm) return null; // Hide tabs user doesn't have access to

            return (
              <button
                key={tab.key}
                onClick={() => setCurrentTab(tab.key)}
                className={`menu-item ${currentTab === tab.key ? 'active' : ''}`}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {activeUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="user-info">
              <span className="username">{activeUser.name}</span>
              <span className="user-role">{activeUser.role.replace('_', ' ')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button 
              onClick={() => setLightMode(!lightMode)} 
              className="theme-toggle-btn"
              style={{ flex: 1 }}
              title="Toggle Light/Dark Theme"
            >
              {lightMode ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button 
              onClick={handleLogout} 
              className="theme-toggle-btn"
              style={{ flex: 1, color: 'var(--status-retired)' }}
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="header">
          <div className="header-left">
            <h2 className="page-title" style={{ margin: 0 }}>{getTabTitle()}</h2>
          </div>
          <div className="header-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Role Privilege:</span>
              <span style={{ 
                color: 'var(--accent-primary)', 
                fontWeight: '600', 
                backgroundColor: 'rgba(245,158,11,0.1)', 
                padding: '2px 8px', 
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontSize: '10px'
              }}>
                {activeUser.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </header>

        <main className="content-container">
          {/* Render target tab with Access Denied check */}
          {!hasAccessToTab ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 40px', 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)' 
            }}>
              <ShieldAlert size={64} style={{ color: 'var(--status-retired)', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Privilege Level Insufficient</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '8px auto 0' }}>
                Your current role (<strong>{activeUser.role.replace('_', ' ')}</strong>) is restricted from viewing the <strong>{getTabTitle()}</strong> tab. Contact your Fleet Manager to modify settings privileges.
              </p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <Dashboard 
                  vehicles={vehicles} 
                  drivers={drivers} 
                  trips={trips} 
                  maintenance={maintenance} 
                />
              )}
              {currentTab === 'vehicles' && (
                <Vehicles 
                  vehicles={vehicles} 
                  onUpdateVehicles={handleUpdateVehicles} 
                  userRole={activeUser.role} 
                />
              )}
              {currentTab === 'drivers' && (
                <Drivers 
                  drivers={drivers} 
                  onUpdateDrivers={handleUpdateDrivers} 
                  userRole={activeUser.role} 
                />
              )}
              {currentTab === 'trips' && (
                <Trips 
                  trips={trips}
                  vehicles={vehicles}
                  drivers={drivers}
                  onUpdateTrips={handleUpdateTrips}
                  onUpdateVehicles={handleUpdateVehicles}
                  onUpdateDrivers={handleUpdateDrivers}
                  onAddFuelLog={handleAddFuelLog}
                  userRole={activeUser.role}
                />
              )}
              {currentTab === 'maintenance' && (
                <Maintenance 
                  maintenance={maintenance}
                  vehicles={vehicles}
                  onUpdateMaintenance={handleUpdateMaintenance}
                  onUpdateVehicles={handleUpdateVehicles}
                  onAddExpense={handleAddExpense}
                  userRole={activeUser.role}
                />
              )}
              {currentTab === 'expenses' && (
                <Expenses 
                  fuelLogs={fuelLogs}
                  expenses={expenses}
                  vehicles={vehicles}
                  maintenance={maintenance}
                  onAddFuelLog={handleAddFuelLog}
                  onAddExpense={handleAddExpense}
                  userRole={activeUser.role}
                />
              )}
              {currentTab === 'reports' && (
                <Reports 
                  vehicles={vehicles}
                  trips={trips}
                  fuelLogs={fuelLogs}
                  maintenance={maintenance}
                  expenses={expenses}
                />
              )}
              {currentTab === 'settings' && (
                <Settings 
                  permissions={permissions}
                  onUpdatePermissions={handleUpdatePermissions}
                  onResetDatabase={handleResetDatabase}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
