import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'saiman.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance concurrency
db.exec(`PRAGMA journal_mode = WAL;`);
db.exec(`PRAGMA foreign_keys = ON;`);

// Helper to hash password
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_saiman_salt_2026').digest('hex');
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      duration INTEGER NOT NULL,
      image TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS barbers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      experience TEXT NOT NULL,
      bio TEXT NOT NULL,
      image TEXT NOT NULL,
      working_days TEXT NOT NULL,
      available_hours TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS barber_availability (
      id TEXT PRIMARY KEY,
      barber_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL, -- 0 = Sun, 1 = Mon ... 6 = Sat
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(barber_id) REFERENCES barbers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blocked_dates (
      id TEXT PRIMARY KEY,
      barber_id TEXT NOT NULL, -- barber_id or 'ALL'
      date TEXT NOT NULL, -- YYYY-MM-DD
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_reference TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      service_id TEXT NOT NULL,
      barber_id TEXT NOT NULL,
      appointment_date TEXT NOT NULL, -- YYYY-MM-DD
      start_time TEXT NOT NULL, -- HH:MM
      end_time TEXT NOT NULL, -- HH:MM
      price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Confirmed', -- 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show'
      customer_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(service_id) REFERENCES services(id),
      FOREIGN KEY(barber_id) REFERENCES barbers(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      service_name TEXT,
      approved INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // 1. Seed admin if none exists
  const adminStmt = db.prepare('SELECT COUNT(*) as count FROM admins');
  const adminCount = (adminStmt.get() as { count: number }).count;
  if (adminCount === 0) {
    const insertAdmin = db.prepare(`
      INSERT INTO admins (id, name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run(
      'admin-1',
      'Saiman Master Admin',
      'admin@saimanbarber.com',
      hashPassword('admin123'),
      'admin',
      new Date().toISOString()
    );
  }

  // Ensure requested user admin exists with exact email smam09395@gmail.com and password smamsher23456
  const existingSmam = db.prepare('SELECT id FROM admins WHERE email = ?').get('smam09395@gmail.com') as { id: string } | undefined;
  if (!existingSmam) {
    db.prepare(`
      INSERT INTO admins (id, name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'admin-smam',
      'Smam (Owner)',
      'smam09395@gmail.com',
      hashPassword('smamsher23456'),
      'superadmin',
      new Date().toISOString()
    );
  } else {
    db.prepare('UPDATE admins SET password_hash = ? WHERE email = ?').run(
      hashPassword('smamsher23456'),
      'smam09395@gmail.com'
    );
  }

  // 2. Seed services if none exist
  const serviceStmt = db.prepare('SELECT COUNT(*) as count FROM services');
  const serviceCount = (serviceStmt.get() as { count: number }).count;
  if (serviceCount === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (id, name, description, price, duration, image, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const demoServices = [
      {
        id: 'srv-1',
        name: 'Classic Haircut',
        description: 'Bespoke precision scissor cut, taper finish, hot lather neck shave, and artisan styling.',
        price: 45,
        duration: 45,
        image: '/src/assets/images/gallery_skin_fade_1791309741240.jpg',
      },
      {
        id: 'srv-2',
        name: 'Precision Skin Fade',
        description: 'Seamless low, mid, or high foil/razor fade with razor-sharp edge alignment and texturizing.',
        price: 52,
        duration: 50,
        image: '/src/assets/images/gallery_skin_fade_1791309741240.jpg',
      },
      {
        id: 'srv-3',
        name: 'Beard Trim & Sculpting',
        description: 'Hot towel compress, custom blade shaping, neckline taper, and nourishing essential oils.',
        price: 38,
        duration: 35,
        image: '/src/assets/images/barber_hamza_portrait_1791309725947.jpg',
      },
      {
        id: 'srv-4',
        name: 'The Signature: Cut & Beard',
        description: 'Our benchmark combo: master haircut, foil skin fade, beard contouring, and hot towel finish.',
        price: 80,
        duration: 75,
        image: '/src/assets/images/hero_barber_interior_1791309682849.jpg',
      },
      {
        id: 'srv-5',
        name: 'Royal Grooming Ritual',
        description: 'The ultimate gentleman service: facial scrub, steam, straight-razor shave, signature haircut, and scalp tonic.',
        price: 115,
        duration: 90,
        image: '/src/assets/images/hero_barber_interior_1791309682849.jpg',
      },
      {
        id: 'srv-6',
        name: 'Junior Barber Cut (Under 14)',
        description: 'Patient, sharp modern cuts tailored for younger gentlemen with professional finish.',
        price: 32,
        duration: 30,
        image: '/src/assets/images/gallery_skin_fade_1791309741240.jpg',
      },
    ];

    for (const s of demoServices) {
      insertService.run(s.id, s.name, s.description, s.price, s.duration, s.image, 1, now, now);
    }
  }

  // 3. Seed barbers if none exist
  const barberStmt = db.prepare('SELECT COUNT(*) as count FROM barbers');
  const barberCount = (barberStmt.get() as { count: number }).count;
  if (barberCount === 0) {
    const insertBarber = db.prepare(`
      INSERT INTO barbers (id, name, specialty, experience, bio, image, working_days, available_hours, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const demoBarbers = [
      {
        id: 'barber-1',
        name: 'Saiman',
        specialty: 'Master Barber & Founder',
        experience: '12+ Years Experience',
        bio: 'Founder of SAIMAN Grooming. Trained in London and Milan, renowned for architectural silhouettes, scissor craftsmanship, and personalized client consultations.',
        image: '/src/assets/images/barber_saiman_portrait_1791309696168.jpg',
        working_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
        available_hours: '09:00 - 19:00',
      },
      {
        id: 'barber-2',
        name: 'Rayyan',
        specialty: 'Senior Fade & Texture Specialist',
        experience: '7 Years Experience',
        bio: 'Master of gradients, immaculate skin tapers, and modern street luxury styling. Expert with all hair textures and razor-sharp edge ups.',
        image: '/src/assets/images/barber_rayyan_portrait_1791309710715.jpg',
        working_days: 'Tuesday,Wednesday,Thursday,Friday,Saturday',
        available_hours: '10:00 - 20:00',
      },
      {
        id: 'barber-3',
        name: 'Hamza',
        specialty: 'Artisan Beard & Straight Razor Specialist',
        experience: '9 Years Experience',
        bio: 'Old-school craftsmanship meets contemporary flair. Hamza specializes in bespoke beard sculpting, hot lather straight razor shaves, and traditional scalp treatments.',
        image: '/src/assets/images/barber_hamza_portrait_1791309725947.jpg',
        working_days: 'Monday,Wednesday,Thursday,Friday,Saturday',
        available_hours: '09:00 - 18:30',
      },
    ];

    for (const b of demoBarbers) {
      insertBarber.run(b.id, b.name, b.specialty, b.experience, b.bio, b.image, b.working_days, b.available_hours, 1, now, now);
    }

    // Seed barber availability schedules (Mon-Sat: 1-6)
    const insertAvail = db.prepare(`
      INSERT INTO barber_availability (id, barber_id, day_of_week, start_time, end_time, is_available)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Saiman works Mon(1) to Sat(6) 09:00 - 19:00, Sun(0) closed
    for (let day = 0; day <= 6; day++) {
      const isWorking = day >= 1 && day <= 6;
      insertAvail.run(`avail-saiman-${day}`, 'barber-1', day, '09:00', '19:00', isWorking ? 1 : 0);
    }

    // Rayyan works Tue(2) to Sat(6) 10:00 - 20:00
    for (let day = 0; day <= 6; day++) {
      const isWorking = day >= 2 && day <= 6;
      insertAvail.run(`avail-rayyan-${day}`, 'barber-2', day, '10:00', '20:00', isWorking ? 1 : 0);
    }

    // Hamza works Mon(1), Wed(3), Thu(4), Fri(5), Sat(6) 09:00 - 18:30
    for (let day = 0; day <= 6; day++) {
      const isWorking = [1, 3, 4, 5, 6].includes(day);
      insertAvail.run(`avail-hamza-${day}`, 'barber-3', day, '09:00', '18:30', isWorking ? 1 : 0);
    }
  }

  // 4. Seed reviews
  const reviewStmt = db.prepare('SELECT COUNT(*) as count FROM reviews');
  const reviewCount = (reviewStmt.get() as { count: number }).count;
  if (reviewCount === 0) {
    const insertReview = db.prepare(`
      INSERT INTO reviews (id, customer_name, rating, comment, service_name, approved, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const demoReviews = [
      {
        id: 'rev-1',
        customer_name: 'Marcus Vance',
        rating: 5,
        comment: 'Hands down the finest barber experience in the city. Saiman’s attention to detail is unmatched. The hot towel and razor finish is world-class.',
        service_name: 'The Signature: Cut & Beard',
        created_at: '2026-09-18T14:30:00Z',
      },
      {
        id: 'rev-2',
        customer_name: 'Julian Sterling',
        rating: 5,
        comment: 'Rayyan gave me the cleanest taper fade I have ever had. The shop atmosphere is relaxed, sophisticated, and genuinely welcoming.',
        service_name: 'Precision Skin Fade',
        created_at: '2026-09-24T16:15:00Z',
      },
      {
        id: 'rev-3',
        customer_name: 'David K. Mercer',
        rating: 5,
        comment: 'Booked the Royal Grooming Ritual with Hamza before my wedding day. Precision beard sculpt, spotless straight razor work, and excellent banter.',
        service_name: 'Royal Grooming Ritual',
        created_at: '2026-10-01T11:00:00Z',
      },
      {
        id: 'rev-4',
        customer_name: 'Anthony Rossi',
        rating: 5,
        comment: 'Pure luxury from the moment you walk through the door. Punctual, razor-sharp results, and premium products that smell incredible.',
        service_name: 'Classic Haircut',
        created_at: '2026-10-04T18:20:00Z',
      },
    ];

    for (const r of demoReviews) {
      insertReview.run(r.id, r.customer_name, r.rating, r.comment, r.service_name, 1, r.created_at);
    }
  }

  // 5. Seed initial bookings so dashboard is live with real metrics
  const bookingsStmt = db.prepare('SELECT COUNT(*) as count FROM bookings');
  const bookingCount = (bookingsStmt.get() as { count: number }).count;
  if (bookingCount === 0) {
    const insertBooking = db.prepare(`
      INSERT INTO bookings (
        id, booking_reference, customer_name, customer_phone, customer_email,
        service_id, barber_id, appointment_date, start_time, end_time,
        price, status, customer_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Today is 2026-10-06
    const demoBookings = [
      {
        id: 'bkg-1',
        booking_reference: 'SMN-8841',
        customer_name: 'Dominic Zhao',
        customer_phone: '+1 (555) 234-8901',
        customer_email: 'dominic.z@example.com',
        service_id: 'srv-2',
        barber_id: 'barber-2',
        appointment_date: '2026-10-06',
        start_time: '11:30',
        end_time: '12:20',
        price: 52,
        status: 'Confirmed',
        customer_notes: 'Low taper fade, keep natural curl on top.',
      },
      {
        id: 'bkg-2',
        booking_reference: 'SMN-8842',
        customer_name: 'Liam Harrington',
        customer_phone: '+1 (555) 678-1234',
        customer_email: 'liam.h@example.com',
        service_id: 'srv-4',
        barber_id: 'barber-1',
        appointment_date: '2026-10-06',
        start_time: '14:00',
        end_time: '15:15',
        price: 80,
        status: 'Confirmed',
        customer_notes: 'Executive styling for business dinner tonight.',
      },
      {
        id: 'bkg-3',
        booking_reference: 'SMN-8843',
        customer_name: 'Arthur Pendelton',
        customer_phone: '+1 (555) 432-9087',
        customer_email: 'arthur.p@example.com',
        service_id: 'srv-3',
        barber_id: 'barber-3',
        appointment_date: '2026-10-06',
        start_time: '16:00',
        end_time: '16:35',
        price: 38,
        status: 'Confirmed',
        customer_notes: 'Shape beard line high on cheekbones.',
      },
      {
        id: 'bkg-4',
        booking_reference: 'SMN-8839',
        customer_name: 'Christian Bell',
        customer_phone: '+1 (555) 890-3456',
        customer_email: 'c.bell@example.com',
        service_id: 'srv-1',
        barber_id: 'barber-1',
        appointment_date: '2026-10-05',
        start_time: '10:00',
        end_time: '10:45',
        price: 45,
        status: 'Completed',
        customer_notes: '',
      },
      {
        id: 'bkg-5',
        booking_reference: 'SMN-8850',
        customer_name: 'Nathaniel Croft',
        customer_phone: '+1 (555) 567-9012',
        customer_email: 'ncroft@example.com',
        service_id: 'srv-5',
        barber_id: 'barber-3',
        appointment_date: '2026-10-07',
        start_time: '11:00',
        end_time: '12:30',
        price: 115,
        status: 'Confirmed',
        customer_notes: 'Full prep session.',
      },
    ];

    const now = new Date().toISOString();
    for (const b of demoBookings) {
      insertBooking.run(
        b.id, b.booking_reference, b.customer_name, b.customer_phone, b.customer_email,
        b.service_id, b.barber_id, b.appointment_date, b.start_time, b.end_time,
        b.price, b.status, b.customer_notes, now, now
      );
    }
  }

  // 6. Seed settings
  const settingsStmt = db.prepare('SELECT COUNT(*) as count FROM settings');
  const settingsCount = (settingsStmt.get() as { count: number }).count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    const defaultSettings: Record<string, string> = {
      business_name: 'SAIMAN',
      tagline: 'Sharp Cuts. Strong Presence.',
      hero_subheading: 'Premium grooming crafted with precision, style, and uncompromising attention to detail in an elevated atmosphere.',
      phone: '+1 (555) 724-6260',
      email: 'concierge@saimanbarber.com',
      address: '482 Grand Avenue, Suite 100, Soho, New York, NY 10013',
      hours_weekday: 'Mon - Fri: 9:00 AM - 8:00 PM',
      hours_saturday: 'Saturday: 9:00 AM - 7:00 PM',
      hours_sunday: 'Sunday: Closed / VIP Private Sessions',
      instagram_url: 'https://instagram.com/saimanbarber',
      about_text: 'Founded on the philosophy that modern masculine grooming should be an intentional ritual rather than a routine errand. SAIMAN brings together bespoke scissors craftsmanship, state-of-the-art taper techniques, and timeless straight-razor care in an intimate sanctuary designed for the modern gentleman.',
    };

    for (const [k, v] of Object.entries(defaultSettings)) {
      insertSetting.run(k, v);
    }
  }
}

// Function to generate time slots (e.g., '09:00', '09:30', etc.)
export function calculateMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
