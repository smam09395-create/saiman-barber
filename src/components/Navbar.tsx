import React, { useState, useEffect } from 'react';
import { Menu, X, Calendar } from 'lucide-react';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenAdmin?: () => void;
  currentSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  currentSection,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Services', href: '#services' },
    { label: 'Barbers', href: '#barbers' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0a0b0d]/92 backdrop-blur-md border-b border-[#22242c] py-3.5 shadow-xl shadow-black/20'
          : 'bg-transparent py-5 border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#home"
          className="text-2xl sm:text-3xl font-display font-bold tracking-widest text-[#f4f2ed] hover:text-[#c5a059] transition-colors"
        >
          SAIMAN
        </a>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#b3b0a6]">
          {navLinks.map((link) => {
            const isActive = currentSection === link.href.substring(1);
            return (
              <a
                key={link.label}
                href={link.href}
                className={`relative py-1 transition-colors hover:text-[#f4f2ed] ${
                  isActive ? 'text-[#c5a059] font-semibold' : ''
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#c5a059] rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenBooking}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] active:scale-[0.98] transition-all rounded-md shadow-lg shadow-[#c5a059]/15"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800/50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d0f13] border-b border-[#252833] px-6 py-6 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-4 text-base font-medium">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#d8d5cc] hover:text-[#c5a059] py-2 border-b border-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] rounded-md transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
