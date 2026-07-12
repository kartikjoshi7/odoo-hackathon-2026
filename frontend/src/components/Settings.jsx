import React from 'react';
import { Shield, Key, RefreshCw, AlertTriangle } from 'lucide-react';
import { db } from '../utils/db';

export default function Settings({ permissions, onUpdatePermissions, onResetDatabase }) {
  
  const roles = [
    { key: 'fleet_manager', label: 'Fleet Manager' },
    { key: 'driver', label: 'Driver' },
    { key: 'safety_officer', label: 'Safety Officer' },
    { key: 'financial_analyst', label: 'Financial Analyst' }
  ];

  const features = [
    { key: 'dashboard', label: 'Dashboard View' },
    { key: 'vehicles', label: 'Vehicle Registry & CRUD' },
    { key: 'drivers', label: 'Driver Profiles & Compliance' },
    { key: 'trips', label: 'Trip Planner & Dispatcher' },
    { key: 'maintenance', label: 'Workshop Schedule' },
    { key: 'expenses', label: 'Fuel logs & Expense records' },
    { key: 'reports', label: 'Analytical Reports & CSV' },
    { key: 'settings', label: 'System RBAC Settings' }
  ];

  const handleToggle = (roleKey, featureKey) => {
    const updatedPerms = {
      ...permissions,
      [roleKey]: {
        ...permissions[roleKey],
        [featureKey]: !permissions[roleKey][featureKey]
      }
    };
    onUpdatePermissions(updatedPerms);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the database? This will clear all changes and restore default mock data.")) {
      onResetDatabase();
    }
  };

  return (
    <div>
      <div className="grid-2col">
        {/* RBAC Permission Matrix */}
        <div className="table-card" style={{ marginBottom: 0 }}>
          <div className="table-header-row">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={18} style={{ color: 'var(--accent-primary)' }} /> Role-Based Access Control Matrix
            </h3>
          </div>
          <div className="table-container" style={{ padding: '16px' }}>
            <table className="rbac-matrix">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Feature Area</th>
                  {roles.map(r => (
                    <th key={r.key}>{r.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map(f => (
                  <tr key={f.key}>
                    <td style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-primary)' }}>{f.label}</td>
                    {roles.map(r => (
                      <td key={r.key}>
                        <input
                          type="checkbox"
                          checked={permissions[r.key]?.[f.key] || false}
                          onChange={() => handleToggle(r.key, f.key)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: 'var(--accent-primary)'
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database Control & Simulated User Guides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Simulated Login Accounts */}
          <div className="table-card" style={{ marginBottom: 0, padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={16} style={{ color: 'var(--accent-secondary)' }} /> Simulated Credentials Guide
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Use these email credentials in the login page. All passwords are <code>password</code>.
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--border-light)', borderRadius: '6px' }}>
                <strong>Fleet Manager:</strong><br />
                <code style={{ fontSize: '12px' }}>manager@transitops.com</code>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'var(--border-light)', borderRadius: '6px' }}>
                <strong>Driver:</strong><br />
                <code style={{ fontSize: '12px' }}>driver@transitops.com</code>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'var(--border-light)', borderRadius: '6px' }}>
                <strong>Safety Officer:</strong><br />
                <code style={{ fontSize: '12px' }}>safety@transitops.com</code>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'var(--border-light)', borderRadius: '6px' }}>
                <strong>Financial Analyst:</strong><br />
                <code style={{ fontSize: '12px' }}>analyst@transitops.com</code>
              </div>
            </div>
          </div>

          {/* Database Reset Action */}
          <div className="table-card" style={{ marginBottom: 0, padding: '24px', border: '1px dashed var(--status-retired)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--status-retired)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} /> Danger Zone
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Resetting local storage will clear all vehicles, drivers, active deliveries, and maintenance schedules you created and restore the original seed data.
            </p>
            <button onClick={handleReset} className="btn btn-danger flex-row-center" style={{ width: '100%' }}>
              <RefreshCw size={14} /> Clear Database & Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
