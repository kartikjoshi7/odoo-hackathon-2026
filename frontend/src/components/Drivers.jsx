import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Mail } from 'lucide-react';
import api from '../utils/api';

export default function Drivers({ drivers, onUpdateDrivers, userRole }) {
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [licenseFilter, setLicenseFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formName, setFormName] = useState('');
  const [formLicenseNum, setFormLicenseNum] = useState('');
  const [formLicenseCategory, setFormLicenseCategory] = useState('Class A CDL');
  const [formLicenseExpiry, setFormLicenseExpiry] = useState('');
  const [formContactNum, setFormContactNum] = useState('');
  const [formSafetyScore, setFormSafetyScore] = useState('');
  const [formStatus, setFormStatus] = useState('Available');
  const [validationError, setValidationError] = useState('');

  // Email notifications state
  const [sentReminder, setSentReminder] = useState({});

  const canEdit = userRole === 'fleet_manager' || userRole === 'safety_officer';

  // Modal actions
  const openAddModal = () => {
    setEditingDriver(null);
    setFormName('');
    setFormLicenseNum('');
    setFormLicenseCategory('Class A CDL');
    setFormLicenseExpiry('');
    setFormContactNum('');
    setFormSafetyScore(95);
    setFormStatus('Available');
    setValidationError('');
    setIsModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setFormName(driver.name);
    setFormLicenseNum(driver.license_number || driver.licenseNum);
    setFormLicenseCategory(driver.license_class || driver.licenseCategory);
    setFormLicenseExpiry(driver.license_expiry || driver.licenseExpiry);
    setFormContactNum(driver.contact_number || driver.contactNum);
    setFormSafetyScore(driver.safety_score || driver.safetyScore);
    setFormStatus(driver.status);
    setValidationError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formName || !formLicenseNum || !formLicenseExpiry || !formContactNum || formSafetyScore === '') {
      setValidationError('All fields are required.');
      return;
    }

    const scoreNum = Number(formSafetyScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setValidationError('Safety Score must be an integer between 0 and 100.');
      return;
    }

    const savedDriver = {
      name: formName.trim(),
      license_number: formLicenseNum.trim().toUpperCase(),
      license_class: formLicenseCategory,
      license_expiry: formLicenseExpiry,
      contact_number: formContactNum.trim(),
      safety_score: scoreNum,
      status: formStatus
    };

    api.post('/drivers/', savedDriver)
      .then(() => {
        closeModal();
      })
      .catch(err => {
        if (editingDriver) {
          api.put(`/drivers/${editingDriver.id || savedDriver.license_number}`, savedDriver)
            .then(() => closeModal())
            .catch(e => setValidationError(e.response?.data?.detail || 'Failed to update driver'));
        } else {
          setValidationError(err.response?.data?.detail || 'Failed to save driver');
        }
      });
  };

  const handleDelete = (licenseNum) => {
    if (window.confirm(`Are you sure you want to remove driver profile for license ${licenseNum}?`)) {
      api.delete(`/drivers/${licenseNum}`)
        .catch(e => console.error("Failed to delete driver", e));
    }
  };

  const handleSendReminder = (driver) => {
    alert(`Reminder Email Sent to ${driver.name} at simulated address: ${driver.name.toLowerCase().replace(' ', '')}@transitops.com\n\nSubject: License Renewal Requirement\nBody: Your driving license (${driver.licenseNum}) expires on ${driver.licenseExpiry}. Please upload your renewed license documentation immediately.`);
    setSentReminder(prev => ({ ...prev, [driver.licenseNum]: true }));
  };

  // Check safety/expiry classes
  const today = new Date();
  const getLicenseStatusText = (expiryStr) => {
    const expiry = new Date(expiryStr);
    if (expiry < today) return 'Expired';
    
    // Check if within 30 days
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) return 'Expiring Soon';
    return 'Valid';
  };

  // Filtering & Sorting
  const filtered = drivers
    .filter(d => {
      const searchMatch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.licenseNum.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'All' || d.status === statusFilter;
      const licenseMatch = licenseFilter === 'All' || d.licenseCategory === licenseFilter;
      return searchMatch && statusMatch && licenseMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'safetyScore') return b.safetyScore - a.safetyScore;
      if (sortBy === 'licenseExpiry') return new Date(a.licenseExpiry) - new Date(b.licenseExpiry);
      return 0;
    });

  const uniqueStatuses = ['All', ...new Set(drivers.map(d => d.status))];
  const uniqueLicenses = ['All', ...new Set(drivers.map(d => d.licenseCategory))];

  return (
    <div>
      {/* Header and Controls */}
      <div className="controls-card">
        <div className="filters-group">
          {/* Search */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by driver name or license..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* License Category Filter */}
          <select 
            className="select-filter"
            value={licenseFilter}
            onChange={(e) => setLicenseFilter(e.target.value)}
          >
            {uniqueLicenses.map((l, idx) => (
              <option key={idx} value={l}>{l === 'All' ? 'All Classes' : l}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {uniqueStatuses.map((s, idx) => (
              <option key={idx} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>

          {/* Sort Selection */}
          <div className="flex-row-center" style={{ gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sort By:</span>
            <select 
              className="select-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ minWidth: '120px' }}
            >
              <option value="name">Driver Name</option>
              <option value="safetyScore">Safety Score</option>
              <option value="licenseExpiry">License Expiry</option>
            </select>
          </div>
        </div>

        {canEdit && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} /> Add Driver
          </button>
        )}
      </div>

      {/* Drivers List Table */}
      <div className="table-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>License Details</th>
                <th>Expiration Date</th>
                <th>Contact</th>
                <th>Safety Score</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    No drivers found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const licenseNum = d.license_number || d.licenseNum;
                  const licenseCategory = d.license_class || d.licenseCategory;
                  const licenseExpiry = d.license_expiry || d.licenseExpiry;
                  const contactNum = d.contact_number || d.contactNum;
                  const safetyScore = d.safety_score || d.safetyScore;
                  const licStatus = getLicenseStatusText(licenseExpiry);
                  const isLowScore = safetyScore < 70;

                  return (
                    <tr key={licenseNum}>
                      <td>
                        <div className="flex-row-center" style={{ gap: '10px' }}>
                          <div className="avatar">{d.name.split(' ').map(n => n[0]).join('')}</div>
                          <div>
                            <div style={{ fontWeight: '600' }}>{d.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{licenseNum}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{licenseCategory}</div>
                      </td>
                      <td>
                        <div className="flex-row-center" style={{ gap: '6px' }}>
                          <span style={{ 
                            color: licStatus === 'Expired' ? 'var(--status-retired)' : 
                                   licStatus === 'Expiring Soon' ? 'var(--status-inshop)' : 'inherit',
                            fontWeight: licStatus !== 'Valid' ? '600' : 'normal'
                          }}>
                            {licenseExpiry}
                          </span>
                          {licStatus === 'Expired' && <span className="badge badge-retired" style={{ fontSize: '9px', padding: '1px 6px' }}>Expired</span>}
                          {licStatus === 'Expiring Soon' && <span className="badge badge-inshop" style={{ fontSize: '9px', padding: '1px 6px' }}>30 Days</span>}
                        </div>
                      </td>
                      <td>{contactNum}</td>
                      <td>
                        <div style={{ minWidth: '100px' }}>
                          <div className="flex-row-center" style={{ justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                            <span style={{ fontWeight: '600', color: isLowScore ? 'var(--status-retired)' : 'var(--status-available)' }}>
                              {safetyScore}/100
                            </span>
                          </div>
                          <div className="progress-track">
                            <div 
                              className={`progress-fill ${isLowScore ? 'progress-red' : safetyScore > 85 ? 'progress-green' : 'progress-amber'}`} 
                              style={{ width: `${safetyScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${d.status.toLowerCase().replace(' ', '')}`}>
                          <span className="badge-dot"></span>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          {licStatus !== 'Valid' && (
                            <button 
                              onClick={() => handleSendReminder(d)} 
                              className={`btn btn-sm ${sentReminder[licenseNum] ? 'btn-secondary' : 'btn-success'}`}
                              title="Send Email Reminder"
                            >
                              <Mail size={13} /> {sentReminder[licenseNum] ? 'Sent' : 'Remind'}
                            </button>
                          )}
                          {canEdit && (
                            <>
                              <button onClick={() => openEditModal(d)} className="btn btn-secondary btn-sm" title="Edit Profile">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={() => handleDelete(licenseNum)} className="btn btn-danger btn-sm" title="Remove Driver">
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingDriver ? 'Edit Driver Profile' : 'Register New Driver'}</h3>
              <button onClick={closeModal} className="modal-close"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {validationError && (
                  <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px', padding: '10px 14px' }}>
                    <span className="flex-row-center"><AlertTriangle size={16} /> {validationError}</span>
                  </div>
                )}
                
                <div className="form-grid">
                  <div className="form-group form-full-width">
                    <label htmlFor="name">Full Name</label>
                    <input 
                      id="name"
                      type="text" 
                      placeholder="e.g. Alex Smith" 
                      className="form-input"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="licenseNum">License Number</label>
                    <input 
                      id="licenseNum"
                      type="text" 
                      placeholder="e.g. DL-12345" 
                      className="form-input"
                      value={formLicenseNum}
                      onChange={(e) => setFormLicenseNum(e.target.value)}
                      disabled={!!editingDriver} // Primary key
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">License Category</label>
                    <select 
                      id="category"
                      className="form-select"
                      value={formLicenseCategory}
                      onChange={(e) => setFormLicenseCategory(e.target.value)}
                    >
                      <option value="Class A CDL">Class A Commercial (CDL)</option>
                      <option value="Class B CDL">Class B Commercial (CDL)</option>
                      <option value="Class C Standard">Class C Standard</option>
                      <option value="Special Operator">Special Operator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="expiry">Expiration Date</label>
                    <input 
                      id="expiry"
                      type="date" 
                      className="form-input"
                      value={formLicenseExpiry}
                      onChange={(e) => setFormLicenseExpiry(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact">Contact Number</label>
                    <input 
                      id="contact"
                      type="text" 
                      placeholder="e.g. 555-0199" 
                      className="form-input"
                      value={formContactNum}
                      onChange={(e) => setFormContactNum(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="safetyScore">Safety Score (0 - 100)</label>
                    <input 
                      id="safetyScore"
                      type="number" 
                      placeholder="e.g. 95" 
                      min="0"
                      max="100"
                      className="form-input"
                      value={formSafetyScore}
                      onChange={(e) => setFormSafetyScore(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Availability Status</label>
                    <select 
                      id="status"
                      className="form-select"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      disabled={formStatus === 'On Trip'} // status transitions are automated
                    >
                      <option value="Available">Available</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
