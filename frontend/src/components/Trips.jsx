import React, { useState } from 'react';
import { Plus, Check, X, ShieldAlert, Navigation, ArrowRight, Play, Wrench } from 'lucide-react';
import api from '../utils/api';


export default function Trips({ trips, vehicles, drivers, onUpdateTrips, onUpdateVehicles, onUpdateDrivers, onAddFuelLog, userRole }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [validationError, setValidationError] = useState('');

  // Trip Completion Modal States
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(null);
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [completionError, setCompletionError] = useState('');

  const canDispatch = userRole === 'fleet_manager' || userRole === 'driver';

  // Filter available vehicles and drivers for creation
  const today = new Date();
  
  const eligibleVehicles = vehicles.filter(v => 
    v.status === 'Available' && v.status !== 'Retired' && v.status !== 'In Shop'
  );

  const eligibleDrivers = drivers.filter(d => {
    const isAvailable = d.status === 'Available';
    const isNotSuspended = d.status !== 'Suspended';
    const expiryDate = new Date(d.licenseExpiry);
    const hasValidLicense = expiryDate >= today;
    return isAvailable && isNotSuspended && hasValidLicense;
  });

  const openAddModal = () => {
    setSource('');
    setDestination('');
    setSelectedVehicle('');
    setSelectedDriver('');
    setCargoWeight('');
    setPlannedDistance('');
    setValidationError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleCreateTrip = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!source || !destination || !selectedVehicle || !selectedDriver || !cargoWeight || !plannedDistance) {
      setValidationError('All fields are required.');
      return;
    }

    const weightNum = Number(cargoWeight);
    const distNum = Number(plannedDistance);

    if (isNaN(weightNum) || weightNum <= 0) {
      setValidationError('Cargo weight must be a positive number.');
      return;
    }
    if (isNaN(distNum) || distNum <= 0) {
      setValidationError('Planned distance must be a positive number.');
      return;
    }

    // Check cargo capacity of selected vehicle
    const vehicle = vehicles.find(v => (v.registration_number || v.reg_num || v.regNum) === selectedVehicle);
    if (vehicle && weightNum > (vehicle.max_load_capacity || vehicle.max_load || vehicle.maxLoad)) {
      setValidationError(`Weight Limit Exceeded: Cargo weight (${weightNum} kg) exceeds maximum load capacity of selected vehicle ${vehicle.name}.`);
      return;
    }

    const driver = drivers.find(d => d.name === selectedDriver);
    if (driver) {
      const expiry = new Date(driver.license_expiry_date || driver.license_expiry || driver.licenseExpiry);
      if (expiry < today) {
        setValidationError(`Cannot dispatch: Selected driver ${driver.name} has an expired license.`);
        return;
      }
      if (driver.status === 'Suspended') {
        setValidationError(`Cannot dispatch: Selected driver ${driver.name} is currently suspended.`);
        return;
      }
    }

    const payload = {
      source: source.trim(),
      destination: destination.trim(),
      vehicle_id: vehicle.id,
      driver_id: driver.id,
      cargo_weight: weightNum,
      planned_distance: distNum
    };

    const formatError = (errorObj) => {
      if (!errorObj.response?.data?.detail) return 'Failed to create trip';
      const detail = errorObj.response.data.detail;
      return Array.isArray(detail) ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ') : String(detail);
    };

    api.post('/trips/', payload)
      .then(() => closeModal())
      .catch(e => setValidationError(formatError(e)));
  };

  const handleDispatchTrip = (tripId) => {
    // Legacy dispatch for drafts is removed, API POST creates DISPATCHED trips
  };

  const handleCancelTrip = (tripId) => {
    api.put(`/trips/${tripId}/cancel`)
      .catch(e => console.error("Failed to cancel trip", e));
  };

  const openCompleteModal = (trip) => {
    setCompletingTrip(trip);
    const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
    const currentOdo = vehicle ? vehicle.odometer : 0;
    setFinalOdometer(currentOdo + (trip.planned_distance || trip.plannedDistance));
    setFuelConsumed(Math.round((trip.planned_distance || trip.plannedDistance) * 0.25));
    setCompletionError('');
    setIsCompleteModalOpen(true);
  };

  const closeCompleteModal = () => {
    setIsCompleteModalOpen(false);
  };

  const handleCompleteTripSubmit = (e) => {
    e.preventDefault();
    setCompletionError('');

    if (!finalOdometer || !fuelConsumed) {
      setCompletionError('Odometer and fuel details are required.');
      return;
    }

    const odoNum = Number(finalOdometer);
    const fuelNum = Number(fuelConsumed);

    const vehicle = vehicles.find(v => v.id === completingTrip.vehicle_id);
    const currentOdo = vehicle ? vehicle.odometer : 0;

    if (isNaN(odoNum) || odoNum <= currentOdo) {
      setCompletionError(`Final Odometer must be greater than vehicle's current odometer (${currentOdo} km).`);
      return;
    }

    if (isNaN(fuelNum) || fuelNum <= 0) {
      setCompletionError('Fuel consumed must be a positive number of liters.');
      return;
    }

    const actual_distance = odoNum - currentOdo;
    api.put(`/trips/${completingTrip.id}/complete?actual_distance=${actual_distance}`)
      .then(() => {
        // Record fuel log automatically
        api.post('/financials/fuel', {
          vehicle_id: vehicle.id,
          liters: fuelNum,
          cost: Math.round(fuelNum * 1.50),
          date: new Date().toISOString().split('T')[0]
        }).catch(e => console.error("Fuel log failed", e));
        closeCompleteModal();
      })
      .catch(e => setCompletionError(e.response?.data?.detail || 'Failed to complete trip'));
  };

  return (
    <div>
      {/* Header Controls */}
      <div className="controls-card">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Active Fleet Router & Dispatcher</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Schedule deliveries and automatically coordinate driver/vehicle operational states.
          </span>
        </div>
        {canDispatch && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} /> Create Delivery Order
          </button>
        )}
      </div>

      {/* Trips Table */}
      <div className="table-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Route Details</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Cargo / Dist</th>
                <th>Status</th>
                <th>Est. Revenue</th>
                {canDispatch && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={canDispatch ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    No delivery orders created yet.
                  </td>
                </tr>
              ) : (
                [...trips].reverse().map((trip) => (
                  <tr key={trip.id}>
                    <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{trip.id}</td>
                    <td>
                      <div className="flex-row-center" style={{ gap: '8px', fontWeight: '600' }}>
                        <span>{trip.source}</span>
                        <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{trip.destination}</span>
                      </div>
                    </td>
                    <td>
                      {vehicles.find(v => v.id === trip.vehicle_id)?.reg_num || trip.vehicleReg || `ID: ${trip.vehicle_id}`}
                    </td>
                    <td>
                      {drivers.find(d => d.id === trip.driver_id)?.name || trip.driverName || `ID: ${trip.driver_id}`}
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{trip.cargo_weight || trip.cargoWeight} kg</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{trip.planned_distance || trip.plannedDistance} km</div>
                    </td>
                    <td>
                      <span className={`badge badge-${trip.status.toLowerCase()}`}>
                        <span className="badge-dot"></span>
                        {trip.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--status-available)' }}>
                      ${(trip.cargo_weight || trip.cargoWeight) * (trip.planned_distance || trip.plannedDistance) * 0.002}
                    </td>
                    {canDispatch && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          {trip.status === 'Draft' && (
                            <>
                              <button onClick={() => handleDispatchTrip(trip.id)} className="btn btn-success btn-sm">
                                <Play size={13} /> Dispatch
                              </button>
                              <button onClick={() => handleCancelTrip(trip.id)} className="btn btn-danger btn-sm">
                                Cancel
                              </button>
                            </>
                          )}
                          {trip.status === 'Dispatched' && (
                            <>
                              <button onClick={() => openCompleteModal(trip)} className="btn btn-primary btn-sm">
                                <Check size={13} /> Complete
                              </button>
                              <button onClick={() => handleCancelTrip(trip.id)} className="btn btn-secondary btn-sm">
                                Abort
                              </button>
                            </>
                          )}
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

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create Delivery Order</h3>
              <button onClick={closeModal} className="modal-close"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateTrip}>
              <div className="modal-body">
                {validationError && (
                  <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px', padding: '10px 14px' }}>
                    <span className="flex-row-center" style={{ alignItems: 'flex-start' }}>
                      <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px', marginRight: '6px' }} /> 
                      {validationError}
                    </span>
                  </div>
                )}
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="source">Source Location</label>
                    <input 
                      id="source"
                      type="text" 
                      placeholder="e.g. Chicago Hub" 
                      className="form-input"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="destination">Destination</label>
                    <input 
                      id="destination"
                      type="text" 
                      placeholder="e.g. Dallas Center" 
                      className="form-input"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="vehicle">Select Available Vehicle</label>
                    <select 
                      id="vehicle"
                      className="form-select"
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {eligibleVehicles.map(v => (
                        <option key={v.id} value={v.registration_number || v.reg_num || v.regNum}>
                          {(v.registration_number || v.reg_num || v.regNum)} - {v.model || v.name} (Cap: {v.max_load_capacity || v.max_load || v.maxLoad} kg)
                        </option>
                      ))}
                    </select>
                    {eligibleVehicles.length === 0 && (
                      <span className="validation-error"><AlertTriangle size={11} /> No vehicles available.</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="driver">Select Available Driver</label>
                    <select 
                      id="driver"
                      className="form-select"
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                    >
                      <option value="">-- Choose Driver --</option>
                      {eligibleDrivers.map(d => (
                        <option key={d.licenseNum} value={d.name}>
                          {d.name} (Safety: {d.safetyScore}/100)
                        </option>
                      ))}
                    </select>
                    {eligibleDrivers.length === 0 && (
                      <span className="validation-error"><AlertTriangle size={11} /> No drivers available.</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="cargo">Cargo Weight (kg)</label>
                    <input 
                      id="cargo"
                      type="number" 
                      placeholder="e.g. 500" 
                      className="form-input"
                      value={cargoWeight}
                      onChange={(e) => setCargoWeight(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="distance">Planned Route Distance (km)</label>
                    <input 
                      id="distance"
                      type="number" 
                      placeholder="e.g. 450" 
                      className="form-input"
                      value={plannedDistance}
                      onChange={(e) => setPlannedDistance(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {isCompleteModalOpen && completingTrip && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Close Delivery Order: {completingTrip.id}</h3>
              <button onClick={closeCompleteModal} className="modal-close"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCompleteTripSubmit}>
              <div className="modal-body">
                {completionError && (
                  <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px', padding: '10px 14px' }}>
                    <span className="flex-row-center"><ShieldAlert size={16} /> {completionError}</span>
                  </div>
                )}
                
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--border-light)', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>Trip Details:</strong>
                  <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                    Route: {completingTrip.source} &rarr; {completingTrip.destination} ({completingTrip.plannedDistance} km)<br />
                    Vehicle: {completingTrip.vehicleReg} | Driver: {completingTrip.driverName}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="finalOdo">Final Odometer Reading (km)</label>
                  <input 
                    id="finalOdo"
                    type="number" 
                    placeholder={`Must be greater than current odometer`} 
                    className="form-input"
                    value={finalOdometer}
                    onChange={(e) => setFinalOdometer(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Current vehicle odometer is: <strong>{vehicles.find(v => v.id === completingTrip.vehicle_id)?.odometer || 0} km</strong>.
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="fuelCons">Fuel Consumed (Liters)</label>
                  <input 
                    id="fuelCons"
                    type="number" 
                    placeholder="e.g. 110" 
                    className="form-input"
                    value={fuelConsumed}
                    onChange={(e) => setFuelConsumed(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={closeCompleteModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Delivery</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
