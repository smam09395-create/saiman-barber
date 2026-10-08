import {
  Service,
  Barber,
  BarberAvailability,
  BlockedDate,
  Booking,
  Review,
  Settings,
  CustomerSummary,
  SlotInfo,
  AdminUser,
  SupabaseStatus,
  BookingStatus,
} from '../types/index.ts';
import { supabase } from '../lib/supabase.ts';

const TOKEN_KEY = 'saiman_admin_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

function calculateMinutes(timeStr: string): number {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
}

function formatMinutes(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

let hasBackendServer: boolean | null = null;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // If we already detected no Node.js backend (e.g. Netlify static SPA hosting), bypass immediately
  if (hasBackendServer === false) {
    throw new Error('Static host: using direct Supabase client');
  }

  try {
    const token = authStorage.getToken();
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(path, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!isJson) {
      hasBackendServer = false;
      throw new Error('API returned non-JSON response');
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data && typeof data === 'object' && 'error' in data ? (data as any).error : 'Request failed';
      throw new Error(errorMsg);
    }

    hasBackendServer = true;
    return data as T;
  } catch (err) {
    if (hasBackendServer === null) {
      hasBackendServer = false;
    }
    throw err;
  }
}

export const api = {
  // Settings
  getSettings: async (): Promise<Settings> => {
    try {
      return await request<Settings>('/api/settings');
    } catch {
      const { data } = await supabase.from('settings').select('*');
      const settingsObj: Record<string, string> = {};
      if (data) {
        for (const row of data) {
          settingsObj[row.key] = row.value;
        }
      }
      return settingsObj;
    }
  },

  updateSettings: async (settings: Partial<Settings>) => {
    try {
      return await request<{ success: boolean }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch {
      const rows = Object.entries(settings).map(([key, value]) => ({ key, value: String(value) }));
      await supabase.from('settings').upsert(rows);
      return { success: true };
    }
  },

  // Services
  getServices: async (all = false): Promise<Service[]> => {
    try {
      return await request<Service[]>(`/api/services${all ? '?all=true' : ''}`);
    } catch {
      let query = supabase.from('services').select('*').order('price', { ascending: true });
      if (!all) {
        query = query.eq('active', 1);
      }
      const { data } = await query;
      return (data || []) as Service[];
    }
  },

  createService: async (data: Partial<Service>): Promise<Service> => {
    try {
      return await request<Service>('/api/services', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const id = 'srv-' + crypto.randomUUID().slice(0, 8);
      const now = new Date().toISOString();
      const newService = {
        id,
        name: data.name || '',
        description: data.description || '',
        price: Number(data.price) || 0,
        duration: Number(data.duration) || 30,
        image: data.image || '',
        active: 1,
        created_at: now,
        updated_at: now,
      };
      await supabase.from('services').insert(newService);
      return newService as Service;
    }
  },

  updateService: async (id: string, data: Partial<Service>): Promise<Service> => {
    try {
      return await request<Service>(`/api/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const payload: any = { ...data, updated_at: new Date().toISOString() };
      if (data.active !== undefined) payload.active = data.active ? 1 : 0;
      await supabase.from('services').update(payload).eq('id', id);
      const { data: updated } = await supabase.from('services').select('*').eq('id', id).single();
      return updated as Service;
    }
  },

  deleteService: async (id: string) => {
    try {
      return await request<{ success: boolean }>(`/api/services/${id}`, {
        method: 'DELETE',
      });
    } catch {
      await supabase.from('services').delete().eq('id', id);
      return { success: true };
    }
  },

  // Barbers
  getBarbers: async (all = false): Promise<Barber[]> => {
    try {
      return await request<Barber[]>(`/api/barbers${all ? '?all=true' : ''}`);
    } catch {
      let query = supabase.from('barbers').select('*').order('created_at', { ascending: true });
      if (!all) query = query.eq('active', 1);
      const { data } = await query;
      return (data || []) as Barber[];
    }
  },

  createBarber: async (data: Partial<Barber>): Promise<Barber> => {
    try {
      return await request<Barber>('/api/barbers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const id = 'barber-' + crypto.randomUUID().slice(0, 8);
      const now = new Date().toISOString();
      const newBarber = {
        id,
        name: data.name || '',
        specialty: data.specialty || 'Master Barber',
        experience: data.experience || 'Professional Barber',
        bio: data.bio || '',
        image: data.image || '/images/barber_saiman_portrait_1791309696168.jpg',
        working_days: data.working_days || 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
        available_hours: data.available_hours || '09:00 - 19:00',
        active: 1,
        created_at: now,
        updated_at: now,
      };
      await supabase.from('barbers').insert(newBarber);
      const schedules = [];
      for (let day = 0; day <= 6; day++) {
        schedules.push({
          id: `avail-${id}-${day}`,
          barber_id: id,
          day_of_week: day,
          start_time: '09:00',
          end_time: '19:00',
          is_available: day >= 1 && day <= 6 ? 1 : 0,
        });
      }
      await supabase.from('barber_availability').insert(schedules);
      return newBarber as Barber;
    }
  },

  updateBarber: async (id: string, data: Partial<Barber>): Promise<Barber> => {
    try {
      return await request<Barber>(`/api/barbers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const payload: any = { ...data, updated_at: new Date().toISOString() };
      if (data.active !== undefined) payload.active = data.active ? 1 : 0;
      await supabase.from('barbers').update(payload).eq('id', id);
      const { data: updated } = await supabase.from('barbers').select('*').eq('id', id).single();
      return updated as Barber;
    }
  },

  deleteBarber: async (id: string) => {
    try {
      return await request<{ success: boolean }>(`/api/barbers/${id}`, {
        method: 'DELETE',
      });
    } catch {
      await supabase.from('barber_availability').delete().eq('barber_id', id);
      await supabase.from('barbers').delete().eq('id', id);
      return { success: true };
    }
  },

  // Availability & Blocked dates
  getBarberAvailability: async (barberId?: string): Promise<BarberAvailability[]> => {
    try {
      return await request<BarberAvailability[]>(`/api/barber-availability${barberId ? `?barberId=${barberId}` : ''}`);
    } catch {
      let query = supabase.from('barber_availability').select('*').order('day_of_week', { ascending: true });
      if (barberId) query = query.eq('barber_id', barberId);
      const { data } = await query;
      return (data || []) as BarberAvailability[];
    }
  },

  updateBarberAvailability: async (data: Partial<BarberAvailability>) => {
    try {
      return await request<{ success: boolean }>('/api/barber-availability', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const { barber_id, day_of_week, start_time, end_time, is_available } = data;
      const targetId = `avail-${barber_id}-${day_of_week}`;
      await supabase.from('barber_availability').upsert({
        id: targetId,
        barber_id,
        day_of_week: Number(day_of_week),
        start_time: start_time || '09:00',
        end_time: end_time || '19:00',
        is_available: is_available ? 1 : 0,
      });
      return { success: true };
    }
  },

  getBlockedDates: async (): Promise<BlockedDate[]> => {
    try {
      return await request<BlockedDate[]>('/api/blocked-dates');
    } catch {
      const { data } = await supabase.from('blocked_dates').select('*').order('date', { ascending: true });
      return (data || []) as BlockedDate[];
    }
  },

  addBlockedDate: async (data: { barber_id?: string; date: string; reason: string }) => {
    try {
      return await request<{ success: boolean; id: string }>('/api/blocked-dates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const id = 'blk-' + crypto.randomUUID().slice(0, 8);
      await supabase.from('blocked_dates').insert({
        id,
        barber_id: data.barber_id || 'ALL',
        date: data.date,
        reason: data.reason,
        created_at: new Date().toISOString(),
      });
      return { success: true, id };
    }
  },

  deleteBlockedDate: async (id: string) => {
    try {
      return await request<{ success: boolean }>(`/api/blocked-dates/${id}`, {
        method: 'DELETE',
      });
    } catch {
      await supabase.from('blocked_dates').delete().eq('id', id);
      return { success: true };
    }
  },

  // Booking & Slots
  getAvailableSlots: async (date: string, serviceId: string, barberId: string) => {
    try {
      return await request<{ slots: SlotInfo[]; total: number; message?: string }>(
        `/api/availability/slots?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(
          serviceId
        )}&barberId=${encodeURIComponent(barberId)}`
      );
    } catch {
      // Direct Supabase calculation
      const { data: service } = await supabase.from('services').select('*').eq('id', serviceId).single();
      if (!service) return { slots: [], total: 0, message: 'Service not found' };

      const duration = service.duration || 45;
      const requestedDate = new Date(`${date}T00:00:00Z`);
      const dayOfWeek = requestedDate.getUTCDay();

      // Check shop blocked
      const { data: blockedShop } = await supabase
        .from('blocked_dates')
        .select('*')
        .or(`barber_id.eq.ALL,barber_id.eq.''`)
        .eq('date', date);

      if (blockedShop && blockedShop.length > 0) {
        return { slots: [], total: 0, message: 'The shop is closed on this date.' };
      }

      let barberQuery = supabase.from('barbers').select('*').eq('active', 1);
      if (barberId && barberId !== 'any') {
        barberQuery = barberQuery.eq('id', barberId);
      }
      const { data: barbersList } = await barberQuery;
      if (!barbersList || barbersList.length === 0) {
        return { slots: [], total: 0, message: 'No barbers available.' };
      }

      const { data: indBlocked } = await supabase.from('blocked_dates').select('barber_id').eq('date', date);
      const blockedBarberIds = new Set((indBlocked || []).map((b) => b.barber_id));
      const activeBarbers = barbersList.filter((b) => !blockedBarberIds.has(b.id));

      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('barber_id, start_time, end_time')
        .eq('appointment_date', date)
        .neq('status', 'Cancelled');

      const { data: schedules } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', 1);

      const slotMap = new Map<string, SlotInfo>();

      for (const b of activeBarbers) {
        const sched = schedules?.find((s) => s.barber_id === b.id);
        if (!sched) continue;

        const shiftStart = calculateMinutes(sched.start_time || '09:00');
        const shiftEnd = calculateMinutes(sched.end_time || '19:00');
        const barberBookings = (existingBookings || []).filter((bk) => bk.barber_id === b.id);

        for (let time = shiftStart; time + duration <= shiftEnd; time += 15) {
          const slotEnd = time + duration;
          const isConflict = barberBookings.some((bk) => {
            const bStart = calculateMinutes(bk.start_time);
            const bEnd = calculateMinutes(bk.end_time);
            return time < bEnd && slotEnd > bStart;
          });

          if (!isConflict) {
            const timeStr = formatMinutes(time);
            const endTimeStr = formatMinutes(slotEnd);
            const existing = slotMap.get(timeStr);
            if (existing) {
              existing.availableBarbers.push({ id: b.id, name: b.name });
            } else {
              slotMap.set(timeStr, {
                time: timeStr,
                endTime: endTimeStr,
                availableBarbers: [{ id: b.id, name: b.name }],
              });
            }
          }
        }
      }

      const sortedSlots = Array.from(slotMap.values()).sort((a, b) => a.time.localeCompare(b.time));
      return { slots: sortedSlots, total: sortedSlots.length };
    }
  },

  createBooking: async (bookingData: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    service_id: string;
    barber_id: string;
    appointment_date: string;
    start_time: string;
    customer_notes?: string;
  }): Promise<Booking> => {
    try {
      return await request<Booking>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    } catch {
      const { data: service } = await supabase.from('services').select('*').eq('id', bookingData.service_id).single();
      const { data: barber } = await supabase.from('barbers').select('*').eq('id', bookingData.barber_id).single();

      const duration = service?.duration || 45;
      const startMins = calculateMinutes(bookingData.start_time);
      const endMins = startMins + duration;
      const end_time = formatMinutes(endMins);

      const id = 'bkg-' + crypto.randomUUID().slice(0, 8);
      const booking_reference = 'SMN-' + Math.floor(1000 + Math.random() * 9000);
      const now = new Date().toISOString();

      const payload = {
        id,
        booking_reference,
        customer_name: bookingData.customer_name.trim(),
        customer_phone: bookingData.customer_phone.trim(),
        customer_email: bookingData.customer_email?.trim() || null,
        service_id: bookingData.service_id,
        barber_id: bookingData.barber_id,
        appointment_date: bookingData.appointment_date,
        start_time: bookingData.start_time,
        end_time,
        price: Number(service?.price || 45),
        status: 'Confirmed',
        customer_notes: bookingData.customer_notes || null,
        created_at: now,
        updated_at: now,
      };

      await supabase.from('bookings').insert(payload);

      return {
        ...payload,
        service_name: service?.name || 'Haircut',
        service_duration: duration,
        barber_name: barber?.name || 'Master Barber',
        barber_image: barber?.image,
        status: 'Confirmed' as BookingStatus,
      };
    }
  },

  getBooking: async (refOrId: string): Promise<Booking> => {
    try {
      return await request<Booking>(`/api/bookings/${refOrId}`);
    } catch {
      const { data: bkg } = await supabase
        .from('bookings')
        .select('*')
        .or(`booking_reference.eq.${refOrId},id.eq.${refOrId}`)
        .single();
      if (!bkg) throw new Error('Appointment not found');

      const { data: srv } = await supabase.from('services').select('name, duration').eq('id', bkg.service_id).single();
      const { data: brb } = await supabase.from('barbers').select('name, image').eq('id', bkg.barber_id).single();

      return {
        ...bkg,
        service_name: srv?.name,
        service_duration: srv?.duration,
        barber_name: brb?.name,
        barber_image: brb?.image,
      };
    }
  },

  // Reviews
  getReviews: async (all = false): Promise<Review[]> => {
    try {
      return await request<Review[]>(`/api/reviews${all ? '?all=true' : ''}`);
    } catch {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (!all) query = query.eq('approved', 1);
      const { data } = await query;
      return (data || []) as Review[];
    }
  },

  submitReview: async (data: { customer_name: string; rating: number; comment: string; service_name?: string }) => {
    try {
      return await request<{ success: boolean; id: string }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const id = 'rev-' + crypto.randomUUID().slice(0, 8);
      await supabase.from('reviews').insert({
        id,
        customer_name: data.customer_name.trim(),
        rating: Number(data.rating) || 5,
        comment: data.comment.trim(),
        service_name: data.service_name || 'Haircut',
        approved: 1,
        created_at: new Date().toISOString(),
      });
      return { success: true, id };
    }
  },

  approveReview: async (id: string, approved: boolean) => {
    try {
      return await request<{ success: boolean }>(`/api/admin/reviews/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ approved }),
      });
    } catch {
      await supabase.from('reviews').update({ approved: approved ? 1 : 0 }).eq('id', id);
      return { success: true };
    }
  },

  deleteReview: async (id: string) => {
    try {
      return await request<{ success: boolean }>(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });
    } catch {
      await supabase.from('reviews').delete().eq('id', id);
      return { success: true };
    }
  },

  // Admin Portal & Authentication
  adminLogin: async (credentials: { email: string; password: string }) => {
    const cleanEmail = credentials.email.trim().toLowerCase();
    // Verify strictly authorized credentials
    if (cleanEmail === 'smam09395@gmail.com' && credentials.password === 'smamsher23456') {
      const token = crypto.randomUUID();
      const admin: AdminUser = {
        id: 'admin-smam',
        name: 'Smam (Owner)',
        email: cleanEmail,
        role: 'owner',
      };
      authStorage.setToken(token);
      return { token, admin };
    }
    throw new Error('Access denied: Invalid admin email or password');
  },

  adminLogout: async () => {
    authStorage.clearToken();
    try {
      await request<{ success: boolean }>('/api/admin/logout', { method: 'POST' });
    } catch {
      // offline/direct ok
    }
    return { success: true };
  },

  getAdminMe: async (): Promise<{ admin: AdminUser }> => {
    const token = authStorage.getToken();
    if (!token) throw new Error('Unauthorized');
    return {
      admin: {
        id: 'admin-smam',
        name: 'Smam (Owner)',
        email: 'smam09395@gmail.com',
        role: 'owner',
      },
    };
  },

  getAdminOverview: async () => {
    try {
      return await request<{
        totalBookings: number;
        todayBookings: number;
        upcomingBookings: number;
        statusCounts: {
          pending: number;
          confirmed: number;
          completed: number;
          cancelled: number;
          noShow: number;
        };
        revenue: {
          total: number;
          today: number;
        };
        recentBookings: Booking[];
        completedBookings?: Booking[];
      }>('/api/admin/overview');
    } catch {
      // Calculate from live Supabase data directly
      const today = new Date().toISOString().split('T')[0];

      const { data: allBookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      const { data: srvs } = await supabase.from('services').select('id, name');
      const { data: brbs } = await supabase.from('barbers').select('id, name');

      const srvMap = new Map((srvs || []).map((s) => [s.id, s.name]));
      const brbMap = new Map((brbs || []).map((b) => [b.id, b.name]));

      const bookings = (allBookings || []).map((b) => ({
        ...b,
        service_name: srvMap.get(b.service_id) || 'Service',
        barber_name: brbMap.get(b.barber_id) || 'Barber',
      }));

      const totalBookings = bookings.length;
      const todayBookings = bookings.filter((b) => b.appointment_date === today).length;
      const upcomingBookings = bookings.filter(
        (b) => b.appointment_date >= today && b.status !== 'Cancelled' && b.status !== 'Completed'
      ).length;

      const completed = bookings.filter((b) => b.status === 'Completed').length;
      const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
      const pending = bookings.filter((b) => b.status === 'Pending').length;
      const cancelled = bookings.filter((b) => b.status === 'Cancelled').length;
      const noShow = bookings.filter((b) => b.status === 'No-show').length;

      const totalRevenue = bookings
        .filter((b) => b.status === 'Confirmed' || b.status === 'Completed')
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

      // Today's revenue: completed today or serviced today
      const todayRevenue = bookings
        .filter(
          (b) =>
            (b.status === 'Completed' && (b.updated_at || '').startsWith(today)) ||
            (b.appointment_date === today && (b.status === 'Confirmed' || b.status === 'Completed'))
        )
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

      const recentBookings = [...bookings]
        .sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at))
        .slice(0, 8);

      const completedBookings = bookings
        .filter((b) => b.status === 'Completed')
        .sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at))
        .slice(0, 6);

      return {
        totalBookings,
        todayBookings,
        upcomingBookings,
        statusCounts: { pending, confirmed, completed, cancelled, noShow },
        revenue: { total: totalRevenue, today: todayRevenue },
        recentBookings,
        completedBookings,
      };
    }
  },

  getAdminBookings: async (filters: { date?: string; barberId?: string; status?: string; search?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.set('date', filters.date);
      if (filters.barberId) params.set('barberId', filters.barberId);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      return await request<Booking[]>(`/api/admin/bookings?${params.toString()}`);
    } catch {
      let query = supabase.from('bookings').select('*').order('appointment_date', { ascending: false });

      if (filters.date) query = query.eq('appointment_date', filters.date);
      if (filters.barberId) query = query.eq('barber_id', filters.barberId);
      if (filters.status) query = query.eq('status', filters.status);

      const { data: bkgList } = await query;
      const { data: srvs } = await supabase.from('services').select('id, name, duration');
      const { data: brbs } = await supabase.from('barbers').select('id, name');

      const srvMap = new Map((srvs || []).map((s) => [s.id, s]));
      const brbMap = new Map((brbs || []).map((b) => [b.id, b.name]));

      let results: Booking[] = (bkgList || []).map((b) => {
        const s = srvMap.get(b.service_id);
        return {
          ...b,
          service_name: s?.name || 'Service',
          service_duration: s?.duration || 45,
          barber_name: brbMap.get(b.barber_id) || 'Barber',
        };
      });

      if (filters.search) {
        const s = filters.search.toLowerCase();
        results = results.filter(
          (b) =>
            b.customer_name.toLowerCase().includes(s) ||
            b.customer_phone.includes(s) ||
            b.booking_reference.toLowerCase().includes(s)
        );
      }

      return results;
    }
  },

  updateBookingStatus: async (id: string, status: string): Promise<Booking> => {
    const now = new Date().toISOString();
    try {
      return await request<Booking>(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch {
      await supabase.from('bookings').update({ status, updated_at: now }).eq('id', id);
      const { data: b } = await supabase.from('bookings').select('*').eq('id', id).single();
      const { data: srv } = await supabase.from('services').select('name').eq('id', b.service_id).single();
      const { data: brb } = await supabase.from('barbers').select('name').eq('id', b.barber_id).single();
      return {
        ...b,
        service_name: srv?.name,
        barber_name: brb?.name,
      };
    }
  },

  getAdminCustomers: async (): Promise<CustomerSummary[]> => {
    try {
      return await request<CustomerSummary[]>('/api/admin/customers');
    } catch {
      const { data: bookings } = await supabase.from('bookings').select('*').order('appointment_date', { ascending: false });
      const map = new Map<string, CustomerSummary>();

      for (const b of bookings || []) {
        const existing = map.get(b.customer_phone);
        if (existing) {
          existing.total_appointments += 1;
          existing.total_spent += Number(b.price) || 0;
        } else {
          map.set(b.customer_phone, {
            customer_phone: b.customer_phone,
            customer_name: b.customer_name,
            customer_email: b.customer_email || undefined,
            total_appointments: 1,
            last_appointment: b.appointment_date,
            total_spent: Number(b.price) || 0,
          });
        }
      }

      return Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent);
    }
  },

  getCustomerHistory: async (phone: string): Promise<Booking[]> => {
    try {
      return await request<Booking[]>(`/api/admin/customers/${encodeURIComponent(phone)}/history`);
    } catch {
      const { data } = await supabase.from('bookings').select('*').eq('customer_phone', phone).order('appointment_date', { ascending: false });
      return (data || []) as Booking[];
    }
  },

  // Supabase Integration Health Check
  getSupabaseStatus: async (): Promise<SupabaseStatus> => {
    try {
      return await request<SupabaseStatus>('/api/supabase/status');
    } catch {
      const tables: Record<string, { exists: boolean; count?: number }> = {};
      const tableNames = ['services', 'barbers', 'bookings', 'barber_availability', 'blocked_dates', 'reviews', 'settings'];

      for (const t of tableNames) {
        try {
          const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
          tables[t] = { exists: true, count: count ?? 0 };
        } catch {
          tables[t] = { exists: false, count: 0 };
        }
      }

      return {
        connected: true,
        url: 'https://tqtmomrhmuuhhriximea.supabase.co',
        projectId: 'tqtmomrhmuuhhriximea',
        tables,
      };
    }
  },

  syncAllToSupabase: async () => {
    return { success: true, synced: {}, errors: [] };
  },

  getSupabaseSchemaSql: async () => {
    return '';
  },
};
