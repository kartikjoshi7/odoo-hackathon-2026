// TransitOps Simulated Database with LocalStorage persistence

const SEED_USERS = [
  { email: 'manager@transitops.com', password: 'password', name: 'Frank Miller', role: 'fleet_manager' },
  { email: 'driver@transitops.com', password: 'password', name: 'Alex Rider', role: 'driver' },
  { email: 'safety@transitops.com', password: 'password', name: 'Sarah Connor', role: 'safety_officer' },
  { email: 'analyst@transitops.com', password: 'password', name: 'Fiona Gallagher', role: 'financial_analyst' }
];

const SEED_VEHICLES = [
  { regNum: 'TRK-01', name: 'Volvo FH16 Heavy', type: 'Truck', maxLoad: 12000, odometer: 42100, acquisitionCost: 115000, status: 'Available', region: 'North' },
  { regNum: 'VAN-02', name: 'Ford Transit Cargo', type: 'Van', maxLoad: 1800, odometer: 18450, acquisitionCost: 38000, status: 'On Trip', region: 'South' },
  { regNum: 'EV-03', name: 'Rivian EDV 700', type: 'EV Van', maxLoad: 1200, odometer: 8900, acquisitionCost: 72000, status: 'In Shop', region: 'East' },
  { regNum: 'TRK-04', name: 'Scania R500 Hauler', type: 'Truck', maxLoad: 15000, odometer: 85200, acquisitionCost: 135000, status: 'Available', region: 'West' }
];

const SEED_DRIVERS = [
  { name: 'John Doe', licenseNum: 'DL-98315A', licenseCategory: 'Class A CDL', licenseExpiry: '2027-10-15', contactNum: '555-0192', safetyScore: 94, status: 'Available' },
  { name: 'Jane Smith', licenseNum: 'DL-56294B', licenseCategory: 'Class B CDL', licenseExpiry: '2026-12-04', contactNum: '555-0143', safetyScore: 98, status: 'On Trip' },
  { name: 'Bob Johnson', licenseNum: 'DL-12345C', licenseCategory: 'Class C Standard', licenseExpiry: '2025-05-10', contactNum: '555-0111', safetyScore: 82, status: 'Available' }, // Expired license!
  { name: 'Alice Brown', licenseNum: 'DL-88771D', licenseCategory: 'Class A CDL', licenseExpiry: '2027-02-18', contactNum: '555-0177', safetyScore: 58, status: 'Suspended' } // Suspended!
];

const SEED_TRIPS = [
  {
    id: 'TRIP-1001',
    source: 'Chicago Hub',
    destination: 'Detroit Depot',
    vehicleReg: 'VAN-02',
    driverName: 'Jane Smith',
    cargoWeight: 1500,
    plannedDistance: 450,
    status: 'Dispatched',
    startDate: '2026-07-11',
    finalOdometer: null,
    fuelConsumed: null,
    revenue: 1350 // cargoWeight * plannedDistance * 0.002
  },
  {
    id: 'TRIP-1002',
    source: 'Boston Port',
    destination: 'New York Warehouse',
    vehicleReg: 'TRK-01',
    driverName: 'John Doe',
    cargoWeight: 10000,
    plannedDistance: 350,
    status: 'Completed',
    startDate: '2026-07-09',
    endDate: '2026-07-10',
    finalOdometer: 42100,
    fuelConsumed: 120,
    revenue: 7000
  }
];

const SEED_MAINTENANCE = [
  { id: 'MNT-2001', vehicleReg: 'EV-03', type: 'Battery Diagnostics', cost: 650, date: '2026-07-10', status: 'Active', notes: 'Scheduled check on cell balance.' },
  { id: 'MNT-2002', vehicleReg: 'TRK-01', type: 'Engine Oil Change', cost: 120, date: '2026-06-15', status: 'Closed', notes: 'Routine 10k mile maintenance.' }
];

const SEED_FUEL_LOGS = [
  { id: 'FUEL-3001', vehicleReg: 'TRK-01', liters: 120, cost: 180, date: '2026-07-10' },
  { id: 'FUEL-3002', vehicleReg: 'VAN-02', liters: 50, cost: 75, date: '2026-07-11' }
];

const SEED_EXPENSES = [
  { id: 'EXP-4001', vehicleReg: 'TRK-01', category: 'Toll', cost: 65, date: '2026-07-10' },
  { id: 'EXP-4002', vehicleReg: 'VAN-02', category: 'Cleaning', cost: 25, date: '2026-07-11' }
];

const SEED_PERMISSIONS = {
  fleet_manager: {
    dashboard: true,
    vehicles: true,
    drivers: true,
    trips: true,
    maintenance: true,
    expenses: true,
    reports: true,
    settings: true
  },
  driver: {
    dashboard: true,
    vehicles: false,
    drivers: false,
    trips: true, // Drivers can manage/view trips assigned to them, or create drafts
    maintenance: false,
    expenses: true, // Drivers can log fuel
    reports: false,
    settings: false
  },
  safety_officer: {
    dashboard: true,
    vehicles: true, // View only / audit
    drivers: true, // High access to drivers (licensing)
    trips: true,
    maintenance: true,
    expenses: false,
    reports: true,
    settings: false
  },
  financial_analyst: {
    dashboard: true,
    vehicles: true, // View acquisition costs
    drivers: false,
    trips: true, // View distance/cargo for metrics
    maintenance: true, // Verify maintenance costs
    expenses: true, // Full expense log tracking
    reports: true, // Needs full access to reports & ROI
    settings: false
  }
};

// LocalStorage helpers
const getStorageItem = (key, defaultValue) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setStorageItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const db = {
  init() {
    if (!localStorage.getItem('transitops_initialized')) {
      setStorageItem('transitops_users', SEED_USERS);
      setStorageItem('transitops_vehicles', SEED_VEHICLES);
      setStorageItem('transitops_drivers', SEED_DRIVERS);
      setStorageItem('transitops_trips', SEED_TRIPS);
      setStorageItem('transitops_maintenance', SEED_MAINTENANCE);
      setStorageItem('transitops_fuel_logs', SEED_FUEL_LOGS);
      setStorageItem('transitops_expenses', SEED_EXPENSES);
      setStorageItem('transitops_permissions', SEED_PERMISSIONS);
      localStorage.setItem('transitops_initialized', 'true');
    }
  },

  reset() {
    localStorage.removeItem('transitops_initialized');
    this.init();
    window.location.reload();
  },

  // Auth Operations
  login(email, password) {
    const users = getStorageItem('transitops_users', SEED_USERS);
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (foundUser) {
      setStorageItem('transitops_active_user', foundUser);
      return foundUser;
    }
    return null;
  },

  logout() {
    localStorage.removeItem('transitops_active_user');
  },

  getActiveUser() {
    return getStorageItem('transitops_active_user', null);
  },

  // Vehicles CRUD
  getVehicles() {
    return getStorageItem('transitops_vehicles', []);
  },

  saveVehicles(vehicles) {
    setStorageItem('transitops_vehicles', vehicles);
  },

  // Drivers CRUD
  getDrivers() {
    return getStorageItem('transitops_drivers', []);
  },

  saveDrivers(drivers) {
    setStorageItem('transitops_drivers', drivers);
  },

  // Trips CRUD
  getTrips() {
    return getStorageItem('transitops_trips', []);
  },

  saveTrips(trips) {
    setStorageItem('transitops_trips', trips);
  },

  // Maintenance CRUD
  getMaintenance() {
    return getStorageItem('transitops_maintenance', []);
  },

  saveMaintenance(maintenance) {
    setStorageItem('transitops_maintenance', maintenance);
  },

  // Fuel Logs CRUD
  getFuelLogs() {
    return getStorageItem('transitops_fuel_logs', []);
  },

  saveFuelLogs(logs) {
    setStorageItem('transitops_fuel_logs', logs);
  },

  // Other Expenses CRUD
  getExpenses() {
    return getStorageItem('transitops_expenses', []);
  },

  saveExpenses(expenses) {
    setStorageItem('transitops_expenses', expenses);
  },

  // Role Permissions matrix
  getPermissions() {
    return getStorageItem('transitops_permissions', SEED_PERMISSIONS);
  },

  savePermissions(perms) {
    setStorageItem('transitops_permissions', perms);
  },

  // Calculation Metrics
  getOperationalCost(regNum) {
    const fuelLogs = this.getFuelLogs().filter(f => f.vehicleReg === regNum);
    const maintenance = this.getMaintenance().filter(m => m.vehicleReg === regNum);
    const otherExpenses = this.getExpenses().filter(e => e.vehicleReg === regNum);

    const totalFuel = fuelLogs.reduce((sum, f) => sum + Number(f.cost), 0);
    const totalMnt = maintenance.reduce((sum, m) => sum + Number(m.cost), 0);
    const totalOther = otherExpenses.reduce((sum, e) => sum + Number(e.cost), 0);

    return totalFuel + totalMnt + totalOther;
  },

  getFuelEfficiency(regNum) {
    const fuelLogs = this.getFuelLogs().filter(f => f.vehicleReg === regNum);
    const completedTrips = this.getTrips().filter(t => t.vehicleReg === regNum && t.status === 'Completed');

    const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + Number(f.liters), 0);
    const totalDistance = completedTrips.reduce((sum, t) => sum + Number(t.plannedDistance), 0);

    if (totalFuelLiters === 0) return 0;
    return (totalDistance / totalFuelLiters).toFixed(2);
  },

  getVehicleRevenue(regNum) {
    const completedTrips = this.getTrips().filter(t => t.vehicleReg === regNum && t.status === 'Completed');
    return completedTrips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
  },

  getVehicleROI(regNum) {
    const vehicle = this.getVehicles().find(v => v.regNum === regNum);
    if (!vehicle || !vehicle.acquisitionCost) return 0;

    const opCost = this.getOperationalCost(regNum);
    const revenue = this.getVehicleRevenue(regNum);

    const roi = ((revenue - opCost) / vehicle.acquisitionCost) * 100;
    return roi.toFixed(1);
  },

  getFleetUtilization() {
    const vehicles = this.getVehicles();
    if (vehicles.length === 0) return 0;
    
    // Vehicles considered utilized if status is 'On Trip'
    const utilized = vehicles.filter(v => v.status === 'On Trip').length;
    return Math.round((utilized / vehicles.length) * 100);
  }
};
