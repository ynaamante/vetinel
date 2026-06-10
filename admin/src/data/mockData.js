export const USERS = [
  {
    email: 'owner@happypaws.com',
    password: 'owner123',
    name: 'Dr. Sarah Chen',
    role: 'Owner',
    initials: 'SC',
  },
  {
    email: 'doctor@happypaws.com',
    password: 'doctor123',
    name: 'Dr. James Park',
    role: 'Doctor',
    initials: 'JP',
  },
  {
    email: 'receptionist@happypaws.com',
    password: 'receptionist123',
    name: 'Maria Santos',
    role: 'Receptionist',
    initials: 'MS',
  },
];

export const LINE_DATA = [
  { month: 'Sep', cases: 35 },
  { month: 'Oct', cases: 48 },
  { month: 'Nov', cases: 55 },
  { month: 'Dec', cases: 67 },
  { month: 'Jan', cases: 89 },
  { month: 'Feb', cases: 102 },
  { month: 'Mar', cases: 120 },
];

export const BAR_DATA = [
  { name: 'Parvovirus',     cases: 140 },
  { name: 'Kennel Cough',   cases: 88  },
  { name: 'Distemper',      cases: 62  },
  { name: 'Giardia',        cases: 55  },
  { name: 'Leptospirosis',  cases: 44  },
];

export const ALERTS = [
  {
    name: 'Parvovirus Outbreak',
    desc: 'Cases exceeded safe threshold by 40% in East region',
    date: 'March 3, 2026',
    level: 'HIGH',
    color: '#e53e3e',
  },
  {
    name: 'Kennel Cough Spike',
    desc: 'Moderate increase detected across 3 clinics',
    date: 'March 2, 2026',
    level: 'MOD',
    color: '#f6ad55',
  },
  {
    name: 'Vaccination Coverage Drop',
    desc: 'Network coverage below herd immunity threshold',
    date: 'March 1, 2026',
    level: 'HIGH',
    color: '#e53e3e',
  },
];

export const RISK_DATA = [
  { label: 'Low Risk',      color: '#48bb78', pct: 58, cases: '245 cases' },
  { label: 'Moderate Risk', color: '#f6ad55', pct: 28, cases: '118 cases' },
  { label: 'High Risk',     color: '#e53e3e', pct: 14, cases: '59 cases'  },
];