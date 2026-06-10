export interface Pet { id: string; name: string; species: 'dog'|'cat'|'other'; breed: string; age: number; weight: number; color: string; lastDewormingDate?: string; nextDewormingDate?: string; }
export interface Vaccination { id: string; petId: string; vaccine: string; date: string; nextDue: string; status: 'completed'|'upcoming'|'overdue'; }
export interface Symptom { id: string; petId: string; symptoms: string[]; severity: 'low'|'moderate'|'high'; description: string; date: string; riskLevel: 'low'|'moderate'|'high'; }
export interface Appointment { id: string; petId: string; petName: string; date: string; time: string; type: string; vetName: string; status: 'upcoming'|'completed'|'cancelled'; clinicId?: string; clinicName?: string; }
export interface Alert { id: string; title: string; message: string; severity: 'low'|'moderate'|'high'; date: string; read: boolean; type: 'outbreak'|'vaccination'|'appointment'|'symptom'|'deworming'; }
export interface Clinic { id: string; name: string; address: string; phone: string; email: string; distance: number; rating: number; emergencyService: boolean; specialties: string[]; hours: string; }
export interface User { id: string; name: string; email: string; phone: string; location: string; selectedClinicId?: string; createdAt: string; }
export interface HealthTip { id: string; title: string; description: string; category: 'nutrition'|'exercise'|'grooming'|'safety'|'general'; icon: string; }

export const mockPets: Pet[] = [
  { id: '1', name: 'Max', species: 'dog', breed: 'Golden Retriever', age: 3, weight: 30, color: 'Golden', lastDewormingDate: '2026-01-15', nextDewormingDate: '2026-07-15' },
  { id: '2', name: 'Luna', species: 'cat', breed: 'Persian', age: 2, weight: 4, color: 'White', lastDewormingDate: '2026-02-10', nextDewormingDate: '2026-08-10' },
];

export const mockVaccinations: Vaccination[] = [
  { id: '1', petId: '1', vaccine: 'Rabies', date: '2024-12-15', nextDue: '2025-12-15', status: 'completed' },
  { id: '2', petId: '1', vaccine: 'Parvovirus', date: '2024-11-20', nextDue: '2026-07-28', status: 'upcoming' },
  { id: '3', petId: '1', vaccine: 'Distemper', date: '2024-12-01', nextDue: '2025-12-01', status: 'completed' },
];

export const mockSymptoms: Symptom[] = [
  { id: '1', petId: '1', symptoms: ['Diarrhea', 'Weakness'], severity: 'moderate', description: 'Max has diarrhea and seems weak', date: '2026-03-18', riskLevel: 'moderate' },
];

export const mockAppointments: Appointment[] = [
  { id: '1', petId: '1', petName: 'Max', date: '2026-07-25', time: '10:00 AM', type: 'Check-up', vetName: 'Dr. Sarah Johnson', status: 'upcoming', clinicId: '1', clinicName: 'Paws & Claws Veterinary Clinic' },
  { id: '2', petId: '2', petName: 'Luna', date: '2026-07-22', time: '2:30 PM', type: 'Vaccination', vetName: 'Dr. Michael Chen', status: 'upcoming', clinicId: '2', clinicName: 'Happy Pets Animal Hospital' },
];

export const mockAlerts: Alert[] = [
  { id: '1', title: 'Parvovirus Alert', message: '⚠️ Possible Parvovirus increase in your area. Cases up 80% this week.', severity: 'high', date: '2026-06-08', read: false, type: 'outbreak' },
  { id: '2', title: 'Vaccination Due', message: "Max's Parvovirus vaccination is due July 28, 2026.", severity: 'moderate', date: '2026-06-07', read: false, type: 'vaccination' },
  { id: '3', title: 'Upcoming Appointment', message: 'Max has a check-up appointment on July 25 at 10:00 AM', severity: 'low', date: '2026-06-06', read: true, type: 'appointment' },
  { id: '4', title: 'Deworming Due', message: 'Max is due for deworming on July 15, 2026.', severity: 'moderate', date: '2026-06-08', read: false, type: 'deworming' },
];

export const mockClinics: Clinic[] = [
  { id: '1', name: 'Paws & Claws Veterinary Clinic', address: '123 Main St, San Francisco, CA 94102', phone: '+15551234567', email: 'contact@pawsandclaws.com', distance: 0.8, rating: 4.8, emergencyService: true, specialties: ['General Care', 'Surgery', 'Emergency'], hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM' },
  { id: '2', name: 'Happy Pets Animal Hospital', address: '456 Oak Ave, San Francisco, CA 94103', phone: '+15552345678', email: 'info@happypets.com', distance: 1.2, rating: 4.6, emergencyService: true, specialties: ['General Care', 'Dentistry', 'Vaccination'], hours: 'Mon-Sat: 7AM-9PM, Sun: 10AM-5PM' },
  { id: '3', name: 'Pet Care Medical Center', address: '789 Elm St, San Francisco, CA 94104', phone: '+15553456789', email: 'hello@petcaremc.com', distance: 2.1, rating: 4.9, emergencyService: false, specialties: ['General Care', 'Dermatology', 'Cardiology'], hours: 'Mon-Fri: 9AM-7PM, Sat: 10AM-4PM' },
  { id: '4', name: 'VetExpress 24/7', address: '321 Pine St, San Francisco, CA 94105', phone: '+15554567890', email: 'emergency@vetexpress.com', distance: 1.5, rating: 4.7, emergencyService: true, specialties: ['Emergency', '24/7 Care', 'Critical Care'], hours: 'Open 24/7' },
];

export const mockUser: User = { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '+1 (555) 123-4567', location: 'San Francisco, CA', selectedClinicId: '1', createdAt: '2025-01-15' };

export const healthTips: HealthTip[] = [
  { id: '1', title: 'Daily Exercise', description: 'Dogs need at least 30 minutes of exercise daily to maintain good health.', category: 'exercise', icon: 'bicycle-outline' },
  { id: '2', title: 'Fresh Water', description: 'Always ensure your pet has access to clean, fresh water throughout the day.', category: 'nutrition', icon: 'water-outline' },
  { id: '3', title: 'Regular Grooming', description: 'Brush your pet regularly to prevent matting and reduce shedding.', category: 'grooming', icon: 'cut-outline' },
  { id: '4', title: 'Dental Care', description: "Brush your pet's teeth 2-3 times per week to prevent dental disease.", category: 'general', icon: 'medkit-outline' },
  { id: '5', title: 'Watch for Signs', description: 'Monitor for unusual behavior, appetite changes, or lethargy - contact your vet if concerned.', category: 'safety', icon: 'shield-outline' },
  { id: '6', title: 'Balanced Diet', description: 'Feed your pet high-quality food appropriate for their age, size, and activity level.', category: 'nutrition', icon: 'nutrition-outline' },
];
