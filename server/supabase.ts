import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tqtmomrhmuuhhriximea.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TGS1FcQD00Rb274K06HAWw_nqehkwHi';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface SupabaseHealth {
  connected: boolean;
  url: string;
  projectId: string;
  tables: Record<string, { exists: boolean; count?: number; error?: string }>;
}

export async function checkSupabaseStatus(): Promise<SupabaseHealth> {
  const tableNames = ['services', 'barbers', 'bookings', 'barber_availability', 'blocked_dates', 'reviews', 'settings'];
  const health: SupabaseHealth = {
    connected: true,
    url: SUPABASE_URL,
    projectId: 'tqtmomrhmuuhhriximea',
    tables: {},
  };

  for (const table of tableNames) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        health.tables[table] = {
          exists: false,
          error: error.message,
        };
      } else {
        health.tables[table] = {
          exists: true,
          count: count ?? (data ? data.length : 0),
        };
      }
    } catch (e: any) {
      health.tables[table] = {
        exists: false,
        error: e.message,
      };
    }
  }

  return health;
}

// Sync single booking to Supabase
export async function syncBookingToSupabase(booking: any) {
  try {
    const payload = {
      id: booking.id,
      booking_reference: booking.booking_reference,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_email: booking.customer_email || null,
      service_id: booking.service_id,
      barber_id: booking.barber_id,
      appointment_date: booking.appointment_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      price: Number(booking.price),
      status: booking.status,
      customer_notes: booking.customer_notes || null,
      created_at: booking.created_at || new Date().toISOString(),
      updated_at: booking.updated_at || new Date().toISOString(),
    };

    const { error } = await supabase.from('bookings').upsert(payload);
    if (error) {
      console.warn('[Supabase Sync] Note on booking sync:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Sync] Exception on booking sync:', err.message);
    return false;
  }
}

// Sync single service to Supabase
export async function syncServiceToSupabase(service: any) {
  try {
    await supabase.from('services').upsert({
      id: service.id,
      name: service.name,
      description: service.description,
      price: Number(service.price),
      duration: Number(service.duration),
      image: service.image || null,
      active: service.active ? 1 : 0,
      created_at: service.created_at || new Date().toISOString(),
      updated_at: service.updated_at || new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[Supabase Sync] Service sync warning:', err.message);
  }
}

export async function deleteServiceFromSupabase(id: string) {
  try {
    await supabase.from('services').delete().eq('id', id);
  } catch (err: any) {
    console.warn('[Supabase Sync] Service delete warning:', err.message);
  }
}

// Sync single barber to Supabase
export async function syncBarberToSupabase(barber: any) {
  try {
    await supabase.from('barbers').upsert({
      id: barber.id,
      name: barber.name,
      specialty: barber.specialty,
      experience: barber.experience,
      bio: barber.bio,
      image: barber.image,
      working_days: barber.working_days,
      available_hours: barber.available_hours,
      active: barber.active ? 1 : 0,
      created_at: barber.created_at || new Date().toISOString(),
      updated_at: barber.updated_at || new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[Supabase Sync] Barber sync warning:', err.message);
  }
}

export async function deleteBarberFromSupabase(id: string) {
  try {
    await supabase.from('barbers').delete().eq('id', id);
  } catch (err: any) {
    console.warn('[Supabase Sync] Barber delete warning:', err.message);
  }
}

// Sync availability to Supabase
export async function syncAvailabilityToSupabase(avail: any) {
  try {
    await supabase.from('barber_availability').upsert({
      id: avail.id,
      barber_id: avail.barber_id,
      day_of_week: Number(avail.day_of_week),
      start_time: avail.start_time,
      end_time: avail.end_time,
      is_available: avail.is_available ? 1 : 0,
    });
  } catch (err: any) {
    console.warn('[Supabase Sync] Availability sync warning:', err.message);
  }
}

// Sync blocked dates
export async function syncBlockedDateToSupabase(blocked: any) {
  try {
    await supabase.from('blocked_dates').upsert({
      id: blocked.id,
      barber_id: blocked.barber_id,
      date: blocked.date,
      reason: blocked.reason,
      created_at: blocked.created_at || new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[Supabase Sync] Blocked date sync warning:', err.message);
  }
}

export async function deleteBlockedDateFromSupabase(id: string) {
  try {
    await supabase.from('blocked_dates').delete().eq('id', id);
  } catch (err: any) {
    console.warn('[Supabase Sync] Blocked date delete warning:', err.message);
  }
}

// Sync reviews
export async function syncReviewToSupabase(review: any) {
  try {
    await supabase.from('reviews').upsert({
      id: review.id,
      customer_name: review.customer_name,
      rating: Number(review.rating),
      comment: review.comment,
      service_name: review.service_name || null,
      approved: review.approved ? 1 : 0,
      created_at: review.created_at || new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[Supabase Sync] Review sync warning:', err.message);
  }
}

export async function deleteReviewFromSupabase(id: string) {
  try {
    await supabase.from('reviews').delete().eq('id', id);
  } catch (err: any) {
    console.warn('[Supabase Sync] Review delete warning:', err.message);
  }
}

// Sync settings
export async function syncSettingsToSupabase(settingsObj: Record<string, string>) {
  try {
    const rows = Object.entries(settingsObj).map(([key, value]) => ({ key, value }));
    await supabase.from('settings').upsert(rows);
  } catch (err: any) {
    console.warn('[Supabase Sync] Settings sync warning:', err.message);
  }
}

// Bulk migration of all data to Supabase
export async function migrateAllToSupabase(): Promise<{
  success: boolean;
  synced: Record<string, number>;
  errors: string[];
}> {
  const synced: Record<string, number> = {
    services: 0,
    barbers: 0,
    barber_availability: 0,
    bookings: 0,
    reviews: 0,
    settings: 0,
  };
  const errors: string[] = [];

  // 1. Services
  try {
    const localServices = db.prepare('SELECT * FROM services').all();
    if (localServices.length > 0) {
      const { error } = await supabase.from('services').upsert(localServices);
      if (error) errors.push(`Services: ${error.message}`);
      else synced.services = localServices.length;
    }
  } catch (e: any) {
    errors.push(`Services: ${e.message}`);
  }

  // 2. Barbers
  try {
    const localBarbers = db.prepare('SELECT * FROM barbers').all();
    if (localBarbers.length > 0) {
      const { error } = await supabase.from('barbers').upsert(localBarbers);
      if (error) errors.push(`Barbers: ${error.message}`);
      else synced.barbers = localBarbers.length;
    }
  } catch (e: any) {
    errors.push(`Barbers: ${e.message}`);
  }

  // 3. Availability
  try {
    const localAvail = db.prepare('SELECT * FROM barber_availability').all();
    if (localAvail.length > 0) {
      const { error } = await supabase.from('barber_availability').upsert(localAvail);
      if (error) errors.push(`Availability: ${error.message}`);
      else synced.barber_availability = localAvail.length;
    }
  } catch (e: any) {
    errors.push(`Availability: ${e.message}`);
  }

  // 4. Bookings
  try {
    const localBookings = db.prepare('SELECT * FROM bookings').all();
    if (localBookings.length > 0) {
      const { error } = await supabase.from('bookings').upsert(localBookings);
      if (error) errors.push(`Bookings: ${error.message}`);
      else synced.bookings = localBookings.length;
    }
  } catch (e: any) {
    errors.push(`Bookings: ${e.message}`);
  }

  // 5. Reviews
  try {
    const localReviews = db.prepare('SELECT * FROM reviews').all();
    if (localReviews.length > 0) {
      const { error } = await supabase.from('reviews').upsert(localReviews);
      if (error) errors.push(`Reviews: ${error.message}`);
      else synced.reviews = localReviews.length;
    }
  } catch (e: any) {
    errors.push(`Reviews: ${e.message}`);
  }

  // 6. Settings
  try {
    const localSettings = db.prepare('SELECT * FROM settings').all();
    if (localSettings.length > 0) {
      const { error } = await supabase.from('settings').upsert(localSettings);
      if (error) errors.push(`Settings: ${error.message}`);
      else synced.settings = localSettings.length;
    }
  } catch (e: any) {
    errors.push(`Settings: ${e.message}`);
  }

  return {
    success: errors.length === 0,
    synced,
    errors,
  };
}
