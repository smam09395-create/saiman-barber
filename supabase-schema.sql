-- ==============================================================================
-- SAIMAN BARBER SHOP - SUPABASE DATABASE SCHEMA
-- Project ID: tqtmomrhmuuhhriximea
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tqtmomrhmuuhhriximea/sql/new
-- ==============================================================================

-- 1. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    duration INTEGER NOT NULL,
    image TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Barbers Table
CREATE TABLE IF NOT EXISTS public.barbers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    experience TEXT NOT NULL,
    bio TEXT NOT NULL,
    image TEXT NOT NULL,
    working_days TEXT NOT NULL,
    available_hours TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Barber Availability Table
CREATE TABLE IF NOT EXISTS public.barber_availability (
    id TEXT PRIMARY KEY,
    barber_id TEXT NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0 = Sun, 1 = Mon ... 6 = Sat
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_available INTEGER NOT NULL DEFAULT 1
);

-- 4. Blocked Dates Table
CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id TEXT PRIMARY KEY,
    barber_id TEXT NOT NULL, -- 'ALL' or specific barber id
    date TEXT NOT NULL, -- YYYY-MM-DD
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bookings Table (Stores all customer reservations)
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    booking_reference TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    service_id TEXT NOT NULL REFERENCES public.services(id),
    barber_id TEXT NOT NULL REFERENCES public.barbers(id),
    appointment_date TEXT NOT NULL, -- YYYY-MM-DD
    start_time TEXT NOT NULL, -- HH:MM
    end_time TEXT NOT NULL, -- HH:MM
    price NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'Confirmed', -- 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show'
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    service_name TEXT,
    approved INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 8. Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon Read and Write for App functionality
CREATE POLICY "Public Read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public Write services" ON public.services FOR ALL USING (true);

CREATE POLICY "Public Read barbers" ON public.barbers FOR SELECT USING (true);
CREATE POLICY "Public Write barbers" ON public.barbers FOR ALL USING (true);

CREATE POLICY "Public Read barber_availability" ON public.barber_availability FOR SELECT USING (true);
CREATE POLICY "Public Write barber_availability" ON public.barber_availability FOR ALL USING (true);

CREATE POLICY "Public Read blocked_dates" ON public.blocked_dates FOR SELECT USING (true);
CREATE POLICY "Public Write blocked_dates" ON public.blocked_dates FOR ALL USING (true);

CREATE POLICY "Public Read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public Insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update bookings" ON public.bookings FOR UPDATE USING (true);
CREATE POLICY "Public Delete bookings" ON public.bookings FOR DELETE USING (true);

CREATE POLICY "Public Read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Write reviews" ON public.reviews FOR ALL USING (true);

CREATE POLICY "Public Read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public Write settings" ON public.settings FOR ALL USING (true);

CREATE POLICY "Public Read admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Public Write admins" ON public.admins FOR ALL USING (true);
