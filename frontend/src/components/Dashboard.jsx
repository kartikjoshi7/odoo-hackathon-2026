import React, { useState } from 'react';
import { Truck, Wrench, UserCheck, Navigation, Percent, MapPin, Layers, AlertCircle, Calendar } from 'lucide-react';

export default function Dashboard({ vehicles, drivers, trips, maintenance }) {
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchesType = selectedType === 'All' || v.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || v.status === selectedStatus;
    const matchesRegion = selectedRegion === 'All' || v.region === selectedRegion;
    return matchesType && matchesStatus && matchesRegion;
  });

  // Calculate filtered KPIs
  const totalVehiclesCount = filteredVehicles.length;
  const activeVehicles = filteredVehicles.filter(v => v.status !== 'Retired').length;
  const availableVehicles = filteredVehicles.filter(v => v.status === 'Available').length;
  const inMaintenance = filteredVehicles.filter(v => v.status === 'In Shop').length;
  
  // Fleet Utilization based on filtered set
  const onTripVehicles = filteredVehicles.filter(v => v.status === 'On Trip').length;
  const utilization = totalVehiclesCount > 0 ? Math.round((onTripVehicles / totalVehiclesCount) * 100) : 0;

  // Trips KPIs
  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTripsCount = trips.filter(t => t.status === 'Draft').length;

  // Drivers KPIs
  const driversOnDuty = drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;

  // Safety & Compliance alerts
  const today = new Date();
  const criticalAlerts = [];

  drivers.forEach(d => {
    const expiryDate = new Date(d.licenseExpiry);
    if (expiryDate < today) {
      criticalAlerts.push({
        type: 'danger',
        message: `Driver license expired for ${d.name} (${d.licenseNum}). Expiry: ${d.licenseExpiry}.`,
        action: 'Suspend driver or renew license.'
      });
    } else if (d.safetyScore < 70) {
      criticalAlerts.push({
        type: 'warning',
        message: `Low Safety Score Alert: ${d.name} has a score of ${d.safetyScore}/100.`,
        action: 'Review telemetry log or require retraining.'
      });
    }
  });

  // Unique types, statuses, regions for filters
  const uniqueTypes = ['All', ...new Set(vehicles.map(v => v.type))];
  const uniqueStatuses = ['All', ...new Set(vehicles.map(v => v.status))];
  const uniqueRegions = ['All', ...new Set(vehicles.map(v => v.region).filter(Boolean))];

  return (
    <div>
      {/* Alert Center */}
      {criticalAlerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', color: 'var(--text-secondary)' }}>
            System Alerts & Compliance Warnings
          </h3>
          {criticalAlerts.map((alert, idx) => (
            <div 
              key={idx} 
              className={`alert-banner ${alert.type === 'danger' ? 'alert-banner-danger' : 'alert-banner-warning'}`}
              style={{ padding: '12px 18px', borderRadius: '8px', marginBottom: '8px' }}
            >
              <div className="flex-row-center" style={{ gap: '10px' }}>
                <AlertCircle size={18} />
                <div>
                  <strong>{alert.message}</strong>
                  <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>Action Required: {alert.action}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Controls & Filters */}
      <div className="controls-card">
        <div className="filters-group">
          <div className="flex-row-center" style={{ gap: '8px' }}>
            <Layers size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)} 
              className="select-filter"
            >
              <option disabled>Vehicle Type</option>
              {uniqueTypes.map((t, idx) => (
                <option key={idx} value={t}>{t === 'All' ? 'All Vehicle Types' : t}</option>
              ))}
            </select>
          </div>

          <div className="flex-row-center" style={{ gap: '8px' }}>
            <Wrench size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)} 
              className="select-filter"
            >
              <option disabled>Status</option>
              {uniqueStatuses.map((s, idx) => (
                <option key={idx} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
              ))}
            </select>
          </div>

          <div className="flex-row-center" style={{ gap: '8px' }}>
            <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)} 
              className="select-filter"
            >
              <option disabled>Region</option>
              {uniqueRegions.map((r, idx) => (
                <option key={idx} value={r}>{r === 'All' ? 'All Regions' : r}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Showing KPIs for <strong>{totalVehiclesCount}</strong> of <strong>{vehicles.length}</strong> registered assets.
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        <div className="kpi-card kpi-purple">
          <div className="kpi-content">
            <span className="kpi-value">{activeVehicles}</span>
            <span className="kpi-title">Active Vehicles</span>
          </div>
          <div className="kpi-icon-wrapper">
            <Truck size={24} />
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-content">
            <span className="kpi-value">{availableVehicles}</span>
            <span className="kpi-title">Available Vehicles</span>
          </div>
          <div className="kpi-icon-wrapper">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-content">
            <span className="kpi-value">{inMaintenance}</span>
            <span className="kpi-title">In Shop (Maintenance)</span>
          </div>
          <div className="kpi-icon-wrapper">
            <Wrench size={24} />
          </div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-content">
            <span className="kpi-value">{activeTripsCount}</span>
            <span className="kpi-title">Active Dispatches</span>
          </div>
          <div className="kpi-icon-wrapper">
            <Navigation size={24} />
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-content">
            <span className="kpi-value">{pendingTripsCount}</span>
            <span className="kpi-title">Pending Trips (Draft)</span>
          </div>
          <div className="kpi-icon-wrapper">
            <Calendar size={24} />
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-content">
            <span className="kpi-value">{driversOnDuty}</span>
            <span className="kpi-title">Drivers On Duty</span>
          </div>
          <div className="kpi-icon-wrapper">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-content">
            <span className="kpi-value">{utilization}%</span>
            <span className="kpi-title">Fleet Utilization</span>
          </div>
          <div className="kpi-icon-wrapper">
            <Percent size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Active Trip Tracker & Operations Log */}
      <div className="grid-2col">
        {/* Dispatched Trips Panel */}
        <div className="table-card" style={{ marginBottom: 0 }}>
          <div className="table-header-row">
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Active Deliveries & En Route Tracking</h3>
            <span className="badge badge-ontrip"><span className="badge-dot"></span>Live Fleet</span>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Load (kg)</th>
                  <th>Distance (km)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.filter(t => t.status === 'Dispatched').length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No active dispatches on the road currently.
                    </td>
                  </tr>
                ) : (
                  trips.filter(t => t.status === 'Dispatched').map((trip, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{trip.id}</td>
                      <td>{trip.vehicleReg}</td>
                      <td>{trip.driverName}</td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{trip.source} &rarr; {trip.destination}</div>
                      </td>
                      <td>{trip.cargoWeight} kg</td>
                      <td>{trip.plannedDistance} km</td>
                      <td>
                        <span className="badge badge-ontrip"><span className="badge-dot"></span>Dispatched</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Log Snapshot */}
        <div className="table-card" style={{ marginBottom: 0 }}>
          <div className="table-header-row">
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Maintenance Work In Progress</h3>
            <span className="badge badge-inshop"><span className="badge-dot"></span>Active Shop</span>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service Type</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.filter(m => m.status === 'Active').length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No vehicles currently undergoing service.
                    </td>
                  </tr>
                ) : (
                  maintenance.filter(m => m.status === 'Active').map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600' }}>{m.vehicleReg}</td>
                      <td>{m.type}</td>
                      <td>{m.date}</td>
                      <td>
                        <span className="badge badge-inshop"><span className="badge-dot"></span>In Shop</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
