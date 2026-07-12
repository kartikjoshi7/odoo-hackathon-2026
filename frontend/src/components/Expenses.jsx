import React, { useState } from 'react';
import { Plus, Search, DollarSign, Calendar, Tag, AlertCircle, Fuel } from 'lucide-react';
import api from '../utils/api';


export default function Expenses({ fuelLogs, expenses, vehicles, maintenance, onAddFuelLog, onAddExpense, userRole }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'fuel', 'other'
  
  // Fuel form states
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelVehicle, setFuelVehicle] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [fuelError, setFuelError] = useState('');

  // Other expense form states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expVehicle, setExpVehicle] = useState('');
  const [expCategory, setExpCategory] = useState('Toll');
  const [expCost, setExpCost] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');
  const [expError, setExpError] = useState('');

  const canEdit = userRole === 'fleet_manager' || userRole === 'financial_analyst' || userRole === 'driver';

  // Cost calculation utilities
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + Number(f.cost), 0);
  const totalMaintenanceCost = maintenance.filter(m => m.status === 'Closed').reduce((sum, m) => sum + Number(m.cost), 0);
  const totalOtherCost = expenses.reduce((sum, e) => sum + Number(e.cost), 0);
  const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalOtherCost;

  const handleAddFuelSubmit = (e) => {
    e.preventDefault();
    setFuelError('');

    if (!fuelVehicle || !fuelLiters || !fuelCost || !fuelDate) {
      setFuelError('All fields are required.');
      return;
    }

    const litersNum = Number(fuelLiters);
    const costNum = Number(fuelCost);

    if (isNaN(litersNum) || litersNum <= 0) {
      setFuelError('Liters must be a positive number.');
      return;
    }
    if (isNaN(costNum) || costNum <= 0) {
      setFuelError('Cost must be a positive number.');
      return;
    }

    const vehicle = vehicles.find(v => (v.registration_number || v.reg_num || v.regNum) === fuelVehicle);

    const payload = {
      vehicle_id: vehicle.id,
      liters: litersNum,
      cost: costNum,
      date: fuelDate
    };

    const formatError = (errorObj, fallback) => {
      if (!errorObj.response?.data?.detail) return fallback;
      const detail = errorObj.response.data.detail;
      return Array.isArray(detail) ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ') : String(detail);
    };

    api.post('/financials/fuel', payload)
      .then(() => setIsFuelModalOpen(false))
      .catch(e => setFuelError(formatError(e, 'Failed to record fuel log')));
  };

  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    setExpError('');

    if (!expVehicle || !expCategory || !expCost || !expDate) {
      setExpError('Please fill in all required fields.');
      return;
    }

    const costNum = Number(expCost);
    if (isNaN(costNum) || costNum <= 0) {
      setExpError('Cost must be a positive number.');
      return;
    }

    const vehicle = vehicles.find(v => (v.registration_number || v.reg_num || v.regNum) === expVehicle);

    // Map frontend categories to backend ExpenseTypeEnum
    let expenseType = 'Other';
    if (expCategory === 'Toll') expenseType = 'Toll';
    if (expCategory === 'Tax') expenseType = 'Tax';

    const payload = {
      vehicle_id: vehicle.id,
      type: expenseType,
      cost: costNum,
      date: expDate
    };

    const formatError = (errorObj, fallback) => {
      if (!errorObj.response?.data?.detail) return fallback;
      const detail = errorObj.response.data.detail;
      return Array.isArray(detail) ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ') : String(detail);
    };

    api.post('/financials/expense', payload)
      .then(() => setIsExpenseModalOpen(false))
      .catch(e => setExpError(formatError(e, 'Failed to record expense')));
  };

  return (
    <div>
      {/* Tab Selectors */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', gap: '8px' }}>
        <button 
          onClick={() => setActiveTab('summary')} 
          className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, border: 'none' }}
        >
          Fleet Expense Summary
        </button>
        <button 
          onClick={() => setActiveTab('fuel')} 
          className={`btn ${activeTab === 'fuel' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, border: 'none' }}
        >
          Fuel Logs
        </button>
        <button 
          onClick={() => setActiveTab('other')} 
          className={`btn ${activeTab === 'other' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, border: 'none' }}
        >
          Tolls & Other Expenses
        </button>
      </div>

      {activeTab === 'summary' && (
        <div>
          {/* Summary Cards */}
          <div className="dashboard-grid">
            <div className="kpi-card kpi-purple">
              <div className="kpi-content">
                <span className="kpi-value">${totalFuelCost.toLocaleString()}</span>
                <span className="kpi-title">Total Fuel Cost</span>
              </div>
              <div className="kpi-icon-wrapper"><Fuel size={24} /></div>
            </div>

            <div className="kpi-card kpi-amber">
              <div className="kpi-content">
                <span className="kpi-value">${totalMaintenanceCost.toLocaleString()}</span>
                <span className="kpi-title">Total Maintenance</span>
              </div>
              <div className="kpi-icon-wrapper"><DollarSign size={24} /></div>
            </div>

            <div className="kpi-card kpi-blue">
              <div className="kpi-content">
                <span className="kpi-value">${totalOtherCost.toLocaleString()}</span>
                <span className="kpi-title">Tolls & Incidental Expenses</span>
              </div>
              <div className="kpi-icon-wrapper"><Tag size={24} /></div>
            </div>

            <div className="kpi-card kpi-green">
              <div className="kpi-content">
                <span className="kpi-value">${totalOperationalCost.toLocaleString()}</span>
                <span className="kpi-title">Overall Operational Cost</span>
              </div>
              <div className="kpi-icon-wrapper"><DollarSign size={24} /></div>
            </div>
          </div>

          {/* Cost Breakdown Table per Vehicle */}
          <div className="table-card">
            <div className="table-header-row">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Cost Breakdown by Fleet Asset</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-calculated (Fuel + Maintenance + incidentals)</span>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Registration</th>
                    <th>Model / Description</th>
                    <th>Fuel Cost</th>
                    <th>Maintenance Cost</th>
                    <th>Tolls / Other</th>
                    <th style={{ fontWeight: '700' }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => {
                    const vehicleFuel = fuelLogs.filter(f => f.vehicle_id === v.id || f.vehicleReg === (v.registration_number || v.reg_num || v.regNum)).reduce((sum, f) => sum + Number(f.cost), 0);
                    const vehicleMaint = maintenance.filter(m => (m.vehicle_id === v.id || m.vehicleReg === (v.registration_number || v.reg_num || v.regNum)) && (m.status === 'Closed')).reduce((sum, m) => sum + Number(m.cost), 0);
                    const vehicleOther = expenses.filter(e => e.vehicle_id === v.id || e.vehicleReg === (v.registration_number || v.reg_num || v.regNum)).reduce((sum, e) => sum + Number(e.cost), 0);
                    const totalCost = vehicleFuel + vehicleMaint + vehicleOther;

                    return (
                      <tr key={v.id}>
                        <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{v.registration_number || v.reg_num || v.regNum}</td>
                        <td>{v.model || v.name}</td>
                        <td>${vehicleFuel.toLocaleString()}</td>
                        <td>${vehicleMaint.toLocaleString()}</td>
                        <td>${vehicleOther.toLocaleString()}</td>
                        <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>${totalCost.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fuel' && (
        <div>
          {/* Action Row */}
          <div className="controls-card">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Fuel Consumption Logs</h3>
            {canEdit && (
              <button onClick={() => setIsFuelModalOpen(true)} className="btn btn-primary">
                <Plus size={16} /> Log Fuel Purchase
              </button>
            )}
          </div>

          {/* Fuel logs table */}
          <div className="table-card">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle</th>
                    <th>Date</th>
                    <th>Volume (Liters)</th>
                    <th>Total Cost ($)</th>
                    <th>Unit Cost ($/L)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...fuelLogs].reverse().map((f, idx) => {
                    const vehicleReg = vehicles.find(v => v.id === f.vehicle_id)?.reg_num || f.vehicleReg || `ID: ${f.vehicle_id}`;
                    return (
                    <tr key={idx}>
                      <td style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{f.id}</td>
                      <td style={{ fontWeight: '600' }}>{vehicleReg}</td>
                      <td>{f.date}</td>
                      <td>{f.liters} L</td>
                      <td>${f.cost.toLocaleString()}</td>
                      <td>${(f.cost / f.liters).toFixed(2)}/L</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'other' && (
        <div>
          {/* Action Row */}
          <div className="controls-card">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Tolls & Incidental Expense Records</h3>
            {canEdit && (
              <button onClick={() => setIsExpenseModalOpen(true)} className="btn btn-primary">
                <Plus size={16} /> Record Incidental Expense
              </button>
            )}
          </div>

          {/* Expenses Table */}
          <div className="table-card">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Cost ($)</th>
                    <th>Date</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[...expenses].reverse().map((e, idx) => {
                    const vehicleReg = vehicles.find(v => v.id === e.vehicle_id)?.reg_num || e.vehicleReg || `ID: ${e.vehicle_id}`;
                    return (
                    <tr key={idx}>
                      <td style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{e.id}</td>
                      <td style={{ fontWeight: '600' }}>{vehicleReg}</td>
                      <td>
                        <span className="badge badge-draft" style={{ fontSize: '10px' }}>{e.type || e.category}</span>
                      </td>
                      <td style={{ fontWeight: '600' }}>${e.cost.toLocaleString()}</td>
                      <td>{e.date}</td>
                      <td>{e.notes || 'N/A'}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Log Modal */}
      {isFuelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Log Fuel Purchase</h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddFuelSubmit}>
              <div className="modal-body">
                {fuelError && (
                  <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px' }}>
                    <span className="flex-row-center"><AlertCircle size={16} /> {fuelError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label>Vehicle Registry</label>
                  <select 
                    className="form-select" 
                    value={fuelVehicle} 
                    onChange={(e) => setFuelVehicle(e.target.value)}
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.filter(v => v.status !== 'Retired').map(v => (
                      <option key={v.id} value={v.registration_number || v.reg_num || v.regNum}>{v.registration_number || v.reg_num || v.regNum} - {v.model || v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fuel Volume (Liters)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 100" 
                    value={fuelLiters}
                    onChange={(e) => setFormFuelValues(e.target.value, null)}
                  />
                </div>
                <div className="form-group">
                  <label>Total Cost ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 150" 
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Standard multiplier: ~$1.50 per Liter.
                  </span>
                </div>
                <div className="form-group">
                  <label>Date Purchased</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={fuelDate} 
                    onChange={(e) => setFormFuelValues(null, e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsFuelModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Fuel Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Record Incidentals / Toll Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddExpenseSubmit}>
              <div className="modal-body">
                {expError && (
                  <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px' }}>
                    <span className="flex-row-center"><AlertCircle size={16} /> {expError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label>Vehicle Registry</label>
                  <select 
                    className="form-select" 
                    value={expVehicle} 
                    onChange={(e) => setExpVehicle(e.target.value)}
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.filter(v => v.status !== 'Retired').map(v => (
                      <option key={v.id} value={v.registration_number || v.reg_num || v.regNum}>{v.registration_number || v.reg_num || v.regNum} - {v.model || v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Expense Category</label>
                  <select 
                    className="form-select" 
                    value={expCategory} 
                    onChange={(e) => setExpCategory(e.target.value)}
                  >
                    <option value="Toll">Road Tolls</option>
                    <option value="Cleaning">Vehicle Cleaning/Washing</option>
                    <option value="Insurance">Insurance Payments</option>
                    <option value="Tax">License Plates / Registration Tax</option>
                    <option value="Other">Other Miscellaneous</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Cost ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 45" 
                    value={expCost}
                    onChange={(e) => setExpCost(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Date Logged</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={expDate} 
                    onChange={(e) => setExpDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Notes / Explanations</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="e.g. Toll road fees on highway I-90"
                    value={expNotes}
                    onChange={(e) => setExpNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper utility to sync lit and cost estimation
  function setFormFuelValues(litVal, dateVal) {
    if (litVal !== null) {
      setFormLiters(litVal);
      setFuelCost(Math.round(Number(litVal) * 1.50) || '');
    }
    if (dateVal !== null) {
      setFuelDate(dateVal);
    }
  }

  function setFormLiters(val) {
    setFuelLiters(val);
  }
}
