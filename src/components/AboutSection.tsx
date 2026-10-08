import React from 'react';
import { Shield, Clock, Scissors, MapPin } from 'lucide-react';

interface AboutSectionProps {
  aboutText?: string;
  onOpenBooking: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  aboutText = 'Founded on the philosophy that modern masculine grooming should be an intentional ritual rather than a routine errand. SAIMAN brings together bespoke scissors craftsmanship, state-of-the-art taper techniques, and timeless straight-razor care in an intimate sanctuary designed for the modern gentleman.',
  onOpenBooking,
}) => {
  return (
    <section id="about" className="py-24 bg-[#0a0b0d] border-t border-[#1c1e26] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual Composition */}
          <div className="relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#262936] shadow-2xl">
              <img
                src="/src/assets/images/hero_barber_interior_1791309682849.jpg"
                alt="SAIMAN Barber Shop Interior"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center filter brightness-[0.88]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[#0e1015]/90 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#c5a059]/15 text-[#c5a059]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#f4f2ed]">Soho Studio Sanctuary</h4>
                    <p className="text-xs text-[#8c8980]">482 Grand Avenue, Suite 100, New York</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping small accent card */}
            <div className="hidden sm:block absolute -top-6 -right-6 bg-[#14161f] border border-[#2b2e3e] p-5 rounded-xl shadow-xl max-w-xs">
              <div className="flex items-center gap-2 text-xs font-mono text-[#c5a059] uppercase tracking-wider mb-1">
                <Scissors className="w-3.5 h-3.5" />
                <span>The Master Standard</span>
              </div>
              <p className="text-xs text-[#a09d94] leading-relaxed">
                Every appointment is reserved exclusively for one client at a time. Zero waiting queues.
              </p>
            </div>
          </div>

          {/* Right Column: Narrative */}
          <div>
            <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-[#c5a059] mb-3">
              <span>The Brand Story</span>
              <span aria-hidden="true">·</span>
              <span>Heritage</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#f4f2ed] tracking-tight mb-6">
              An Architectural Approach to Modern Grooming
            </h2>

            <p className="text-base text-[#9e9b92] leading-relaxed mb-6">
              {aboutText}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3.5">
                <div className="p-1 rounded bg-[#c5a059]/15 text-[#c5a059] mt-1 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#edebe6]">Individualized Consultation</h4>
                  <p className="text-xs text-[#858279] mt-0.5 leading-relaxed">
                    We analyze natural hair growth patterns, face geometry, and lifestyle before cutting a single follicle.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-1 rounded bg-[#c5a059]/15 text-[#c5a059] mt-1 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#edebe6]">Guaranteed Punctuality</h4>
                  <p className="text-xs text-[#858279] mt-0.5 leading-relaxed">
                    Our digital booking system prevents double-booking and guarantees your barber is prepared the moment you step inside.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#0a0b0d] bg-[#c5a059] hover:bg-[#dfbe7d] transition-colors rounded-md shadow-lg"
            >
              <span>Experience SAIMAN</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
