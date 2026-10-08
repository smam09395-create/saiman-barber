import { Router, Request, Response, NextFunction } from 'express';
import { db, hashPassword, calculateMinutes, formatMinutes } from './db.js';
import {
  supabase,
  syncBookingToSupabase,
  checkSupabaseStatus,
  migrateAllToSupabase,
  syncServiceToSupabase,
  deleteServiceFromSupabase,
  syncBarberToSupabase,
  deleteBarberFromSupabase,
  syncAvailabilityToSupabase,
  syncBlockedDateToSupabase,
  deleteBlockedDateFromSupabase,
  syncReviewToSupabase,
  deleteReviewFromSupabase,
  syncSettingsToSupabase,
} from './supabase.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const apiRouter = Router();

// In-memory token session store for admin login
const activeSessions = new Map<string, { adminId: string; email: string; createdAt: number }>();

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }
  (req as any).admin = session;
  next();
}

// ==========================================
// PUBLIC & SETTINGS ENDPOINTS
// ==========================================

apiRouter.get('/settings', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/settings', adminAuth, (req: Request, res: Response) => {
  try {
    const newSettings = req.body;
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(newSettings)) {
      if (typeof v === 'string') {
        upsert.run(k, v);
      }
    }
    // Direct sync to Supabase
    syncSettingsToSupabase(newSettings).catch(() => {});
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SERVICES ENDPOINTS
// ==========================================

apiRouter.get('/services', (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.all === 'true';
    let query = 'SELECT * FROM services';
    if (!includeInactive) {
      query += ' WHERE active = 1';
    }
    query += ' ORDER BY price ASC';
    const services = db.prepare(query).all();
    res.json(services);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/services', adminAuth, (req: Request, res: Response) => {
  try {
    const { name, description, price, duration, image } = req.body;
    if (!name || !price || !duration) {
      res.status(400).json({ error: 'Name, price, and duration are required.' });
      return;
    }
    const id = 'srv-' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO services (id, name, description, price, duration, image, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
    stmt.run(id, name, description || '', Number(price), Number(duration), image || '', now, now);
    const created = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    // Direct sync to Supabase
    syncServiceToSupabase(created).catch(() => {});
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/services/:id', adminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, image, active } = req.body;
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE services
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          duration = COALESCE(?, duration),
          image = COALESCE(?, image),
          active = COALESCE(?, active),
          updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      name ?? null,
      description ?? null,
      price !== undefined ? Number(price) : null,
      duration !== undefined ? Number(duration) : null,
      image ?? null,
      active !== undefined ? (active ? 1 : 0) : null,
      now,
      id
    );
    const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    // Direct sync to Supabase
    syncServiceToSupabase(updated).catch(() => {});
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/services/:id', adminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM services WHERE id = ?').run(id);
    // Direct delete in Supabase
    deleteServiceFromSupabase(id).catch(() => {});
    res.json({ success: true, message: 'Service deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// BARBERS ENDPOINTS
// ==========================================

apiRouter.get('/barbers', (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.all === 'true';
    let query = 'SELECT * FROM barbers';
    if (!includeInactive) {
      query += ' WHERE active = 1';
    }
    query += ' ORDER BY created_at ASC';
    const barbers = db.prepare(query).all();
    res.json(barbers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/barbers', adminAuth, (req: Request, res: Response) => {
  try {
    const { name, specialty, experience, bio, image, working_days, available_hours } = req.body;
    if (!name || !specialty) {
      res.status(400).json({ error: 'Name and specialty are required.' });
      return;
    }
    const id = 'barber-' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    const defaultDays = working_days || 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday';
    const defaultHours = available_hours || '09:00 - 19:00';
    const defaultImg = image || '/src/assets/images/barber_saiman_portrait_1791309696168.jpg';

    const stmt = db.prepare(`
      INSERT INTO barbers (id, name, specialty, experience, bio, image, working_days, available_hours, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
    stmt.run(id, name, specialty, experience || 'Professional Barber', bio || '', defaultImg, defaultDays, defaultHours, now, now);

    // Create default availability for this barber (Mon-Sat open, Sun closed)
    const insertAvail = db.prepare(`
      INSERT INTO barber_availability (id, barber_id, day_of_week, start_time, end_time, is_available)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (let day = 0; day <= 6; day++) {
      const isWorking = day >= 1 && day <= 6;
      insertAvail.run(`avail-${id}-${day}`, id, day, '09:00', '19:00', isWorking ? 1 : 0);
    }

    const created = db.prepare('SELECT * FROM barbers WHERE id = ?').get(id);
    // Direct sync to Supabase
    syncBarberToSupabase(created).catch(() => {});
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/barbers/:id', adminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, specialty, experience, bio, image, working_days, available_hours, active } = req.body;
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE barbers
      SET name = COALESCE(?, name),
          specialty = COALESCE(?, specialty),
          experience = COALESCE(?, experience),
          bio = COALESCE(?, bio),
          image = COALESCE(?, image),
          working_days = COALESCE(?, working_days),
          available_hours = COALESCE(?, available_hours),
          active = COALESCE(?, active),
          updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      name ?? null,
      specialty ?? null,
      experience ?? null,
      bio ?? null,
      image ?? null,
      working_days ?? null,
      available_hours ?? null,
      active !== undefined ? (active ? 1 : 0) : null,
      now,
      id
    );
    const updated = db.prepare('SELECT * FROM barbers WHERE id = ?').get(id);
    // Direct sync to Supabase
    syncBarberToSupabase(updated).catch(() => {});
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/barbers/:id', adminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM barber_availability WHERE barber_id = ?').run(id);
    db.prepare('DELETE FROM barbers WHERE id = ?').run(id);
    // Direct delete in Supabase
    deleteBarberFromSupabase(id).catch(() => {});
    res.json({ success: true, message: 'Barber deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// AVAILABILITY & BLOCKED DATES
// ==========================================

apiRouter.get('/barber-availability', (req: Request, res: Response) => {
  try {
    const barberId = req.query.barberId as string;
    let query = 'SELECT * FROM barber_availability';
    let params: any[] = [];
    if (barberId) {
      query += ' WHERE barber_id = ?';
      params.push(barberId);
    }
    query += ' ORDER BY barber_id, day_of_week ASC';
    const schedules = db.prepare(query).all(...params);
    res.json(schedules);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/barber-availability', adminAuth, (req: Request, res: Response) => {
  try {
    const { barber_id, day_of_week, start_time, end_time, is_available } = req.body;
    if (barber_id === undefined || day_of_week === undefined) {
      res.status(400).json({ error: 'barber_id and day_of_week are required' });
      return;
    }
    const existing = db.prepare('SELECT id FROM barber_availability WHERE barber_id = ? AND day_of_week = ?').get(barber_id, day_of_week) as { id: string } | undefined;
    let targetId = existing?.id;
    if (existing) {
      db.prepare(`
        UPDATE barber_availability
        SET start_time = COALESCE(?, start_time),
            end_time = COALESCE(?, end_time),
            is_available = COALESCE(?, is_available)
        WHERE id = ?
      `).run(start_time, end_time, is_available !== undefined ? (is_available ? 1 : 0) : null, existing.id);
    } else {
      targetId = `avail-${barber_id}-${day_of_week}`;
      db.prepare(`
        INSERT INTO barber_availability (id, barber_id, day_of_week, start_time, end_time, is_available)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(targetId, barber_id, day_of_week, start_time || '09:00', end_time || '19:00', is_available ? 1 : 0);
    }

    // Direct sync to Supabase
    syncAvailabilityToSupabase({
      id: targetId,
      barber_id,
      day_of_week,
      start_time: start_time || '09:00',
      end_time: end_time || '19:00',
      is_available: is_available !== undefined ? (is_available ? 1 : 0) : 1,
    }).catch(() => {});

    res.json({ success: true, message: 'Availability updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/blocked-dates', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM blocked_dates ORDER BY date ASC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/blocked-dates', adminAuth, (req: Request, res: Response) => {
  try {
    const { barber_id, date, reason } = req.body;
    if (!date || !reason) {
      res.status(400).json({ error: 'Date and reason are required' });
      return;
    }
    const id = 'blk-' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO blocked_dates (id, barber_id, date, reason, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, barber_id || 'ALL', date, reason, now);

    // Direct sync to Supabase
    syncBlockedDateToSupabase({ id, barber_id: barber_id || 'ALL', date, reason, created_at: now }).catch(() => {});

    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/blocked-dates/:id', adminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM blocked_dates WHERE id = ?').run(id);
    // Direct delete in Supabase
    deleteBlockedDateFromSupabase(id).catch(() => {});
    res.json({ success: true, message: 'Blocked date removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// REAL-TIME SLOT AVAILABILITY ENGINE
// ==========================================

apiRouter.get('/availability/slots', (req: Request, res: Response) => {
  try {
    const { date, serviceId, barberId } = req.query;
    if (!date || !serviceId) {
      res.status(400).json({ error: 'Date and serviceId are required' });
      return;
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ? AND active = 1').get(serviceId as string) as any;
    if (!service) {
      res.status(404).json({ error: 'Service not found or inactive' });
      return;
    }

    const duration = service.duration; // in minutes
    const requestedDate = new Date(`${date}T00:00:00Z`);
    const dayOfWeek = requestedDate.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

    // Check if entire shop is blocked on this date
    const shopBlocked = db.prepare("SELECT * FROM blocked_dates WHERE (barber_id = 'ALL' OR barber_id = '') AND date = ?").get(date as string);
    if (shopBlocked) {
      res.json({ slots: [], message: 'The shop is closed on this date.' });
      return;
    }

    let candidateBarbers: any[] = [];
    if (barberId && barberId !== 'any') {
      const barber = db.prepare('SELECT * FROM barbers WHERE id = ? AND active = 1').get(barberId as string);
      if (barber) candidateBarbers.push(barber);
    } else {
      candidateBarbers = db.prepare('SELECT * FROM barbers WHERE active = 1').all();
    }

    if (candidateBarbers.length === 0) {
      res.json({ slots: [], message: 'No active barbers available.' });
      return;
    }

    // Filter barbers who are individually blocked on this date
    candidateBarbers = candidateBarbers.filter(b => {
      const isBlocked = db.prepare('SELECT id FROM blocked_dates WHERE barber_id = ? AND date = ?').get(b.id, date as string);
      return !isBlocked;
    });

    // Collect all unique slots across working barbers
    interface SlotInfo {
      time: string;
      endTime: string;
      availableBarbers: { id: string; name: string }[];
    }
    const slotMap = new Map<string, SlotInfo>();

    for (const barber of candidateBarbers) {
      // Check schedule for dayOfWeek
      const avail = db.prepare('SELECT * FROM barber_availability WHERE barber_id = ? AND day_of_week = ?').get(barber.id, dayOfWeek) as any;
      if (!avail || !avail.is_available) {
        continue; // Barber does not work on this day
      }

      const shiftStartMins = calculateMinutes(avail.start_time);
      const shiftEndMins = calculateMinutes(avail.end_time);

      // Fetch existing non-cancelled bookings for this barber on this date
      const existingBookings = db.prepare(`
        SELECT start_time, end_time FROM bookings
        WHERE barber_id = ? AND appointment_date = ? AND status != 'Cancelled'
      `).all(barber.id, date as string) as { start_time: string; end_time: string }[];

      // Generate slots every 30 minutes
      for (let m = shiftStartMins; m + duration <= shiftEndMins; m += 30) {
        const slotStart = formatMinutes(m);
        const slotEnd = formatMinutes(m + duration);

        // Check overlap with existing bookings:
        // Overlap condition: slotStart < booking.end_time AND slotEnd > booking.start_time
        const hasOverlap = existingBookings.some(b => {
          return slotStart < b.end_time && slotEnd > b.start_time;
        });

        if (!hasOverlap) {
          if (!slotMap.has(slotStart)) {
            slotMap.set(slotStart, {
              time: slotStart,
              endTime: slotEnd,
              availableBarbers: [],
            });
          }
          slotMap.get(slotStart)!.availableBarbers.push({
            id: barber.id,
            name: barber.name,
          });
        }
      }
    }

    const sortedSlots = Array.from(slotMap.values()).sort((a, b) => a.time.localeCompare(b.time));
    res.json({ slots: sortedSlots, total: sortedSlots.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// BOOKING CREATION WITH ATOMIC DOUBLE-BOOKING PROTECTION
// ==========================================

apiRouter.post('/bookings', async (req: Request, res: Response) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    service_id,
    barber_id,
    appointment_date,
    start_time,
    customer_notes,
  } = req.body;

  // Validation
  if (!customer_name || !customer_phone || !service_id || !appointment_date || !start_time) {
    res.status(400).json({
      error: 'Please fill in all required fields: name, phone, service, date, and time.',
    });
    return;
  }

  // ATOMIC IMMEDIATE TRANSACTION TO PREVENT RACE CONDITIONS
  db.exec('BEGIN IMMEDIATE;');

  try {
    // 1. Validate service
    const service = db.prepare('SELECT * FROM services WHERE id = ? AND active = 1').get(service_id) as any;
    if (!service) {
      db.exec('ROLLBACK;');
      res.status(400).json({ error: 'Selected service is no longer available.' });
      return;
    }

    const duration = service.duration;
    const startMins = calculateMinutes(start_time);
    const end_time = formatMinutes(startMins + duration);
    const dateObj = new Date(`${appointment_date}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();

    // Check shop closure
    const shopBlocked = db.prepare("SELECT * FROM blocked_dates WHERE (barber_id = 'ALL' OR barber_id = '') AND date = ?").get(appointment_date);
    if (shopBlocked) {
      db.exec('ROLLBACK;');
      res.status(400).json({ error: 'The shop is closed on the selected date.' });
      return;
    }

    // Determine assigned barber
    let assignedBarberId = barber_id;

    if (!assignedBarberId || assignedBarberId === 'any') {
      // Find an available barber for this slot
      const allBarbers = db.prepare('SELECT id FROM barbers WHERE active = 1').all() as { id: string }[];
      let foundBarber: string | null = null;

      for (const b of allBarbers) {
        // Check barber blocked
        const isBlocked = db.prepare('SELECT id FROM blocked_dates WHERE barber_id = ? AND date = ?').get(b.id, appointment_date);
        if (isBlocked) continue;

        // Check availability
        const avail = db.prepare('SELECT * FROM barber_availability WHERE barber_id = ? AND day_of_week = ?').get(b.id, dayOfWeek) as any;
        if (!avail || !avail.is_available) continue;

        const shiftStart = calculateMinutes(avail.start_time);
        const shiftEnd = calculateMinutes(avail.end_time);
        if (startMins < shiftStart || startMins + duration > shiftEnd) continue;

        // Check overlap
        const overlap = db.prepare(`
          SELECT COUNT(*) as count FROM bookings
          WHERE barber_id = ? AND appointment_date = ? AND status != 'Cancelled'
          AND (start_time < ? AND end_time > ?)
        `).get(b.id, appointment_date, end_time, start_time) as { count: number };

        if (overlap.count === 0) {
          foundBarber = b.id;
          break;
        }
      }

      if (!foundBarber) {
        db.exec('ROLLBACK;');
        res.status(409).json({ error: 'No barbers are available for this specific time slot. Please choose another time.' });
        return;
      }
      assignedBarberId = foundBarber;
    } else {
      // Validate specific barber
      const barber = db.prepare('SELECT * FROM barbers WHERE id = ? AND active = 1').get(assignedBarberId) as any;
      if (!barber) {
        db.exec('ROLLBACK;');
        res.status(400).json({ error: 'Selected barber is unavailable.' });
        return;
      }

      // Check barber blocked date
      const isBlocked = db.prepare('SELECT id FROM blocked_dates WHERE barber_id = ? AND date = ?').get(assignedBarberId, appointment_date);
      if (isBlocked) {
        db.exec('ROLLBACK;');
        res.status(400).json({ error: 'This barber is unavailable on the selected date.' });
        return;
      }

      // Check working hours
      const avail = db.prepare('SELECT * FROM barber_availability WHERE barber_id = ? AND day_of_week = ?').get(assignedBarberId, dayOfWeek) as any;
      if (!avail || !avail.is_available) {
        db.exec('ROLLBACK;');
        res.status(400).json({ error: 'The barber does not work on this day of the week.' });
        return;
      }

      const shiftStart = calculateMinutes(avail.start_time);
      const shiftEnd = calculateMinutes(avail.end_time);
      if (startMins < shiftStart || startMins + duration > shiftEnd) {
        db.exec('ROLLBACK;');
        res.status(400).json({ error: 'The selected appointment extends outside the barber working hours.' });
        return;
      }

      // STRICT CONCURRENCY OVERLAP CHECK
      const overlap = db.prepare(`
        SELECT COUNT(*) as count FROM bookings
        WHERE barber_id = ? AND appointment_date = ? AND status != 'Cancelled'
        AND (start_time < ? AND end_time > ?)
      `).get(assignedBarberId, appointment_date, end_time, start_time) as { count: number };

      if (overlap.count > 0) {
        db.exec('ROLLBACK;');
        res.status(409).json({
          error: 'This time slot was just booked by another customer. Please select another time.',
        });
        return;
      }
    }

    // Insert new booking
    const bookingId = 'bkg-' + crypto.randomUUID().slice(0, 8);
    const bookingRef = 'SMN-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO bookings (
        id, booking_reference, customer_name, customer_phone, customer_email,
        service_id, barber_id, appointment_date, start_time, end_time,
        price, status, customer_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      bookingId,
      bookingRef,
      customer_name.trim(),
      customer_phone.trim(),
      customer_email ? customer_email.trim() : null,
      service_id,
      assignedBarberId,
      appointment_date,
      start_time,
      end_time,
      service.price,
      'Confirmed',
      customer_notes ? customer_notes.trim() : null,
      now,
      now
    );

    db.exec('COMMIT;');

    // Retrieve populated booking
    const createdBooking = db.prepare(`
      SELECT b.*, s.name as service_name, s.duration as service_duration, br.name as barber_name, br.image as barber_image
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN barbers br ON b.barber_id = br.id
      WHERE b.id = ?
    `).get(bookingId);

    // Sync directly to Supabase
    try {
      await syncBookingToSupabase(createdBooking);
    } catch (err: any) {
      console.warn('[Supabase] Sync note:', err.message);
    }

    res.status(201).json(createdBooking);
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Booking creation error:', err);
    res.status(500).json({ error: 'An unexpected error occurred while booking. Please try again.' });
  }
});

// Get booking details by reference or ID
apiRouter.get('/bookings/:refOrId', (req: Request, res: Response) => {
  try {
    const { refOrId } = req.params;
    const booking = db.prepare(`
      SELECT b.*, s.name as service_name, s.duration as service_duration, br.name as barber_name, br.image as barber_image
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN barbers br ON b.barber_id = br.id
      WHERE b.booking_reference = ? OR b.id = ?
    `).get(refOrId, refOrId);

    if (!booking) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json(booking);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN DASHBOARD & BOOKING MANAGEMENT
// ==========================================

apiRouter.get('/admin/overview', adminAuth, (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const totalBookings = (db.prepare('SELECT COUNT(*) as count FROM bookings').get() as any).count;
    const todayBookings = (db.prepare('SELECT COUNT(*) as count FROM bookings WHERE appointment_date = ?').get(today) as any).count;
    const upcomingBookings = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE appointment_date >= ? AND status NOT IN ('Cancelled', 'Completed')").get(today) as any).count;

    const pending = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Pending'").get() as any).count;
    const confirmed = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Confirmed'").get() as any).count;
    const completed = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Completed'").get() as any).count;
    const cancelled = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Cancelled'").get() as any).count;
    const noShow = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'No-show'").get() as any).count;

    const totalRevenue = (db.prepare("SELECT COALESCE(SUM(price), 0) as total FROM bookings WHERE status IN ('Confirmed', 'Completed')").get() as any).total || 0;
    
    // Today's revenue: all orders completed today OR appointments serviced today
    const todayRevenue = (db.prepare(`
      SELECT COALESCE(SUM(price), 0) as total 
      FROM bookings 
      WHERE (status = 'Completed' AND updated_at LIKE ?)
         OR (appointment_date = ? AND status IN ('Confirmed', 'Completed'))
    `).get(`${today}%`, today) as any).total || 0;

    // Recent bookings sorted by recent activity so completed appointments appear immediately
    const recentBookings = db.prepare(`
      SELECT b.*, s.name as service_name, br.name as barber_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN barbers br ON b.barber_id = br.id
      ORDER BY b.updated_at DESC, b.created_at DESC
      LIMIT 8
    `).all();

    // Recently completed orders specifically
    const completedBookings = db.prepare(`
      SELECT b.*, s.name as service_name, br.name as barber_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN barbers br ON b.barber_id = br.id
      WHERE b.status = 'Completed'
      ORDER BY b.updated_at DESC
      LIMIT 6
    `).all();

    res.json({
      totalBookings,
      todayBookings,
      upcomingBookings,
      statusCounts: {
        pending,
        confirmed,
        completed,
        cancelled,
        noShow,
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
      },
      recentBookings,
      completedBookings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/bookings', adminAuth, (req: Request, res: Response) => {
  try {
    const { date, barberId, status, search } = req.query;
    let query = `
      SELECT b.*, s.name as service_name, s.duration as service_duration, br.name as barber_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN barbers br ON b.barber_id = br.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      query += ' AND b.appointment_date = ?';
      params.push(date);
    }
    if (barberId) {
      query += ' AND b.barber_id = ?';
      params.push(barberId);
    }
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (b.customer_name LIKE ? OR b.customer_phone LIKE ? OR b.booking_reference LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY b.appointment_date DESC, b.start_time DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/admin/bookings/:id/status', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid booking status' });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
    
    // Sync status change to Supabase
    try {
      await supabase.from('bookings').update({ status, updated_at: now }).eq('id', id);
    } catch (e: any) {
      console.warn('[Supabase] Status update note:', e.message);
    }

    const updated = db.prepare(`
      SELECT b.*, s.name as service_name, br.name as barber_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN barbers br ON b.barber_id = br.id
      WHERE b.id = ?
    `).get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/customers', adminAuth, (req: Request, res: Response) => {
  try {
    const customers = db.prepare(`
      SELECT 
        customer_phone,
        customer_name,
        customer_email,
        COUNT(*) as total_appointments,
        MAX(appointment_date) as last_appointment,
        SUM(CASE WHEN status IN ('Confirmed', 'Completed') THEN price ELSE 0 END) as total_spent
      FROM bookings
      GROUP BY customer_phone
      ORDER BY last_appointment DESC
    `).all();
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/customers/:phone/history', adminAuth, (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const history = db.prepare(`
      SELECT b.*, s.name as service_name, br.name as barber_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN barbers br ON b.barber_id = br.id
      WHERE b.customer_phone = ?
      ORDER BY b.appointment_date DESC, b.start_time DESC
    `).all(phone);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// REVIEWS ENDPOINTS
// ==========================================

apiRouter.get('/reviews', (req: Request, res: Response) => {
  try {
    const all = req.query.all === 'true';
    let query = 'SELECT * FROM reviews';
    if (!all) {
      query += ' WHERE approved = 1';
    }
    query += ' ORDER BY created_at DESC';
    const reviews = db.prepare(query).all();
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/reviews', (req: Request, res: Response) => {
  try {
    const { customer_name, rating, comment, service_name } = req.body;
    if (!customer_name || !comment) {
      res.status(400).json({ error: 'Name and comment are required' });
      return;
    }
    const id = 'rev-' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO reviews (id, customer_name, rating, comment, service_name, approved, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(id, customer_name.trim(), Number(rating) || 5, comment.trim(), service_name || 'Haircut', now);
    
    // Direct sync to Supabase
    syncReviewToSupabase({
      id,
      customer_name: customer_name.trim(),
      rating: Number(rating) || 5,
      comment: comment.trim(),
      service_name: service_name || 'Haircut',
      approved: 1,
      created_at: now,
    }).catch(() => {});

    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/admin/reviews/:id/approve', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    db.prepare('UPDATE reviews SET approved = ? WHERE id = ?').run(approved ? 1 : 0, id);
    
    // Direct sync to Supabase
    try {
      await supabase.from('reviews').update({ approved: approved ? 1 : 0 }).eq('id', id);
    } catch (e: any) {
      console.warn('[Supabase] Review update warning:', e.message);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/reviews/:id', adminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    // Direct delete in Supabase
    deleteReviewFromSupabase(id).catch(() => {});
    res.json({ success: true, message: 'Review deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

apiRouter.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Strict authentication: Only the authorized owner smam09395@gmail.com can log in
    if (cleanEmail === 'smam09395@gmail.com' && password === 'smamsher23456') {
      const token = crypto.randomUUID();
      const adminObj = {
        id: 'admin-smam',
        name: 'Smam (Owner)',
        email: 'smam09395@gmail.com',
        role: 'owner',
      };
      activeSessions.set(token, {
        adminId: adminObj.id,
        email: adminObj.email,
        createdAt: Date.now(),
      });
      res.json({ token, admin: adminObj });
      return;
    }

    res.status(401).json({ error: 'Access denied: Invalid admin email or password' });
    return;
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/logout', adminAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

apiRouter.get('/admin/me', adminAuth, (req: Request, res: Response) => {
  const session = (req as any).admin;
  const admin = db.prepare('SELECT id, name, email, role FROM admins WHERE id = ?').get(session.adminId);
  res.json({ admin });
});

// ==========================================
// SUPABASE INTEGRATION ENDPOINTS
// ==========================================

apiRouter.get('/supabase/status', async (_req: Request, res: Response) => {
  try {
    const health = await checkSupabaseStatus();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/supabase/sync', adminAuth, async (_req: Request, res: Response) => {
  try {
    const result = await migrateAllToSupabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/supabase/schema', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase-schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      res.type('text/plain').send(sql);
    } else {
      res.status(404).send('-- Schema file not found');
    }
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});
