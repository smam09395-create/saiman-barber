/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api, authStorage } from './api/client.ts';
import { Service, Barber, Settings, Review, AdminUser } from './types/index.ts';
import { ToastProvider, useToast } from './components/Toast.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { ServicesSection } from './components/ServicesSection.tsx';
import { WhyChooseUs } from './components/WhyChooseUs.tsx';
import { BarbersSection } from './components/BarbersSection.tsx';
import { GallerySection } from './components/GallerySection.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { ReviewsSection } from './components/ReviewsSection.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { Footer } from './components/Footer.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { AdminLogin } from './components/admin/AdminLogin.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { showToast } = useToast();

  // Core data states
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Booking modal state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [initialServiceId, setInitialServiceId] = useState<string | undefined>();
  const [initialBarberId, setInitialBarberId] = useState<string | undefined>();

  // Admin state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [inAdminPortal, setInAdminPortal] = useState(false);

  // Active section tracking for navbar highlighting
  const [activeSection, setActiveSection] = useState('home');

  const loadAllData = async () => {
    try {
      const [srvs, brbs, stgs, revs] = await Promise.all([
        api.getServices(),
        api.getBarbers(),
        api.getSettings(),
        api.getReviews(),
      ]);
      setServices(srvs);
      setBarbers(brbs);
      setSettings(stgs);
      setReviews(revs);
    } catch (err: any) {
      console.error('Initial data load error:', err);
      showToast('Could not load studio data from server', 'error');
    } finally {
      setLoadingInitial(false);
    }
  };

  // Verify stored admin token on launch and sync route
  const syncRouteFromUrl = (currentUser: AdminUser | null) => {
    const path = window.location.pathname.toLowerCase();

    if (path === '/admin/dashboard' || path === '/admin') {
      if (currentUser) {
        setInAdminPortal(true);
        setShowAdminLogin(false);
      } else {
        // Enforce security: strictly require login before admin portal access
        setInAdminPortal(false);
        setShowAdminLogin(true);
      }
    } else if (path === '/booking') {
      setBookingOpen(true);
      setInAdminPortal(false);
      setShowAdminLogin(false);
    } else if (path === '/services') {
      setInAdminPortal(false);
      setShowAdminLogin(false);
      setTimeout(() => {
        const el = document.getElementById('services');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (path === '/barbers') {
      setInAdminPortal(false);
      setShowAdminLogin(false);
      setTimeout(() => {
        const el = document.getElementById('barbers');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const checkAdminAuth = async (): Promise<AdminUser | null> => {
    const token = authStorage.getToken();
    if (!token) return null;
    try {
      const res = await api.getAdminMe();
      if (res && res.admin) {
        setAdminUser(res.admin);
        return res.admin;
      }
    } catch {
      authStorage.clearToken();
    }
    return null;
  };

  useEffect(() => {
    const init = async () => {
      const user = await checkAdminAuth();
      await loadAllData();
      syncRouteFromUrl(user);
    };
    init();

    const handlePopState = () => {
      syncRouteFromUrl(adminUser);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intersection observer for section tracking
  useEffect(() => {
    const sections = ['home', 'services', 'barbers', 'gallery', 'about', 'contact'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenBooking = (serviceId?: string, barberId?: string) => {
    setInitialServiceId(serviceId);
    setInitialBarberId(barberId);
    setBookingOpen(true);
    if (window.location.pathname !== '/booking') {
      window.history.pushState({}, '', '/booking');
    }
  };

  const handleCloseBooking = () => {
    setBookingOpen(false);
    if (window.location.pathname === '/booking') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleOpenAdmin = () => {
    if (adminUser) {
      setInAdminPortal(true);
      if (window.location.pathname !== '/admin/dashboard') {
        window.history.pushState({}, '', '/admin/dashboard');
      }
    } else {
      setShowAdminLogin(true);
      if (window.location.pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
      }
    }
  };

  const handleAdminLoginSuccess = (admin: AdminUser) => {
    setAdminUser(admin);
    setShowAdminLogin(false);
    setInAdminPortal(true);
    window.history.pushState({}, '', '/admin/dashboard');
  };

  const handleAdminLogout = async () => {
    await api.adminLogout();
    setAdminUser(null);
    setInAdminPortal(false);
    setShowAdminLogin(false);
    window.history.pushState({}, '', '/');
  };

  const handleReturnToSite = () => {
    setInAdminPortal(false);
    window.history.pushState({}, '', '/');
  };

  const handleCancelAdminLogin = () => {
    setShowAdminLogin(false);
    if (window.location.pathname === '/admin' || window.location.pathname === '/admin/dashboard') {
      window.history.pushState({}, '', '/');
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex flex-col items-center justify-center text-center p-4">
        <span className="text-3xl font-display font-bold tracking-widest text-[#f4f2ed] mb-4">
          SAIMAN
        </span>
        <Loader2 className="w-6 h-6 text-[#c5a059] animate-spin mb-3" />
        <p className="text-xs font-mono text-[#8c8980] uppercase tracking-wider">
          Initializing Sanctuary Studio...
        </p>
      </div>
    );
  }

  // Admin Dashboard Mode
  if (inAdminPortal && adminUser) {
    return (
      <AdminDashboard
        admin={adminUser}
        onLogout={handleAdminLogout}
        onReturnToSite={handleReturnToSite}
        services={services}
        barbers={barbers}
        settings={settings}
        onRefreshAll={loadAllData}
      />
    );
  }

  // Customer Facing Mode
  return (
    <div className="min-h-screen bg-[#0a0b0d] text-[#edebe6] flex flex-col selection:bg-[#c5a059]/30">
      {/* Top Bar Navigation */}
      <Navbar
        onOpenBooking={() => handleOpenBooking()}
        onOpenAdmin={handleOpenAdmin}
        currentSection={activeSection}
      />

      {/* Main Sections */}
      <main className="flex-1">
        <Hero
          onOpenBooking={handleOpenBooking}
          services={services}
          barbers={barbers}
          tagline={settings.tagline}
          heroSubheading={settings.hero_subheading}
        />

        <ServicesSection
          services={services}
          onSelectService={(serviceId) => handleOpenBooking(serviceId)}
        />

        <WhyChooseUs />

        <BarbersSection
          barbers={barbers}
          onSelectBarber={(barberId) => handleOpenBooking(undefined, barberId)}
        />

        <GallerySection />

        <AboutSection
          aboutText={settings.about_text}
          onOpenBooking={() => handleOpenBooking()}
        />

        <ReviewsSection
          reviews={reviews}
          onReviewAdded={loadAllData}
        />

        <ContactSection
          settings={settings}
          onOpenBooking={() => handleOpenBooking()}
        />
      </main>

      {/* Quiet Footer */}
      <Footer
        onOpenAdmin={handleOpenAdmin}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* Interactive 7-Step Booking Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={handleCloseBooking}
        services={services}
        barbers={barbers}
        initialServiceId={initialServiceId}
        initialBarberId={initialBarberId}
      />

      {/* Admin Login Dialog */}
      {showAdminLogin && (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onCancel={handleCancelAdminLogin}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
