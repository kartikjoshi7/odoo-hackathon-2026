import React, { useState } from 'react';
import api from '../utils/api';
import { Lock, Mail, Shield, AlertTriangle } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const presets = [
    { email: 'manager@transitops.com', label: 'Fleet Manager', desc: 'Manage assets, scheduling & full ops.' },
    { email: 'driver@transitops.com', label: 'Driver', desc: 'Simulate driver trips and fuel logs.' },
    { email: 'safety@transitops.com', label: 'Safety Officer', desc: 'Audit driver scoring & license validation.' },
    { email: 'analyst@transitops.com', label: 'Financial Analyst', desc: 'Track ROI, expenses & cost analysis.' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const loginRes = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      localStorage.setItem('transitops_token', loginRes.data.access_token);
      
      const meRes = await api.get('/auth/me');
      localStorage.setItem('transitops_active_user', JSON.stringify(meRes.data));
      
      onLoginSuccess(meRes.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        // Show exact error from backend (e.g., "Incorrect email or password")
        setError(err.response.data.detail);
      } else {
        setError('Network Error: Unable to connect to the backend server.');
      }
    }
  };

  const handlePresetClick = (presetEmail) => {
    setEmail(presetEmail);
    setPassword('password');
    setError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <div className="auth-brand-logo">
          <svg className="logo-icon-svg" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
            <defs>
              <linearGradient id="odooGradAuth" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#714B67" />
                <stop offset="100%" stopColor="#a24b89" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#odooGradAuth)" />
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
          <span className="auth-brand-text">TransitOps</span>
        </div>
        
        <div className="auth-sidebar-body">
          <h2 className="auth-tagline">
            Smart <span>Transport Operations</span> Platform
          </h2>
          <p className="auth-description">
            A centralized system to streamline vehicle registries, driver safety, cargo dispatches, maintenance logs, and financial ROI tracking. Empowering teams from dispatch to analysis.
          </p>
        </div>
        
        <div className="auth-sidebar-footer">
          &copy; 2026 TransitOps Inc. All rights reserved. Powered by Odoo.
        </div>
      </div>
      
      <div className="auth-form-container">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to access your TransitOps control room</p>
          </div>
          
          <form onSubmit={handleLogin}>
            {error && (
              <div className="alert-banner alert-banner-danger" style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px' }}>
                <span className="flex-row-center"><AlertTriangle size={16} /> {error}</span>
              </div>
            )}
            
            <div className="auth-input-group">
              <label htmlFor="email">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@transitops.com"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            
            <div className="auth-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <button 
                  type="button" 
                  onClick={() => alert('For the Odoo Hackathon 2026, password resets are disabled. Please contact your Fleet Manager or use the preset demo accounts.')} 
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            
            <button type="submit" className="auth-btn-submit" style={{ marginTop: '8px' }}>
              Sign In
            </button>
          </form>
          
          <div className="auth-preset-label">Quick Sign-In Presets</div>
          <div className="auth-preset-grid">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="auth-preset-btn"
                onClick={() => handlePresetClick(p.email)}
              >
                <div className="auth-preset-title">
                  <Shield size={12} style={{ color: 'var(--accent-primary)' }} />
                  {p.label}
                </div>
                <div className="auth-preset-desc">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
