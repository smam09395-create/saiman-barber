export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  image: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  bio: string;
  image: string;
  working_days: string;
  available_hours: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface BarberAvailability {
  id: string;
  barber_id: string;
  day_of_week: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  start_time: string;
  end_time: string;
  is_available: number;
}

export interface BlockedDate {
  id: string;
  barber_id: string;
  date: string;
  reason: string;
  created_at: string;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No-show';

export interface Booking {
  id: string;
  booking_reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  service_id: string;
  barber_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  price: number;
  status: BookingStatus;
  customer_notes?: string | null;
  created_at: string;
  updated_at: string;
  service_name?: string | null;
  service_duration?: number;
  barber_name?: string | null;
  barber_image?: string | null;
}

export interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  service_name?: string | null;
  approved: number;
  created_at: string;
}

export interface Settings {
  business_name?: string;
  tagline?: string;
  hero_subheading?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours_weekday?: string;
  hours_saturday?: string;
  hours_sunday?: string;
  instagram_url?: string;
  about_text?: string;
  [key: string]: string | undefined;
}

export interface CustomerSummary {
  customer_phone: string;
  customer_name: string;
  customer_email?: string | null;
  total_appointments: number;
  last_appointment: string;
  total_spent: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SlotInfo {
  time: string;
  endTime: string;
  availableBarbers: { id: string; name: string }[];
}

export interface SupabaseStatus {
  connected: boolean;
  url: string;
  projectId: string;
  tables: Record<string, { exists: boolean; count?: number; error?: string }>;
}

