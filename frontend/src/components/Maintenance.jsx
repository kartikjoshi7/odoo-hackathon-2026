import React, { useState } from 'react';
import { Plus, Check, X, AlertTriangle, Hammer, Wrench } from 'lucide-react';
import api from '../utils/api';

export default function Maintenance({ maintenance, vehicles, onUpdateMaintenance, onUpdateVehicles, onAddExpense, userRole }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [serviceType, setServiceType] = useState('Oil Change');
  const [customServiceType, setCustomServiceType] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  // Close Maintenance Modal States
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closingLog, setClosingLog] = useState(null);
  const [finalCost, setFinalCost] = useState('');
  const [closeError, setCloseError] = useState('');

  const canEdit = userRole === 'fleet_manager' || userRole === 'safety_officer';

  // Filter vehicles that can go into maintenance (anything except already retired or in shop)
  const eligibleVehicles = vehicles.filter(v => v.status !== 'Retired');

  const openAddModal = () => {
    setSelectedVehicle('');
    setServiceType('Oil Change');
    setCustomServiceType('');
    setEstimatedCost('');
    setNotes('');
    setValidationError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleScheduleMaintenance = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedVehicle || (serviceType === 'Other' && !customServiceType) || !estimatedCost) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    const costNum = Number(estimatedCost);
    if (isNaN(costNum) || costNum <= 0) {
      setValidationError('Estimated cost must be a positive number.');
      return;
    }

    const finalServiceType = serviceType === 'Other' ? customServiceType.trim() : serviceType;

    const vehicle = vehicles.find(v => (v.registration_number || v.reg_num || v.regNum) === selectedVehicle);

    const payload = {
      vehicle_id: vehicle.id,
      description: finalServiceType,
      cost: costNum,
      start_date: new Date().toISOString().split('T')[0],
      status: 'Open'
    };

    const formatError = (errorObj) => {
      if (!errorObj.response?.data?.detail) return 'Failed to schedule maintenance';
      const detail = errorObj.response.data.detail;
      return Array.isArray(detail) ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ') : String(detail);
    };

    api.post('/maintenance/', payload)
      .then(() => closeModal())
      .catch(e => setValidationError(formatError(e)));
  };

  const openCloseModal = (log) => {
    setClosingLog(log);
    setFinalCost(log.cost);
    setCloseError('');
    setIsCloseModalOpen(true);
  };

  const closeCloseModal = () => {
    setIsCloseModalOpen(false);
  };

  const handleResolveMaintenance = (e) => {
    e.preventDefault();
    setCloseError('');

    if (!finalCost) {
      setCloseError('Please record the final cost.');
      return;
    }

    const costNum = Number(finalCost);
    if (isNaN(costNum) || costNum <= 0) {
      setCloseError('Final cost must be a positive number.');
      return;
    }

    const vehicle = vehicles.find(v => v.id === closingLog.vehicle_id);

    api.put(`/maintenance/${closingLog.id}/close?final_cost=${costNum}`)
      .then(() => {
        // Record as operational expense automatically
        api.post('/financials/expense', {
          vehicle_id: vehicle.id,
          type: 'Other',
          cost: costNum,
          date: new Date().toISOString().split('T')[0]
        }).catch(e => console.error("Failed to log expense", e));
        
        closeCloseModal();
      })
      .catch(e => setCloseError(e.response?.data?.detail || 'Failed to close maintenance'));
  };

  return (
    <div>
      {/* Header and Action Panel */}
      <div className="controls-card">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Active Workshop & Maintenance Logs</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Schedule inspections or resolve open work orders to return vehicles to the active dispatch pool.
          </span>
        </div>
        {canEdit && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} /> Schedule Maintenance
          </button>
        )}
      </div>

      {/* Maintenance Logs Table */}
      <div className="table-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Vehicle</th>
                <th>Service Details</th>
                <th>Date Logged</th>
                <th>Estimated/Final Cost</th>
                <th>Status</th>
                {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {maintenance.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                [...maintenance].reverse().map((log) => {
                  const vehicleReg = vehicles.find(v => v.id === log.vehicle_id)?.reg_num || log.vehicleReg || log.vehicle_id;
                  const logStatus = log.status === 'Open' || log.status === 'Active' ? 'Active' : 'Closed';
                  
                  return (
                  <tr key={log.id}>
                    <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{log.id}</td>
                    <td style={{ fontWeight: '600' }}>{vehicleReg}</td>
                    <td>
                      <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Hammer size={12} style={{ color: 'var(--text-muted)' }} />
                        {log.description || log.type}
                      </div>
                      {log.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{log.notes}</div>}
                    </td>
                    <td>{log.start_date || log.date}</td>
                    <td style={{ fontWeight: '600', color: logStatus === 'Closed' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      ${log.cost.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge badge-${logStatus === 'Active' ? 'inshop' : 'available'}`}>
                        <span className="badge-dot"></span>
                        {logStatus === 'Active' ? 'In Shop' : 'Closed'}
                      </span>
                    </td>
                    {canEdit && (
                      <td style={{ textAlign: 'right' }}>
                        {logStatus === 'Active' ? (
                          <button onClick={() => openCloseModal(log)} className="btn btn-success btn-sm">
                            <Check size={12} /> Resolve Order
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed</span>
                        )}
                      </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Schedule Vehicle Maintenance</h3>
              <button onClick={closeModal} className="modal-close"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleScheduleMaintenance}>
              <div className="modal-body">
                {validationError && (
                  <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px', padding: '10px 14px' }}>
                    <span className="flex-row-center"><AlertTriangle size={16} /> {validationError}</span>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="vehicle">Select Fleet Vehicle</label>
                  <select 
                    id="vehicle"
                    className="form-select"
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {eligibleVehicles.map(v => (
                      <option key={v.id} value={v.registration_number || v.reg_num || v.regNum}>
                        {v.registration_number || v.reg_num || v.regNum} - {v.model || v.name} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="serviceType">Service Type</label>
                  <select 
                    id="serviceType"
                    className="form-select"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    <option value="Oil Change">Oil Change</option>
                    <option value="Tire Rotation">Tire Rotation / Replacement</option>
                    <option value="Brake System Repair">Brake System Repair</option>
                    <option value="Engine Tuning">Engine Tuning / Diagnostics</option>
                    <option value="Electrical System check">Electrical System Check</option>
                    <option value="Other">Other (Specify below)</option>
                  </select>
                </div>

                {serviceType === 'Other' && (
                  <div className="form-group">
                    <label htmlFor="customType">Specify Service Type</label>
                    <input 
                      id="customType"
                      type="text" 
                      placeholder="e.g. Headlight replacement" 
                      className="form-input"
                      value={customServiceType}
                      onChange={(e) => setCustomServiceType(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="estCost">Estimated Cost ($)</label>
                  <input 
                    id="estCost"
                    type="number" 
                    placeholder="e.g. 150" 
                    className="form-input"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes / Observations</label>
                  <textarea 
                    id="notes"
                    placeholder="Describe vehicle issues or scheduled service details..." 
                    className="form-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule & Send to Shop</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Maintenance / Resolve Modal */}
      {isCloseModalOpen && closingLog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Close Maintenance Order: {closingLog.id}</h3>
              <button onClick={closeCloseModal} className="modal-close"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleResolveMaintenance}>
              <div className="modal-body">
                {closeError && (
                  <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px', padding: '10px 14px' }}>
                    <span className="flex-row-center"><AlertTriangle size={16} /> {closeError}</span>
                  </div>
                )}
                
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--border-light)', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>Service Order Details:</strong>
                  <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                    Vehicle: {vehicles.find(v => v.id === closingLog.vehicle_id)?.reg_num || closingLog.vehicleReg}<br />
                    Service: {closingLog.description || closingLog.type}<br />
                    Estimated Cost: ${closingLog.cost}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="finalCost">Record Actual Cost ($)</label>
                  <input 
                    id="finalCost"
                    type="number" 
                    placeholder="e.g. 150" 
                    className="form-input"
                    value={finalCost}
                    onChange={(e) => setFinalCost(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={closeCloseModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Resolve & Log Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
