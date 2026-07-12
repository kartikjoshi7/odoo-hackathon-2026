import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function Vehicles({ vehicles, onUpdateVehicles, userRole }) {
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [sortBy, setSortBy] = useState('regNum');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formRegNum, setFormRegNum] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Truck');
  const [formMaxLoad, setFormMaxLoad] = useState('');
  const [formOdometer, setFormOdometer] = useState('');
  const [formAcquisitionCost, setFormAcquisitionCost] = useState('');
  const [formStatus, setFormStatus] = useState('Available');
  const [formRegion, setFormRegion] = useState('North');
  const [validationError, setValidationError] = useState('');

  // Check RBAC permissions: only manager and safety_officer can write/delete. analyst is read-only. driver has no access to this tab.
  const canEdit = userRole === 'fleet_manager' || userRole === 'safety_officer';

  // Modal actions
  const openAddModal = () => {
    setEditingVehicle(null);
    setFormRegNum('');
    setFormName('');
    setFormType('Truck');
    setFormMaxLoad('');
    setFormOdometer('');
    setFormAcquisitionCost('');
    setFormStatus('Available');
    setFormRegion('North');
    setValidationError('');
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormRegNum(vehicle.reg_num || vehicle.regNum);
    setFormName(vehicle.name);
    setFormType(vehicle.type);
    setFormMaxLoad(vehicle.max_load || vehicle.maxLoad);
    setFormOdometer(vehicle.odometer);
    setFormAcquisitionCost(vehicle.acquisition_cost || vehicle.acquisitionCost);
    setFormStatus(vehicle.status);
    setFormRegion(vehicle.region || 'North');
    setValidationError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formRegNum || !formName || !formMaxLoad || !formOdometer || !formAcquisitionCost) {
      setValidationError('All fields are required.');
      return;
    }

    const normalizedReg = formRegNum.trim().toUpperCase();
    const maxLoadNum = Number(formMaxLoad);
    const odometerNum = Number(formOdometer);
    const costNum = Number(formAcquisitionCost);

    if (isNaN(maxLoadNum) || maxLoadNum <= 0) return setValidationError('Maximum Load Capacity must be positive.');
    if (isNaN(odometerNum) || odometerNum < 0) return setValidationError('Odometer must be non-negative.');
    if (isNaN(costNum) || costNum <= 0) return setValidationError('Acquisition Cost must be positive.');

    const payload = {
      registration_number: normalizedReg,
      model: formName.trim(),
      type: formType,
      max_load_capacity: maxLoadNum,
      odometer: odometerNum,
      acquisition_cost: costNum,
      status: formStatus
    };

    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id || normalizedReg}`, payload);
      } else {
        await api.post('/vehicles/', payload);
      }
      closeModal();
    } catch (err) {
      let errorMsg = 'Failed to save vehicle to live database.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
        } else {
          errorMsg = String(err.response.data.detail);
        }
      }
      setValidationError(errorMsg);
    }
  };

  const handleDelete = (regNum) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${regNum}?`)) {
      const updatedList = vehicles.filter(v => v.regNum !== regNum);
      onUpdateVehicles(updatedList);
    }
  };

  // Filter and sort logic
  const filtered = vehicles
    .filter(v => {
      const regMatch = v.reg_num || v.regNum || '';
      const searchMatch = regMatch.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.name.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = typeFilter === 'All' || v.type === typeFilter;
      const statusMatch = statusFilter === 'All' || v.status === statusFilter;
      const regionMatch = regionFilter === 'All' || v.region === regionFilter;
      return searchMatch && typeMatch && statusMatch && regionMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'regNum') return (a.reg_num || a.regNum || '').localeCompare(b.reg_num || b.regNum || '');
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'maxLoad') return (b.max_load || b.maxLoad) - (a.max_load || a.maxLoad);
      if (sortBy === 'odometer') return a.odometer - b.odometer;
      if (sortBy === 'acquisitionCost') return (b.acquisition_cost || b.acquisitionCost) - (a.acquisition_cost || a.acquisitionCost);
      return 0;
    });

  const uniqueTypes = ['All', ...new Set(vehicles.map(v => v.type))];
  const uniqueStatuses = ['All', ...new Set(vehicles.map(v => v.status))];
  const uniqueRegions = ['All', ...new Set(vehicles.map(v => v.region).filter(Boolean))];

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
              placeholder="Search by model or reg number..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select 
            className="select-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {uniqueTypes.map((t, idx) => (
              <option key={idx} value={t}>{t === 'All' ? 'All Types' : t}</option>
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

          {/* Region Filter */}
          <select 
            className="select-filter"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            {uniqueRegions.map((r, idx) => (
              <option key={idx} value={r}>{r === 'All' ? 'All Regions' : r}</option>
            ))}
          </select>

          {/* Sort selection */}
          <div className="flex-row-center" style={{ gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sort By:</span>
            <select 
              className="select-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ minWidth: '120px' }}
            >
              <option value="regNum">Reg Number</option>
              <option value="name">Model Name</option>
              <option value="maxLoad">Load Capacity</option>
              <option value="odometer">Odometer (km)</option>
              <option value="acquisitionCost">Acquisition Cost</option>
            </select>
          </div>
        </div>

        {canEdit && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} /> Add Vehicle
          </button>
        )}
      </div>

      {/* Vehicles Table */}
      <div className="table-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Model / Asset Name</th>
                <th>Type</th>
                <th>Capacity (kg)</th>
                <th>Odometer (km)</th>
                <th>Acquisition Cost</th>
                <th>Region</th>
                <th>Status</th>
                {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    No vehicles found matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id || v.registration_number || v.regNum || v.reg_num}>
                    <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{v.registration_number || v.reg_num || v.regNum}</td>
                    <td style={{ fontWeight: '500' }}>{v.model || v.name}</td>
                    <td>{v.type}</td>
                    <td>{Number(v.max_load_capacity || v.max_load || v.maxLoad || 0).toLocaleString()} kg</td>
                    <td>{Number(v.odometer || 0).toLocaleString()} km</td>
                    <td>${Number(v.acquisition_cost || v.acquisitionCost || 0).toLocaleString()}</td>
                    <td>{v.region || 'North'}</td>
                    <td>
                      <span className={`badge badge-${v.status.toLowerCase().replace(' ', '')}`}>
                        <span className="badge-dot"></span>
                        {v.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button onClick={() => openEditModal(v)} className="btn btn-secondary btn-sm" title="Edit Vehicle">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(v.reg_num || v.regNum)} className="btn btn-danger btn-sm" title="Delete Vehicle">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
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
              <h3 className="modal-title">{editingVehicle ? 'Edit Fleet Asset' : 'Register New Fleet Asset'}</h3>
              <button onClick={closeModal} className="modal-close"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {validationError && (
                  <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px', padding: '10px 14px' }}>
                    <span className="flex-row-center"><AlertCircle size={16} /> {validationError}</span>
                  </div>
                )}
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="regNum">Registration Number (Unique)</label>
                    <input 
                      id="regNum"
                      type="text" 
                      placeholder="e.g. VAN-05" 
                      className="form-input"
                      value={formRegNum}
                      onChange={(e) => setFormRegNum(e.target.value)}
                      disabled={!!editingVehicle} // cannot edit regNum primary key
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="name">Vehicle Model / Description</label>
                    <input 
                      id="name"
                      type="text" 
                      placeholder="e.g. Mercedes Sprinter" 
                      className="form-input"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="type">Vehicle Type</label>
                    <select 
                      id="type"
                      className="form-select"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                    >
                      <option value="Truck">Truck</option>
                      <option value="Van">Van</option>
                      <option value="EV Van">EV Van</option>
                      <option value="Trailer">Trailer</option>
                      <option value="Sedan">Support Sedan</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="maxLoad">Load Capacity (kg)</label>
                    <input 
                      id="maxLoad"
                      type="number" 
                      placeholder="e.g. 500" 
                      className="form-input"
                      value={formMaxLoad}
                      onChange={(e) => setFormMaxLoad(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="odometer">Initial Odometer (km)</label>
                    <input 
                      id="odometer"
                      type="number" 
                      placeholder="e.g. 15000" 
                      className="form-input"
                      value={formOdometer}
                      onChange={(e) => setFormOdometer(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cost">Acquisition Cost ($)</label>
                    <input 
                      id="cost"
                      type="number" 
                      placeholder="e.g. 45000" 
                      className="form-input"
                      value={formAcquisitionCost}
                      onChange={(e) => setFormAcquisitionCost(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="region">Operational Region</label>
                    <select 
                      id="region"
                      className="form-select"
                      value={formRegion}
                      onChange={(e) => setFormRegion(e.target.value)}
                    >
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Operational Status</label>
                    <select 
                      id="status"
                      className="form-select"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      disabled={formStatus === 'On Trip'} // status transitions are automated for trips
                    >
                      <option value="Available">Available</option>
                      <option value="In Shop">In Shop (Maintenance)</option>
                      <option value="Retired">Retired</option>
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
