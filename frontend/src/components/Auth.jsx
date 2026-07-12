import React, { useState } from 'react';
import { db } from '../utils/db';
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

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const user = db.login(email, password);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('Invalid email or password. Use password: "password"');
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
          <div className="logo-icon">T</div>
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
                />
              </div>
            </div>
            
            <div className="auth-input-group">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
