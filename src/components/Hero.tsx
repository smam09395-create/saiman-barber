import React from 'react';
import { Calendar, ArrowRight, Clock, Award, Shield } from 'lucide-react';
import { Service, Barber } from '../types/index.ts';

interface HeroProps {
  onOpenBooking: (initialServiceId?: string, initialBarberId?: string) => void;
  services: Service[];
  barbers: Barber[];
  tagline?: string;
  heroSubheading?: string;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenBooking,
  services,
  barbers,
  tagline = 'Sharp Cuts. Strong Presence.',
  heroSubheading = 'Premium grooming crafted with precision, style, and uncompromising attention to detail in an elevated atmosphere.',
}) => {
  const [selectedService, setSelectedService] = React.useState('');
  const [selectedBarber, setSelectedBarber] = React.useState('any');

  const handleQuickBook = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenBooking(selectedService || undefined, selectedBarber !== 'any' ? selectedBarber : undefined);
  };

  return (
    <section id="home" className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Background with luxury barber interior and dark scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_barber_interior_1791309682849.jpg"
          alt="SAIMAN Barber Shop Interior"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-[#0a0b0d]/70 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/20 via-black/60 to-[#0a0b0d]/90" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Unboxed editorial trust kicker (No pills) */}
        <div className="flex items-center gap-2.5 text-xs tracking-widest uppercase font-medium text-[#c5a059] mb-4">
          <span>Master Craftsmanship</span>
          <span aria-hidden="true">·</span>
          <span>Soho, New York</span>
          <span aria-hidden="true">·</span>
          <span>By Appointment</span>
        </div>

        {/* Display Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold text-[#f4f2ed] tracking-tight max-w-4xl leading-[1.08] text-balance mb-6">
          {tagline}
        </h1>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg md:text-xl text-[#b8b5ac] max-w-2xl mx-auto font-normal leading-relaxed text-balance mb-10">
          {heroSubheading}
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-md mb-14">
          <button
            onClick={() => onOpenBooking()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] active:scale-[0.98] transition-all rounded-md shadow-xl shadow-[#c5a059]/20"
          >
            <Calendar className="w-4 h-4" />
            <span>Book an Appointment</span>
          </button>

          <a
            href="#services"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-[#edebe6] bg-[#16181f]/80 hover:bg-[#20232c] border border-[#2b2e3a] hover:border-[#c5a059]/50 transition-all rounded-md backdrop-blur-sm"
          >
            <span>Explore Services</span>
            <ArrowRight className="w-4 h-4 text-[#c5a059]" />
          </a>
        </div>

        {/* Quick Booking Bar */}
        <div className="w-full max-w-3xl bg-[#12141a]/90 border border-[#252834] rounded-xl p-4 sm:p-5 backdrop-blur-md shadow-2xl">
          <form onSubmit={handleQuickBook} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* Service selector */}
            <div className="text-left">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8e8b82] mb-1">
                Select Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-[#181a22] border border-[#2c303f] text-[#edebe6] text-sm rounded-lg px-3 py-2.5 focus:border-[#c5a059] focus:outline-none transition-colors"
              >
                <option value="">Any Service (Choose later)</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (${s.price} · {s.duration}m)
                  </option>
                ))}
              </select>
            </div>

            {/* Barber selector */}
            <div className="text-left">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8e8b82] mb-1">
                Preferred Barber
              </label>
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="w-full bg-[#181a22] border border-[#2c303f] text-[#edebe6] text-sm rounded-lg px-3 py-2.5 focus:border-[#c5a059] focus:outline-none transition-colors"
              >
                <option value="any">Any Available Master</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.specialty.split('&')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className="text-left sm:pt-4">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] transition-colors rounded-lg shadow-md"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Check Available Times</span>
              </button>
            </div>
          </form>
        </div>

        {/* Feature stats proof indicators */}
        <div className="mt-12 grid grid-cols-3 gap-6 sm:gap-12 text-center border-t border-white/5 pt-8 max-w-2xl w-full">
          <div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-[#c5a059]">12+</div>
            <div className="text-xs text-[#8c8980] mt-1 uppercase tracking-wider">Years Mastery</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-[#c5a059]">100%</div>
            <div className="text-xs text-[#8c8980] mt-1 uppercase tracking-wider">Zero Overlap Guarantee</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-[#c5a059]">5.0 ★</div>
            <div className="text-xs text-[#8c8980] mt-1 uppercase tracking-wider">Client Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};
