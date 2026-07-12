import React, { useState } from 'react';
import { Download, FileSpreadsheet, Printer, TrendingUp, BarChart2, DollarSign, Fuel } from 'lucide-react';


export default function Reports({ vehicles, trips, fuelLogs, maintenance, expenses }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Compute metrics per vehicle
  const reportData = vehicles.map(v => {
    const fuelCost = fuelLogs.filter(f => f.vehicleReg === v.regNum).reduce((sum, f) => sum + Number(f.cost), 0);
    const maintCost = maintenance.filter(m => m.vehicleReg === v.regNum && m.status === 'Closed').reduce((sum, m) => sum + Number(m.cost), 0);
    const otherCost = expenses.filter(e => e.vehicleReg === v.regNum).reduce((sum, e) => sum + Number(e.cost), 0);
    const totalOpCost = fuelCost + maintCost + otherCost;

    const totalFuelLiters = fuelLogs.filter(f => f.vehicleReg === v.regNum).reduce((sum, f) => sum + Number(f.liters), 0);
    const completedTrips = trips.filter(t => t.vehicleReg === v.regNum && t.status === 'Completed');
    const totalDistance = completedTrips.reduce((sum, t) => sum + Number(t.plannedDistance), 0);
    const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : 0;

    const totalRevenue = completedTrips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
    const roi = v.acquisitionCost > 0 ? (((totalRevenue - totalOpCost) / v.acquisitionCost) * 100).toFixed(1) : 0;

    return {
      regNum: v.registration_number || v.regNum,
      name: v.model || v.name,
      fuelCost,
      maintCost,
      otherCost,
      totalOpCost: totalOpCost || 0,
      fuelEfficiency: Number(fuelEfficiency) || 0,
      totalRevenue: totalRevenue || 0,
      roi: Number(roi) || 0,
      acquisitionCost: v.acquisition_cost || v.acquisitionCost || 0
    };
  });

  // Export CSV functions
  const downloadCSV = (type) => {
    let headers = [];
    let rows = [];
    let filename = `transitops_${type}_report.csv`;

    if (type === 'vehicles') {
      headers = ['Registration Number', 'Model Name', 'Type', 'Max Load Capacity (kg)', 'Odometer (km)', 'Acquisition Cost ($)', 'Status', 'Total Operational Cost ($)', 'Fuel Efficiency (km/L)', 'ROI (%)'];
      rows = reportData.map(r => {
        const v = vehicles.find(vh => vh.regNum === r.regNum);
        return [
          r.regNum,
          r.name,
          v?.type || '',
          v?.max_load_capacity || v?.maxLoad || 0,
          v?.odometer || 0,
          r.acquisitionCost || 0,
          v?.status || '',
          r.totalOpCost || 0,
          r.fuelEfficiency || 0,
          r.roi || 0
        ];
      });
    } else if (type === 'trips') {
      headers = ['Trip ID', 'Source', 'Destination', 'Vehicle Registry', 'Driver Assigned', 'Cargo Weight (kg)', 'Distance (km)', 'Status', 'Revenue ($)', 'Date Scheduled'];
      rows = trips.map(t => [
        t.id,
        t.source,
        t.destination,
        t.vehicleReg,
        t.driverName,
        t.cargoWeight,
        t.plannedDistance,
        t.status,
        t.revenue || 0,
        t.startDate
      ]);
    } else if (type === 'maintenance') {
      headers = ['Log ID', 'Vehicle', 'Service Type', 'Date Logged', 'Actual Cost ($)', 'Status', 'Notes'];
      rows = maintenance.map(m => [
        m.id,
        m.vehicleReg,
        m.type,
        m.date,
        m.cost,
        m.status,
        m.notes || ''
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper values for SVG charts
  const maxEfficiency = Math.max(...reportData.map(d => d.fuelEfficiency), 5);
  const maxOpCost = Math.max(...reportData.map(d => d.totalOpCost), 1000);
  const maxROI = Math.max(...reportData.map(d => Math.abs(d.roi)), 10);

  return (
    <div>
      {/* Action Row */}
      <div className="controls-card">
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Fleet Analytical Reporting Desk</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => downloadCSV('vehicles')} className="btn btn-secondary flex-row-center">
            <FileSpreadsheet size={16} /> Export Vehicles CSV
          </button>
          <button onClick={() => downloadCSV('trips')} className="btn btn-secondary flex-row-center">
            <Download size={16} /> Export Trips CSV
          </button>
          <button onClick={handlePrint} className="btn btn-primary flex-row-center">
            <Printer size={16} /> Print Report / Save PDF
          </button>
        </div>
      </div>

      {/* SVG Analytics Charts Section */}
      <div className="grid-2col" style={{ marginBottom: '24px' }}>
        {/* Fuel Efficiency Chart */}
        <div className="chart-container">
          <div className="chart-title-group">
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Fuel size={16} style={{ color: 'var(--status-available)' }} /> Fuel Efficiency Rating (km / Liter)
            </h4>
            <span className="chart-subtitle">Calculated by: Completed distance / Fuel logged</span>
          </div>

          <div className="svg-chart-wrapper">
            <svg className="svg-chart">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="95%" y2="20" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="100" x2="95%" y2="100" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="180" x2="95%" y2="180" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="200" x2="95%" y2="200" stroke="var(--text-muted)" strokeWidth="1" />

              {/* Axis Label */}
              <text x="15" y="25" fill="var(--text-muted)" fontSize="10" textAnchor="middle">{(maxEfficiency).toFixed(0)}</text>
              <text x="15" y="105" fill="var(--text-muted)" fontSize="10" textAnchor="middle">{(maxEfficiency / 2).toFixed(0)}</text>
              <text x="15" y="204" fill="var(--text-muted)" fontSize="10" textAnchor="middle">0</text>

              {/* Bars */}
              {reportData.map((d, idx) => {
                const totalBars = reportData.length;
                const barSpacing = 80;
                const startX = 60 + idx * barSpacing;
                const barWidth = 40;
                const barHeight = d.fuelEfficiency > 0 ? (d.fuelEfficiency / maxEfficiency) * 180 : 2;
                const startY = 200 - barHeight;

                return (
                  <g key={d.regNum}
                     onMouseEnter={() => setHoveredBar({ type: 'efficiency', index: idx, label: `${d.regNum}: ${d.fuelEfficiency} km/L` })}
                     onMouseLeave={() => setHoveredBar(null)}>
                    <rect 
                      x={startX} 
                      y={startY} 
                      width={barWidth} 
                      height={barHeight} 
                      rx="4"
                      fill={hoveredBar?.type === 'efficiency' && hoveredBar.index === idx ? 'var(--status-available)' : 'rgba(16, 185, 129, 0.4)'}
                      stroke="var(--status-available)"
                      strokeWidth="1.5"
                      style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                    />
                    <text x={startX + barWidth / 2} y="220" fill="var(--text-secondary)" fontSize="10" textAnchor="middle" fontWeight="600">{d.regNum}</text>
                  </g>
                );
              })}
            </svg>
            {hoveredBar?.type === 'efficiency' && (
              <div className="chart-tooltip" style={{ display: 'block', bottom: '60px', left: `${60 + hoveredBar.index * 80}px` }}>
                {hoveredBar.label}
              </div>
            )}
          </div>
        </div>

        {/* Operational Cost Chart */}
        <div className="chart-container">
          <div className="chart-title-group">
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} style={{ color: 'var(--status-inshop)' }} /> Combined Operational Cost ($)
            </h4>
            <span className="chart-subtitle">Calculated by: Fuel logs + Completed Maintenance + Incidentals</span>
          </div>

          <div className="svg-chart-wrapper">
            <svg className="svg-chart">
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="95%" y2="20" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
              <line x1="50" y1="100" x2="95%" y2="100" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
              <line x1="50" y1="180" x2="95%" y2="180" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
              <line x1="50" y1="200" x2="95%" y2="200" stroke="var(--text-muted)" strokeWidth="1" />

              {/* Axis Label */}
              <text x="20" y="25" fill="var(--text-muted)" fontSize="9" textAnchor="middle">${maxOpCost.toLocaleString()}</text>
              <text x="20" y="105" fill="var(--text-muted)" fontSize="9" textAnchor="middle">${(maxOpCost / 2).toLocaleString()}</text>
              <text x="20" y="204" fill="var(--text-muted)" fontSize="9" textAnchor="middle">$0</text>

              {/* Bars */}
              {reportData.map((d, idx) => {
                const totalBars = reportData.length;
                const barSpacing = 80;
                const startX = 70 + idx * barSpacing;
                const barWidth = 40;
                const barHeight = d.totalOpCost > 0 ? (d.totalOpCost / maxOpCost) * 180 : 2;
                const startY = 200 - barHeight;

                return (
                  <g key={d.regNum}
                     onMouseEnter={() => setHoveredBar({ type: 'cost', index: idx, label: `${d.regNum}: $${(d.totalOpCost || 0).toLocaleString()}` })}
                     onMouseLeave={() => setHoveredBar(null)}>
                    <rect 
                      x={startX} 
                      y={startY} 
                      width={barWidth} 
                      height={barHeight} 
                      rx="4"
                      fill={hoveredBar?.type === 'cost' && hoveredBar.index === idx ? 'var(--status-inshop)' : 'rgba(245, 158, 11, 0.4)'}
                      stroke="var(--status-inshop)"
                      strokeWidth="1.5"
                      style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                    />
                    <text x={startX + barWidth / 2} y="220" fill="var(--text-secondary)" fontSize="10" textAnchor="middle" fontWeight="600">{d.regNum}</text>
                  </g>
                );
              })}
            </svg>
            {hoveredBar?.type === 'cost' && (
              <div className="chart-tooltip" style={{ display: 'block', bottom: '60px', left: `${70 + hoveredBar.index * 80}px` }}>
                {hoveredBar.label}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROI & Details Analysis Table */}
      <div className="table-card" id="printable-area">
        <div className="table-header-row">
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} /> Asset Return on Investment (ROI) Details
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Formula: [(Revenue - Operational Costs) / Acquisition Cost] * 100
          </span>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Model Name</th>
                <th>Acquisition Cost</th>
                <th>Revenue Generated</th>
                <th>Operating Expenses</th>
                <th style={{ fontWeight: '700' }}>Simulated ROI (%)</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((r) => {
                const isPositiveROI = r.roi >= 0;

                return (
                  <tr key={r.regNum}>
                    <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{r.regNum}</td>
                    <td>{r.name}</td>
                    <td>${(r.acquisitionCost || 0).toLocaleString()}</td>
                    <td className="text-success">${(r.totalRevenue || 0).toLocaleString()}</td>
                    <td className="text-danger">${(r.totalOpCost || 0).toLocaleString()}</td>
                    <td style={{ 
                      fontWeight: '700', 
                      color: isPositiveROI ? 'var(--status-available)' : 'var(--status-retired)' 
                    }}>
                      {isPositiveROI ? '+' : ''}{r.roi}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
