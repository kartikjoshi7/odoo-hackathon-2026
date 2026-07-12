import React, { useState, useEffect } from 'react';
import api from './utils/api';
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
  const [activeUser, setActiveUser] = useState(() => {
    const saved = localStorage.getItem('transitops_active_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [lightMode, setLightMode] = useState(false);

  // Live Data States
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [permissions, setPermissions] = useState({
    fleet_manager: { dashboard: true, vehicles: true, drivers: true, trips: true, maintenance: true, expenses: true, reports: true, settings: true },
    driver: { dashboard: true, vehicles: false, drivers: false, trips: true, maintenance: false, expenses: true, reports: false, settings: false },
    safety_officer: { dashboard: true, vehicles: true, drivers: true, trips: true, maintenance: true, expenses: false, reports: true, settings: false },
    financial_analyst: { dashboard: true, vehicles: true, drivers: false, trips: true, maintenance: true, expenses: true, reports: true, settings: false }
  });

  const refreshStateData = async () => {
    if (!activeUser) return;
    try {
      const [vRes, dRes, tRes] = await Promise.all([
        api.get('/vehicles?limit=1000'),
        api.get('/drivers?limit=1000'),
        api.get('/trips/active') // or /trips?limit=1000
      ]);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
      setTrips(tRes.data);
    } catch (err) {
      console.error("Failed to fetch live data", err);
    }
  };

  useEffect(() => {
    refreshStateData();
    const ws = new WebSocket('ws://127.0.0.1:8000/api/v1/ws/dashboard');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "REFRESH_DATA") {
        refreshStateData();
      }
    };
    return () => ws.close();
  }, [activeUser]);

  useEffect(() => {
    if (lightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [lightMode]);

  const handleLoginSuccess = (user) => {
    setActiveUser(user);
    const normalizedRole = user.role.toLowerCase().replace(' ', '_');
    const rolePerms = permissions[normalizedRole] || {};
    const firstTab = Object.keys(rolePerms).find(key => rolePerms[key]) || 'dashboard';
    setCurrentTab(firstTab);
  };

  const handleLogout = () => {
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_active_user');
    setActiveUser(null);
  };

  if (!activeUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  const normalizedRole = activeUser.role.toLowerCase().replace(' ', '_');
  const rolePerms = permissions[normalizedRole] || {};
  const hasAccessToTab = rolePerms[currentTab];

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

  const getTabTitle = () => {
    const t = tabs.find(tb => tb.key === currentTab);
    return t ? t.label : 'Operations';
  };

  // We pass empty functions to components that still use the onUpdate pattern 
  // because the WebSocket will trigger the state refresh automatically!
  const noop = () => {};

  return (
    <div className="app-container">
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
            if (!rolePerms[tab.key]) return null;
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
            <button onClick={() => setLightMode(!lightMode)} className="theme-toggle-btn" style={{ flex: 1 }}>
              {lightMode ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button onClick={handleLogout} className="theme-toggle-btn" style={{ flex: 1, color: 'var(--status-retired)' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-wrapper">
        <header className="header">
          <div className="header-left">
            <h2 className="page-title" style={{ margin: 0 }}>{getTabTitle()}</h2>
          </div>
          <div className="header-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Role Privilege:</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: '600', backgroundColor: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontSize: '10px' }}>
                {activeUser.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </header>
        <main className="content-container">
          {!hasAccessToTab ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <ShieldAlert size={64} style={{ color: 'var(--status-retired)', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Privilege Level Insufficient</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '8px auto 0' }}>
                Your current role (<strong>{activeUser.role.replace('_', ' ')}</strong>) is restricted from viewing the <strong>{getTabTitle()}</strong> tab. Contact your Fleet Manager to modify settings privileges.
              </p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && <Dashboard vehicles={vehicles} drivers={drivers} trips={trips} maintenance={maintenance} />}
              {currentTab === 'vehicles' && <Vehicles vehicles={vehicles} onUpdateVehicles={noop} userRole={normalizedRole} />}
              {currentTab === 'drivers' && <Drivers drivers={drivers} onUpdateDrivers={noop} userRole={normalizedRole} />}
              {currentTab === 'trips' && <Trips trips={trips} vehicles={vehicles} drivers={drivers} onUpdateTrips={noop} onUpdateVehicles={noop} onUpdateDrivers={noop} onAddFuelLog={noop} userRole={normalizedRole} />}
              {currentTab === 'maintenance' && <Maintenance maintenance={maintenance} vehicles={vehicles} onUpdateMaintenance={noop} onUpdateVehicles={noop} onAddExpense={noop} userRole={normalizedRole} />}
              {currentTab === 'expenses' && <Expenses fuelLogs={fuelLogs} expenses={expenses} vehicles={vehicles} maintenance={maintenance} onAddFuelLog={noop} onAddExpense={noop} userRole={normalizedRole} />}
              {currentTab === 'reports' && <Reports vehicles={vehicles} trips={trips} fuelLogs={fuelLogs} maintenance={maintenance} expenses={expenses} />}
              {currentTab === 'settings' && <Settings permissions={permissions} onUpdatePermissions={noop} onResetDatabase={noop} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
