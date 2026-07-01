// Mock data for gOGig-style OOH campaign management platform

export const currentUsers = {
  admin: { id: 'u1', name: 'Deepak Bansal', email: 'admin@gogig.in', role: 'admin', avatar: 'DB' },
  agency: { id: 'u2', name: 'Saurav Mehta', email: 'saurav@brightads.in', role: 'agency', avatar: 'SM', agencyName: 'BrightAds Media' },
  supervisor: { id: 'u3', name: 'Kritika Rao', email: 'kritika@brightads.in', role: 'supervisor', avatar: 'KR' },
  field: { id: 'u4', name: 'Ramesh Kumar', email: 'ramesh@field.in', role: 'field', avatar: 'RK' },
};

export const agencies = [
  { id: 'a1', name: 'BrightAds Media', head: 'Saurav Mehta', email: 'saurav@brightads.in', phone: '+91 98450 12345', city: 'Bengaluru', campaigns: 24, activeUsers: 45, status: 'active', plan: 'Enterprise', revenue: 1245000, joinedAt: '2024-08-12' },
  { id: 'a2', name: 'Metro Outdoor', head: 'Anita Sharma', email: 'anita@metroout.in', phone: '+91 99870 34521', city: 'Mumbai', campaigns: 18, activeUsers: 32, status: 'active', plan: 'Enterprise', revenue: 980000, joinedAt: '2024-06-05' },
  { id: 'a3', name: 'UrbanReach', head: 'Rahul Kapoor', email: 'rahul@urbanreach.co', phone: '+91 90123 44567', city: 'Delhi', campaigns: 12, activeUsers: 21, status: 'active', plan: 'Growth', revenue: 542000, joinedAt: '2024-11-01' },
  { id: 'a4', name: 'Southern Signal', head: 'Meera Iyer', email: 'meera@southernsig.in', phone: '+91 98844 22110', city: 'Chennai', campaigns: 8, activeUsers: 14, status: 'active', plan: 'Growth', revenue: 320000, joinedAt: '2025-01-18' },
  { id: 'a5', name: 'Northlight Media', head: 'Arjun Singh', email: 'arjun@northlight.in', phone: '+91 87654 33221', city: 'Jaipur', campaigns: 5, activeUsers: 9, status: 'trial', plan: 'Free', revenue: 0, joinedAt: '2025-06-20' },
  { id: 'a6', name: 'Coastal Outdoor', head: 'Priya Nair', email: 'priya@coastalout.in', phone: '+91 90876 12309', city: 'Kochi', campaigns: 3, activeUsers: 7, status: 'inactive', plan: 'Growth', revenue: 120000, joinedAt: '2024-04-11' },
];

export const brands = [
  { id: 'b1', name: 'NoBroker', category: 'Real Estate', logo: '🏡', campaigns: 6, spend: 850000 },
  { id: 'b2', name: 'Zepto', category: 'Q-Commerce', logo: '⚡', campaigns: 4, spend: 620000 },
  { id: 'b3', name: 'Rapido', category: 'Mobility', logo: '🛥️', campaigns: 5, spend: 540000 },
  { id: 'b4', name: 'BigBasket', category: 'Grocery', logo: '🛒', campaigns: 3, spend: 410000 },
  { id: 'b5', name: 'Cars24', category: 'Automotive', logo: '🚗', campaigns: 2, spend: 280000 },
  { id: 'b6', name: 'JK Cement', category: 'Building Material', logo: '🏗️', campaigns: 4, spend: 490000 },
];

export const mediaTypes = [
  { key: 'auto', label: 'Auto Branding', category: 'Transit' },
  { key: 'bus', label: 'Bus Branding', category: 'Transit' },
  { key: 'cab', label: 'Cab Branding', category: 'Transit' },
  { key: 'metro', label: 'Metro Branding', category: 'Transit' },
  { key: 'train', label: 'Train Branding', category: 'Transit' },
  { key: 'billboard', label: 'Billboard / Hoarding', category: 'Outdoor' },
  { key: 'wall', label: 'Wall Painting', category: 'Outdoor' },
  { key: 'pole', label: 'Pole Board', category: 'Outdoor' },
  { key: 'mall', label: 'Mall Branding', category: 'Outdoor' },
  { key: 'shop', label: 'Shop Name Board', category: 'Community' },
  { key: 'society', label: 'Society Branding', category: 'Community' },
  { key: 'retail', label: 'Retail Activation', category: 'Retail' },
];

export const campaigns = [
  { id: 'c1', title: 'NoBroker Auto Blitz Q3', brand: 'NoBroker', brandId: 'b1', agency: 'BrightAds Media', agencyId: 'a1', mediaType: 'Auto Branding', city: 'Bengaluru', totalTasks: 1500, completed: 653, flagged: 8, status: 'ongoing', startDate: '2025-06-15', endDate: '2025-08-30', budget: 750000, spent: 320000 },
  { id: 'c2', title: 'Zepto Dark Store Wraps', brand: 'Zepto', brandId: 'b2', agency: 'BrightAds Media', agencyId: 'a1', mediaType: 'Wall Painting', city: 'Mumbai', totalTasks: 400, completed: 380, flagged: 2, status: 'ongoing', startDate: '2025-06-01', endDate: '2025-07-15', budget: 420000, spent: 395000 },
  { id: 'c3', title: 'Rapido Rider Bike Wrap', brand: 'Rapido', brandId: 'b3', agency: 'Metro Outdoor', agencyId: 'a2', mediaType: 'Auto Branding', city: 'Hyderabad', totalTasks: 900, completed: 900, flagged: 4, status: 'completed', startDate: '2025-04-10', endDate: '2025-06-20', budget: 540000, spent: 540000 },
  { id: 'c4', title: 'BigBasket Delivery Van Blitz', brand: 'BigBasket', brandId: 'b4', agency: 'UrbanReach', agencyId: 'a3', mediaType: 'Cab Branding', city: 'Delhi', totalTasks: 300, completed: 210, flagged: 1, status: 'ongoing', startDate: '2025-07-01', endDate: '2025-08-15', budget: 300000, spent: 180000 },
  { id: 'c5', title: 'JK Cement Dealer Boards', brand: 'JK Cement', brandId: 'b6', agency: 'Southern Signal', agencyId: 'a4', mediaType: 'Shop Name Board', city: 'Chennai', totalTasks: 200, completed: 145, flagged: 3, status: 'ongoing', startDate: '2025-05-20', endDate: '2025-08-01', budget: 220000, spent: 160000 },
  { id: 'c6', title: 'Cars24 Metro Panels', brand: 'Cars24', brandId: 'b5', agency: 'Metro Outdoor', agencyId: 'a2', mediaType: 'Metro Branding', city: 'Delhi', totalTasks: 60, completed: 58, flagged: 0, status: 'ongoing', startDate: '2025-06-25', endDate: '2025-07-25', budget: 180000, spent: 172000 },
];

export const tasks = Array.from({ length: 40 }).map((_, i) => {
  const cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune'];
  const types = ['Auto Branding', 'Bus Branding', 'Wall Painting', 'Billboard', 'Shop Board'];
  const statuses = ['pending', 'in_progress', 'submitted', 'approved', 'flagged'];
  const executives = ['Ramesh Kumar', 'Suresh Patel', 'Vikram Singh', 'Manoj Yadav', 'Deepika Rao'];
  const status = statuses[i % statuses.length];
  return {
    id: `t${i + 1}`,
    taskCode: `TK-2025-${(4800 + i).toString()}`,
    campaignId: `c${(i % 6) + 1}`,
    unitCode: `A-${(i + 10).toString().padStart(3, '0')}`,
    city: cities[i % cities.length],
    mediaType: types[i % types.length],
    status,
    assignedTo: executives[i % executives.length],
    lat: (12.9 + (i % 10) * 0.02).toFixed(6),
    lng: (77.5 + (i % 10) * 0.02).toFixed(6),
    address: `${['NH-48', 'MG Road', 'HSR Layout', 'Koramangala', 'Whitefield'][i % 5]}, Sector ${i + 1}`,
    submittedAt: status === 'pending' ? null : `2025-07-${((i % 20) + 1).toString().padStart(2, '0')} ${(9 + (i % 8))}:${((i * 7) % 60).toString().padStart(2, '0')} AM`,
    photos: status === 'pending' ? 0 : 3,
    flagReason: status === 'flagged' ? ['Duplicate photo detected', 'GPS mismatch >200m', 'Photo quality low'][i % 3] : null,
  };
});

export const fraudAlerts = [
  { id: 'f1', taskCode: 'TK-2025-4821', type: 'Duplicate Photo', severity: 'high', agency: 'UrbanReach', executive: 'Manoj Yadav', description: 'Same image detected across 3 different locations', detectedAt: '2h ago' },
  { id: 'f2', taskCode: 'TK-2025-4809', type: 'GPS Mismatch', severity: 'medium', agency: 'BrightAds Media', executive: 'Suresh Patel', description: 'Location 340m away from assigned coordinates', detectedAt: '5h ago' },
  { id: 'f3', taskCode: 'TK-2025-4802', type: 'Backdated Upload', severity: 'high', agency: 'Coastal Outdoor', executive: 'Ravi Menon', description: 'Photo EXIF timestamp doesn\'t match submission time', detectedAt: '1d ago' },
  { id: 'f4', taskCode: 'TK-2025-4798', type: 'Low Photo Quality', severity: 'low', agency: 'Metro Outdoor', executive: 'Deepika Rao', description: 'Image blur detected, unable to verify installation', detectedAt: '1d ago' },
  { id: 'f5', taskCode: 'TK-2025-4785', type: 'Reused QR Code', severity: 'high', agency: 'Northlight Media', executive: 'Vikram Singh', description: 'QR code already scanned at different unit', detectedAt: '2d ago' },
];

export const fieldExecutives = [
  { id: 'fe1', name: 'Ramesh Kumar', phone: '+91 98123 45671', city: 'Bengaluru', supervisor: 'Kritika Rao', tasksDone: 128, tasksToday: 6, avgQuality: 94, status: 'active' },
  { id: 'fe2', name: 'Suresh Patel', phone: '+91 98123 45672', city: 'Mumbai', supervisor: 'Kundan Verma', tasksDone: 96, tasksToday: 4, avgQuality: 89, status: 'active' },
  { id: 'fe3', name: 'Vikram Singh', phone: '+91 98123 45673', city: 'Delhi', supervisor: 'Chandra Prasad', tasksDone: 145, tasksToday: 8, avgQuality: 92, status: 'active' },
  { id: 'fe4', name: 'Manoj Yadav', phone: '+91 98123 45674', city: 'Delhi', supervisor: 'Chandra Prasad', tasksDone: 42, tasksToday: 2, avgQuality: 71, status: 'flagged' },
  { id: 'fe5', name: 'Deepika Rao', phone: '+91 98123 45675', city: 'Hyderabad', supervisor: 'Kritika Rao', tasksDone: 111, tasksToday: 5, avgQuality: 96, status: 'active' },
  { id: 'fe6', name: 'Ravi Menon', phone: '+91 98123 45676', city: 'Kochi', supervisor: 'Suja Pillai', tasksDone: 78, tasksToday: 3, avgQuality: 85, status: 'active' },
];

export const supervisors = [
  { id: 's1', name: 'Kritika Rao', email: 'kritika@brightads.in', city: 'Bengaluru', teamSize: 12, campaigns: 4 },
  { id: 's2', name: 'Kundan Verma', email: 'kundan@brightads.in', city: 'Mumbai', teamSize: 9, campaigns: 3 },
  { id: 's3', name: 'Chandra Prasad', email: 'chandra@brightads.in', city: 'Delhi', teamSize: 11, campaigns: 4 },
];

export const monthlyStats = [
  { month: 'Feb', campaigns: 42, tasks: 4200, revenue: 720000 },
  { month: 'Mar', campaigns: 51, tasks: 5100, revenue: 890000 },
  { month: 'Apr', campaigns: 48, tasks: 5600, revenue: 940000 },
  { month: 'May', campaigns: 62, tasks: 7200, revenue: 1120000 },
  { month: 'Jun', campaigns: 70, tasks: 8400, revenue: 1340000 },
  { month: 'Jul', campaigns: 78, tasks: 9800, revenue: 1520000 },
];

export const cityStats = [
  { city: 'Bengaluru', tasks: 3200, completion: 87 },
  { city: 'Mumbai', tasks: 2800, completion: 92 },
  { city: 'Delhi', tasks: 2400, completion: 78 },
  { city: 'Chennai', tasks: 1600, completion: 84 },
  { city: 'Hyderabad', tasks: 1200, completion: 91 },
  { city: 'Pune', tasks: 900, completion: 88 },
  { city: 'Kolkata', tasks: 700, completion: 76 },
  { city: 'Ahmedabad', tasks: 550, completion: 82 },
];

export const plans = [
  { key: 'free', name: 'Free', price: 0, campaigns: 1, users: 5, description: 'For your first campaign' },
  { key: 'growth', name: 'Growth', price: 29999, campaigns: 10, users: 25, description: 'Growing agencies' },
  { key: 'enterprise', name: 'Enterprise', price: 99999, campaigns: 'Unlimited', users: 'Unlimited', description: 'Multi-brand at scale' },
];

export const notifications = [
  { id: 'n1', title: 'New fraud alert', description: 'Duplicate photo detected in UrbanReach', time: '2m ago', type: 'alert' },
  { id: 'n2', title: 'Campaign completed', description: 'Rapido Rider Bike Wrap reached 100%', time: '1h ago', type: 'success' },
  { id: 'n3', title: 'Agency signed up', description: 'Northlight Media joined on Free plan', time: '3h ago', type: 'info' },
  { id: 'n4', title: 'Report generated', description: 'Monthly report for Zepto ready', time: '5h ago', type: 'info' },
];

// WhatsApp bot flow messages
export const whatsappBotSteps = {
  welcome: [
    { from: 'bot', type: 'text', text: 'Namaste 👋 Welcome to *gOGig Field App*' },
    { from: 'bot', type: 'text', text: 'I\'m your task assistant. What would you like to do today?' },
    { from: 'bot', type: 'menu', options: ['📋 My Tasks Today', '📍 Check-In', '❓ Help & FAQs'] },
  ],
};

export const fieldTasksForBot = [
  { code: 'TK-2025-4829', unit: 'A-04', mediaType: 'Auto Branding', city: 'Bengaluru', address: 'NH-48, Peenya, Bengaluru', status: 'pending', deadline: 'Today 6:00 PM' },
  { code: 'TK-2025-4830', unit: 'A-05', mediaType: 'Auto Branding', city: 'Bengaluru', address: 'HSR Layout Sector 2, Bengaluru', status: 'pending', deadline: 'Today 6:00 PM' },
  { code: 'TK-2025-4831', unit: 'A-06', mediaType: 'Shop Board', city: 'Bengaluru', address: 'Koramangala 5th Block, Bengaluru', status: 'pending', deadline: 'Today 8:00 PM' },
];
